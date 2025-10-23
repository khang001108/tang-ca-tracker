import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyC7ZP0D6abx8L_wmLrRWqgaxOzLd865ecA",
  authDomain: "timework-faf59.firebaseapp.com",
  projectId: "timework-faf59",
  storageBucket: "timework-faf59.firebasestorage.app",
  messagingSenderId: "345529944919",
  appId: "1:345529944919:web:7b6d9138fe252c0febcc12",
  measurementId: "G-7VYZ5ZZMLC"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);