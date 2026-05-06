import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface Work {
  id?: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  createdAt: any;
  updatedAt?: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const workService = {
  async getAllWorks(): Promise<Work[]> {
    const path = 'works';
    try {
      console.log(`getAllWorks: fetching from path: ${path} [DB: ${db.app.options.projectId}]`);
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      console.log(`getAllWorks: found ${querySnapshot.size} documents`);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Work[];
    } catch (error) {
      console.error(`getAllWorks error:`, error);
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToWorks(callback: (works: Work[]) => void) {
    const path = 'works';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const works = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Work[];
      callback(works);
    }, (error) => {
      console.error("onSnapshot works error:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async addWork(work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>) {
    const path = 'works';
    try {
      return await addDoc(collection(db, path), {
        ...work,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateWork(id: string, work: Partial<Omit<Work, 'id' | 'createdAt'>>) {
    const path = `works/${id}`;
    try {
      const workRef = doc(db, 'works', id);
      return await updateDoc(workRef, {
        ...work,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteWork(id: string) {
    const path = `works/${id}`;
    try {
      const workRef = doc(db, 'works', id);
      return await deleteDoc(workRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
