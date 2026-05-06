import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface Category {
  id?: string;
  name: string;
  slug: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const path = 'categories';
    try {
      const q = query(collection(db, path), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToCategories(callback: (categories: Category[]) => void) {
    const path = 'categories';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      callback(categories);
    }, (error) => {
      console.error("onSnapshot categories error:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async addCategory(category: Omit<Category, 'id'>) {
    const path = 'categories';
    try {
      return await addDoc(collection(db, path), category);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      return await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
