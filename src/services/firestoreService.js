import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOffline } from '../context/OfflineContext';

const CACHE_PREFIX = '@kita_log_cache_';
const QUEUE_KEY = '@kita_log_write_queue';

async function cacheData(key, data) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

async function getCachedData(key) {
  try {
    const data = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Cache read failed:', e);
    return null;
  }
}

async function addToQueue(operation) {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
    queue.push({ ...operation, id: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Queue write failed:', e);
  }
}

async function flushQueue() {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
    for (const op of queue) {
      try {
        switch (op.type) {
          case 'add':
            await addDoc(collection(db, op.collection), op.data);
            break;
          case 'update':
            await updateDoc(doc(db, op.collection, op.id), op.data);
            break;
          case 'delete':
            await deleteDoc(doc(db, op.collection, op.id));
            break;
          case 'set':
            await setDoc(doc(db, op.collection, op.id), op.data, { merge: true });
            break;
        }
      } catch (e) {
        console.error('Queue flush error for op', op, e);
        return;
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, '[]');
  } catch (e) {
    console.warn('Queue flush failed:', e);
  }
}

function setOfflineFlag() {
  // This function will be replaced by hook usage in components
  // We'll export a function to set the offline state globally via context.
  if (typeof globalThis.__setOffline === 'function') {
    globalThis.__setOffline(true);
  }
}

function clearOfflineFlag() {
  if (typeof globalThis.__setOffline === 'function') {
    globalThis.__setOffline(false);
  }
}

export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    await flushQueue();
    clearOfflineFlag();
    return docRef;
  } catch (e) {
    await addToQueue({ type: 'add', collection: collectionName, data });
    setOfflineFlag();
    throw e;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(doc(db, collectionName, docId), data);
    await flushQueue();
    clearOfflineFlag();
    return true;
  } catch (e) {
    await addToQueue({ type: 'update', collection: collectionName, id: docId, data });
    setOfflineFlag();
    throw e;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    await flushQueue();
    clearOfflineFlag();
    return true;
  } catch (e) {
    await addToQueue({ type: 'delete', collection: collectionName, id: docId });
    setOfflineFlag();
    throw e;
  }
};

export const setDocument = async (collectionName, docId, data) => {
  try {
    await setDoc(doc(db, collectionName, docId), data, { merge: true });
    await flushQueue();
    clearOfflineFlag();
    return true;
  } catch (e) {
    await addToQueue({ type: 'set', collection: collectionName, id: docId, data });
    setOfflineFlag();
    throw e;
  }
};

export const getSingleDocument = async (collectionName, docId) => {
  const cacheKey = `${collectionName}_${docId}`;
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    clearOfflineFlag();
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      await cacheData(cacheKey, data);
      return data;
    }
    return null;
  } catch (e) {
    setOfflineFlag();
    const cached = await getCachedData(cacheKey);
    return cached || null;
  }
};

export const getDocuments = async (collectionName, filters = []) => {
  const cacheKey = `${collectionName}_${JSON.stringify(filters)}`;
  try {
    let q = collection(db, collectionName);
    filters.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });
    const snap = await getDocs(q);
    clearOfflineFlag();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await cacheData(cacheKey, docs);
    return docs;
  } catch (e) {
    setOfflineFlag();
    const cached = await getCachedData(cacheKey);
    return cached || [];
  }
};