import  { db, collection, query, where, getDocs, doc, getDoc } from '../firebase';
import { getOfflineData } from './offlineData';

// Helper function that attempts to fetch from Firestore but falls back to offline data
export async function safeFirestoreGet(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    
    // If document doesn't exist, try offline data
    return getOfflineData(collectionName, { id });
  } catch (error) {
    console.error(`Error fetching ${collectionName} document:`, error);
    // Return offline data on error
    return getOfflineData(collectionName, { id });
  }
}

// Helper function for collection queries with offline fallback
export async function safeFirestoreQuery(
  collectionName: string, 
  whereField?: string, 
  whereOperator?: any, 
  whereValue?: any
) {
  try {
    const collectionRef = collection(db, collectionName);
    
    // If where parameters are provided, create a query
    const queryRef = whereField 
      ? query(collectionRef, where(whereField, whereOperator, whereValue))
      : collectionRef;
    
    const snapshot = await getDocs(queryRef);
    
    if (!snapshot.empty) {
      const results: any[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    }
    
    // If no results, try offline data
    return getOfflineData(collectionName, { [whereField]: whereValue });
  } catch (error) {
    console.error(`Error querying ${collectionName} collection:`, error);
    // Return offline data on error
    return getOfflineData(collectionName, { [whereField]: whereValue });
  }
}
 