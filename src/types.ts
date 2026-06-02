export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface WishItem {
  id: string;
  name: string;
  description: string;
  price: number | string | null;
  link: string;
  photo: string;
  listId: 'pipino' | 'pipina';
  listOwner: string;
  createdBy: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  isReserved: boolean;
  reservedBy: string | null;
  reservedAt: any; // Firestore Timestamp or null
}

export type UserProfile = {
  email: string;
  displayName: string;
  photoURL: string;
  role: 'pipino' | 'pipina';
};
