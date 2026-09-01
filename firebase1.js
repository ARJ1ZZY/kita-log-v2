import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArwI88JFfZHmt9cZeQOLUZ8N1X5voatic",
  authDomain: "kita-log.firebaseapp.com",
  projectId: "kita-log",
  storageBucket: "kita-log.firebasestorage.app",
  messagingSenderId: "39650736342",
  appId: "1:39650736342:web:15c004ee8691259b8ef177",
  measurementId: "G-Y1PM9NER5S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);