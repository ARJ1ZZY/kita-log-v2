// firebase.js – Simple Firebase JS SDK (Web Only)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyArwI88JFfZHmt9cZeQOLUZ8N1X5voatic",
  authDomain: "kita-log.firebaseapp.com",
  projectId: "kita-log",
  storageBucket: "kita-log.firebasestorage.app",
  messagingSenderId: "39650736342",
  appId: "1:39650736342:web:15c004ee8691259b8ef177"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };