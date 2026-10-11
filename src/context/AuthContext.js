import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getSampleInventory, getSampleTransactions } from '../utils/sampleData';
import { useLoading } from './LoadingContext';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const ACTIVE_BUSINESS_KEY = '@kita_log_active_business';

const storage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
      return null;
    } catch { return null; }
  },
  setItem: (key, value) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
  },
};

const seedBusinessData = async (businessId, businessType) => {
  try {
    const inventoryItems = getSampleInventory(businessType);
    const transactions = getSampleTransactions(businessId);
    for (const item of inventoryItems) {
      await addDoc(collection(db, 'inventory'), { ...item, business_id: businessId, created_at: new Date().toISOString() });
    }
    for (const tx of transactions) {
      await addDoc(collection(db, 'transactions'), tx);
    }
  } catch (e) {
    console.error('Seeding error (business still created):', e);
  }
};

export const AuthProvider = ({ children }) => {
  const { showLoading, hideLoading } = useLoading();
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const fetchBusinesses = async (uid) => {
    const q = query(collection(db, 'businesses'), where('owner_uid', '==', uid));
    const snap = await getDocs(q);
    const bizList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setBusinesses(bizList);
    return bizList;
  };

  const fetchUnlocked = async (uid) => {
    const settingsDoc = await getDoc(doc(db, 'user_settings', uid));
    if (settingsDoc.exists()) {
      const isUnlocked = settingsDoc.data().business_limit_unlocked || false;
      setUnlocked(isUnlocked);
      return isUnlocked;
    }
    return false;
  };

  const loadActiveBusiness = async (uid) => {
    const bizList = await fetchBusinesses(uid);
    if (bizList.length === 0) {
      setActiveBusinessId(null);
      setShowAddBusinessModal(false);
      return;
    }
    setShowAddBusinessModal(false);
    const storedId = storage.getItem(ACTIVE_BUSINESS_KEY);
    const found = bizList.find(b => b.id === storedId);
    const activeId = found ? found.id : bizList[0].id;
    setActiveBusinessId(activeId);
    if (!found) {
      storage.setItem(ACTIVE_BUSINESS_KEY, activeId);
    }
  };

  useEffect(() => {
    let fallbackTimer = setTimeout(() => {
      setLoading(false);
      setAuthReady(true);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimer);
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) setUser(prev => ({ ...prev, ...userDoc.data() }));
        } catch (e) { console.warn('Could not fetch user doc'); }
        try {
          await loadActiveBusiness(firebaseUser.uid);
          await fetchUnlocked(firebaseUser.uid);
        } catch (e) { console.warn('Could not load business data:', e); }
      } else {
        setUser(null);
        setBusinesses([]);
        setActiveBusinessId(null);
        setUnlocked(false);
        setShowAddBusinessModal(false);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const register = async (email, password, username, companyName, businessType) => {
    showLoading('Creating your account...');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;
      await setDoc(doc(db, 'users', uid), { username, email, created_at: new Date().toISOString() });
      setShowAddBusinessModal(false);
    } catch (e) {
      console.error('Register error:', e);
      throw e;
    } finally {
      hideLoading();
    }
  };

  const login = async (email, password) => {
    showLoading('Signing you in...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    } finally {
      hideLoading();
    }
  };

  const logout = async () => {
    showLoading('Logging out...');
    try {
      await signOut(auth);
      storage.removeItem(ACTIVE_BUSINESS_KEY);
      setUser(null);
      setBusinesses([]);
      setActiveBusinessId(null);
      setUnlocked(false);
      setShowAddBusinessModal(false);
      setAuthReady(true);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      hideLoading();
    }
  };

  const addBusiness = async (businessName, businessType) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return { error: 'no_user' };
    const uid = currentUser.uid;
    showLoading('Creating your new business...');
    try {
      const isUnlocked = await fetchUnlocked(uid);
      const currentBizList = await fetchBusinesses(uid);
      if (!isUnlocked && currentBizList.length >= 2) {
        return { error: 'limit_reached' };
      }

      const newBiz = {
        business_name: businessName,
        business_type: businessType,
        owner_uid: uid,
        currency_symbol: '₱',
        date_format: 'MM/DD/YYYY',
        created_at: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'businesses'), newBiz);
      const businessId = docRef.id;
      await seedBusinessData(businessId, businessType);

      await fetchBusinesses(uid);
      setActiveBusinessId(businessId);
      storage.setItem(ACTIVE_BUSINESS_KEY, businessId);
      setShowAddBusinessModal(false);
      return { success: true, businessId };
    } catch (e) {
      console.error('Add business error:', e);
      return { error: 'add_failed', message: e.message };
    } finally {
      hideLoading();
    }
  };

  const deleteBusiness = async (businessId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const uid = currentUser.uid;
    showLoading('Deleting business...');
    try {
      // ✅ Step 1: Delete all related documents FIRST
      const collectionsToDelete = ['inventory', 'transactions', 'budgets', 'recurring_transactions'];
      for (const col of collectionsToDelete) {
        const q = query(collection(db, col), where('business_id', '==', businessId));
        const snap = await getDocs(q);
        // Delete each doc; ignore permission errors on stale documents
        await Promise.all(
          snap.docs.map(d =>
            deleteDoc(doc(db, col, d.id)).catch(err => {
              console.warn(`Skipping ${col}/${d.id}:`, err.code);
            })
          )
        );
      }

      // ✅ Step 2: Delete the business document LAST
      await deleteDoc(doc(db, 'businesses', businessId));

      // Update local state
      const updatedBiz = await fetchBusinesses(uid);
      if (updatedBiz.length === 0) {
        setActiveBusinessId(null);
        storage.removeItem(ACTIVE_BUSINESS_KEY);
        setShowAddBusinessModal(false);
      } else if (activeBusinessId === businessId) {
        const newActiveId = updatedBiz[0].id;
        setActiveBusinessId(newActiveId);
        storage.setItem(ACTIVE_BUSINESS_KEY, newActiveId);
      }
    } catch (e) {
      console.error('Delete business error:', e);
    } finally {
      hideLoading();
    }
  };

  const unlockUnlimited = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    showLoading('Processing payment...');
    try {
      await setDoc(doc(db, 'user_settings', currentUser.uid), { business_limit_unlocked: true }, { merge: true });
      setUnlocked(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      hideLoading();
    }
  };

  const cancelPlan = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    showLoading('Cancelling plan...');
    try {
      await setDoc(doc(db, 'user_settings', currentUser.uid), { business_limit_unlocked: false }, { merge: true });
      setUnlocked(false);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      hideLoading();
    }
  };

  const openAddBusinessModal = () => setShowAddBusinessModal(true);
  const closeAddBusinessModal = () => setShowAddBusinessModal(false);

  const switchBusiness = (businessId) => {
    setActiveBusinessId(businessId);
    storage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  };

  const value = {
    user,
    businesses,
    activeBusinessId,
    unlocked,
    showAddBusinessModal,
    loading,
    register,
    login,
    logout,
    addBusiness,
    deleteBusiness,
    unlockUnlimited,
    cancelPlan,
    openAddBusinessModal,
    closeAddBusinessModal,
    switchBusiness,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};