export const getAllSubmissions = async () => {
  // Example fetch from Firestore
  // Adjust path and logic as needed
  const submissions = [];
  const querySnapshot = await getDocs(collection(FIREBASE_DB, 'submissions'));
  querySnapshot.forEach((doc) => {
    submissions.push({ id: doc.id, ...doc.data() });
  });
  return submissions;
};
