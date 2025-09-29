import {
  getFirestore,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const firestore = getFirestore(app);

export async function isUsernameTaken(username){
  const q = query(collection(firestore, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
