import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { Transaction, Property } from '../types';

export const StorageService = {
  getProperties: async (): Promise<Property[]> => {
    const snapshot = await getDocs(collection(db, 'properties'));
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    
    // Seed basic data if Firestore is empty (to maintain demo experience)
    if (properties.length === 0) {
      const defaultProps = [
        { name: 'Apartamento Centro' },
        { name: 'Casa de Praia' }
      ];
      const addedProps = [];
      for (const p of defaultProps) {
        const ref = await addDoc(collection(db, 'properties'), p);
        addedProps.push({ id: ref.id, ...p });
      }
      return addedProps;
    }
    
    return properties;
  },

  addProperty: async (name: string): Promise<Property> => {
    const ref = await addDoc(collection(db, 'properties'), { name });
    return { id: ref.id, name };
  },

  updateProperty: async (id: string, name: string): Promise<void> => {
    await updateDoc(doc(db, 'properties', id), { name });
  },

  deleteProperty: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'properties', id));
    
    // Deleta transações associadas
    const q = query(collection(db, 'transactions'), where('propertyId', '==', id));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const snapshot = await getDocs(collection(db, 'transactions'));
    return snapshot.docs.map(doc => doc.data() as Transaction);
  },

  addTransaction: async (transaction: Transaction): Promise<void> => {
    // Uses setDoc with the client-generated ID to keep consistency with the frontend logic
    // The ID is stored both as the document key and as a field inside the document
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
  },

  addTransactionsBatch: async (transactions: Transaction[]): Promise<void> => {
    const batch = writeBatch(db);
    transactions.forEach(t => {
      const ref = doc(db, 'transactions', t.id);
      batch.set(ref, t);
    });
    await batch.commit();
  },

  updateTransaction: async (updated: Transaction): Promise<void> => {
    await updateDoc(doc(db, 'transactions', updated.id), updated as any);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'transactions', id));
  },

  deleteBatchByGroupId: async (groupId: string): Promise<void> => {
    const q = query(collection(db, 'transactions'), where('installment.groupId', '==', groupId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
};