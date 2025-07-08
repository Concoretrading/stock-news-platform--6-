import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const db = getFirestore();

export async function deleteCatalyst(userId: string, id: string) {
  if (!id) {
    throw new Error('ID parameter is required');
  }

  // Fetch the catalyst to check ownership and get imageUrl
  const docRef = db.collection('catalysts').doc(id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    throw new Error('Catalyst not found');
  }

  const catalyst = docSnap.data();
  if (!catalyst) {
    throw new Error('Catalyst not found');
  }

  if (catalyst.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Delete image from Firebase Storage if it exists
  if (catalyst.imageUrl) {
    try {
      const storage = getStorage();
      // Extract the storage path from the imageUrl
      const bucket = storage.bucket();
      const url = new URL(catalyst.imageUrl);
      // The path after the bucket name
      const pathStart = url.pathname.indexOf('/') + 1;
      const filePath = url.pathname.substring(pathStart);
      await bucket.file(filePath).delete();
    } catch (err) {
      console.error('Error deleting image from storage:', err);
    }
  }

  // Delete the Firestore document
  await docRef.delete();
} 