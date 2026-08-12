import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const addDocument = async (col, data) => addDoc(collection(db, col), data);
export const updateDocument = async (col, id, data) => updateDoc(doc(db, col, id), data);
export const deleteDocument = async (col, id) => deleteDoc(doc(db, col, id));
export const setDocument = async (col, id, data) => setDoc(doc(db, col, id), data, { merge: true });
export const getSingleDocument = async (col, id) => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const getDocuments = async (col, filters = []) => {
  let q = collection(db, col);
  filters.forEach(({ field, operator, value }) => q = query(q, where(field, operator, value)));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};