// app/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVaYKqpzIjLvDF5GCxtUbkfjAPI7FEGAo",
  authDomain: "lifeonepage.firebaseapp.com",
  databaseURL: "https://lifeonepage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lifeonepage",
  storageBucket: "lifeonepage.firebasestorage.app",
  messagingSenderId: "536810357686",
  appId: "1:536810357686:web:4972db836c2fb163037717",
  measurementId: "G-C0N6YQEGBX",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
