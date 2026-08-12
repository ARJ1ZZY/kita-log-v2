import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyArwI88JFfZHmt9cZeQOLUZ8N1X5voatic",
  authDomain: "kita-log.firebaseapp.com",
  projectId: "kita-log",
  storageBucket: "kita-log.firebasestorage.app",
  messagingSenderId: "39650736342",
  appId: "1:39650736342:web:15c004ee8691259b8ef177"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Use Firebase Auth REST API instead of SDK (avoids native module issues in Expo Go)
const API_KEY = firebaseConfig.apiKey;
const BASE_URL = `https://identitytoolkit.googleapis.com/v1`;

export const authAPI = {
  signUp: async (email, password) => {
    const res = await fetch(`${BASE_URL}/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) throw { code: data.error?.message?.replace(/\s+/g, '-')?.toLowerCase(), message: data.error?.message };
    return data;
  },
  signIn: async (email, password) => {
    const res = await fetch(`${BASE_URL}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) throw { code: data.error?.message?.replace(/\s+/g, '-')?.toLowerCase(), message: data.error?.message };
    return data;
  },
  getAccountInfo: async (idToken) => {
    const res = await fetch(`${BASE_URL}/accounts:lookup?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    return res.json();
  },
};