import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, updateDoc, deleteDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const QUEUE_KEY = '@kita_log_write_queue';

export async function syncAllQueuedOperations() {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueData) return;

    const queue = JSON.parse(queueData);
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} queued operations...`);

    const failedOperations = [];

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
          default:
            console.warn('Unknown operation type:', op.type);
        }
      } catch (error) {
        console.error(`❌ Failed to sync operation:`, op, error);
        failedOperations.push(op);
      }
    }

    // Keep failed operations in queue, remove successful ones
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedOperations));

    console.log(`✅ Sync complete. ${queue.length - failedOperations.length} succeeded, ${failedOperations.length} failed`);

    return { succeeded: queue.length - failedOperations.length, failed: failedOperations.length };
  } catch (error) {
    console.error('❌ Sync service error:', error);
    throw error;
  }
}

export async function getQueueSize() {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueData) return 0;
    return JSON.parse(queueData).length;
  } catch {
    return 0;
  }
}

export async function clearSyncQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, '[]');
  } catch (e) {
    console.warn('Failed to clear queue:', e);
  }
}