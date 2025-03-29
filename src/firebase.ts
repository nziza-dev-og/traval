import  { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  addDoc,
  enableIndexedDbPersistence,
  limit
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMyJcibKRovcFpYBY1Ov7CQiUFDH709SY",
  authDomain: "test-e528e.firebaseapp.com",
  projectId: "test-e528e",
  storageBucket: "test-e528e.firebasestorage.app",
  messagingSenderId: "159926090518",
  appId: "1:159926090518:web:7b11ac28cf2f84f2f5ae37",
  measurementId: "G-8NWGLPLHHT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence when possible
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Offline persistence enabled");
    })
    .catch((err) => {
      console.error("Error enabling offline persistence:", err);
    });
} catch (error) {
  console.error("Offline persistence setup error:", error);
}

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  addDoc,
  limit
};
 