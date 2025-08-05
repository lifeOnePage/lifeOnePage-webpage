export default isUsernameTaken = async (username) => {
  const q = query(collection(firestore, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
