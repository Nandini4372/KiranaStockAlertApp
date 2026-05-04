import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, Sale, StoreProfile } from '../types';
import { OperationType, handleFirestoreError } from './utils';

export async function getInventory(ownerId: string) {
  try {
    const q = query(
      collection(db, 'inventory'), 
      where('ownerId', '==', ownerId),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'inventory');
    return [];
  }
}

export async function addInventoryItem(item: InventoryItem) {
  try {
    const docRef = await addDoc(collection(db, 'inventory'), item);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  try {
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await deleteDoc(doc(db, 'inventory', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
  }
}

export async function recordSale(sale: Omit<Sale, 'timestamp'>, profile: StoreProfile) {
  try {
    await runTransaction(db, async (transaction) => {
      const itemRef = doc(db, 'inventory', sale.itemId);
      const itemSnap = await transaction.get(itemRef);

      if (!itemSnap.exists()) {
        throw new Error("Item does not exist!");
      }

      const currentQty = itemSnap.data().quantity;
      if (currentQty < sale.quantity) {
        throw new Error("Insufficient stock!");
      }

      const newQty = currentQty - sale.quantity;
      transaction.update(itemRef, { quantity: newQty });

      const saleRef = doc(collection(db, 'sales'));
      transaction.set(saleRef, {
        ...sale,
        timestamp: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sales');
  }
}

export async function getSales(ownerId: string) {
  try {
    const q = query(
      collection(db, 'sales'),
      where('ownerId', '==', ownerId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'sales');
    return [];
  }
}

export async function updateProfile(uid: string, profile: StoreProfile) {
  try {
    await setDoc(doc(db, 'profiles', uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${uid}`);
  }
}
