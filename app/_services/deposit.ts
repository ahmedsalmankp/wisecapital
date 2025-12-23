// Deposit Service - Using Appwrite for persistent storage

import { databases, storage, ID, Permission, Role, DATABASE_ID, DEPOSIT_COLLECTION_ID, STORAGE_BUCKET_ID, account } from './appwrite';
import { Query } from 'appwrite';

export interface DepositRequest {
  $id?: string; // Appwrite document ID
  requestId: string;
  token: string;
  userId: string;
  name: string;
  type: 'INR' | 'USD' | 'Crypto';
  amount: number;
  txnId: string;
  receiptUrl?: string; // URL to the uploaded receipt file
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface DepositDocument {
  $id: string;
  requestId: string;
  token: string;
  userId: string;
  name: string;
  type: 'INR' | 'USD' | 'Crypto';
  amount: number;
  txnId: string;
  receiptUrl?: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Generate a unique deposit request ID
function generateDepositRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEP-${timestamp}-${random}`;
}

// Generate a secure token for the deposit request
function generateDepositToken(): string {
  // Generate a random token using crypto API if available, otherwise use Math.random
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to hex string
  const token = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return token;
}

// Upload receipt file to Appwrite Storage
async function uploadReceipt(file: File, requestId: string): Promise<string | null> {
  try {
    if (!STORAGE_BUCKET_ID) {
      console.warn('Storage bucket ID not configured. Receipt will not be uploaded.');
      return null;
    }

    // Get current Appwrite user for permissions
    let appwriteUserId: string | null = null;
    try {
      const appwriteUser = await account.get();
      appwriteUserId = appwriteUser.$id;
    } catch (error) {
      console.warn('Could not get Appwrite user ID for file permissions:', error);
    }

    const fileId = ID.unique();
    const fileName = `${requestId}_${file.name}`;
    
    // Set file permissions - user can read their own files, or allow all authenticated users
    const filePermissions = appwriteUserId
      ? [Permission.read(Role.user(appwriteUserId))]
      : [Permission.read(Role.users())]; // Allow all authenticated users to read
    
    const uploadedFile = await storage.createFile(
      STORAGE_BUCKET_ID,
      fileId,
      file,
      filePermissions
    );

    // Get file URL for download/viewing
    // Note: In production, you might want to use a signed URL or CDN URL
    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    
    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    // Don't throw - allow deposit creation to continue without receipt
    return null;
  }
}

// Convert Appwrite document to DepositRequest
function documentToDepositRequest(doc: DepositDocument): DepositRequest {
  return {
    $id: doc.$id,
    requestId: doc.requestId,
    token: doc.token,
    userId: doc.userId,
    name: doc.name,
    type: doc.type,
    amount: doc.amount,
    txnId: doc.txnId,
    receiptUrl: doc.receiptUrl,
    date: doc.date,
    status: doc.status,
  };
}

// Get all deposit requests from Appwrite
export async function getDepositRequests(): Promise<DepositRequest[]> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      console.warn('Deposit collection ID not configured.');
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [Query.orderDesc('date')] // Order by date descending (newest first)
    );

    return response.documents.map((doc) => 
      documentToDepositRequest(doc as unknown as DepositDocument)
    );
  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    return [];
  }
}

// Create a new deposit request
export async function createDepositRequest(
  userId: string,
  name: string,
  type: 'INR' | 'USD' | 'Crypto',
  amount: number,
  txnId: string,
  receipt?: File | null
): Promise<{ success: boolean; requestId: string; token: string }> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      throw new Error('Deposit collection ID not configured.');
    }

    // Get current Appwrite user to set permissions
    let appwriteUserId: string | null = null;
    try {
      const appwriteUser = await account.get();
      appwriteUserId = appwriteUser.$id;
    } catch (error) {
      console.warn('Could not get Appwrite user ID for permissions:', error);
      // Continue without user-specific permissions - collection-level permissions should handle this
    }

    // Generate request ID and token
    const requestId = generateDepositRequestId();
    const token = generateDepositToken();

    // Upload receipt if provided
    let receiptUrl: string | undefined;
    if (receipt) {
      const uploadedUrl = await uploadReceipt(receipt, requestId);
      if (uploadedUrl) {
        receiptUrl = uploadedUrl;
      }
    }

    // Create deposit request document in Appwrite
    const depositDocument = {
      requestId,
      token,
      userId,
      name,
      type,
      amount,
      txnId,
      receiptUrl: receiptUrl || '',
      date: new Date().toISOString(),
      status: 'Pending' as const,
    };

    // Set document-level permissions if we have the user ID
    // Note: Collection-level permissions should also be set in Appwrite Console
    // for users() role to allow reading all documents
    const permissions = appwriteUserId
      ? [
          Permission.read(Role.user(appwriteUserId)),
          Permission.update(Role.user(appwriteUserId)),
        ]
      : undefined; // Use collection-level permissions if no user ID

    // Verify user is authenticated before creating document
    try {
      const session = await account.getSession('current');
      if (!session) {
        throw new Error('User not authenticated. Please login.');
      }
    } catch (error: any) {
      if (error.message.includes('not authenticated')) {
        throw error;
      }
      console.warn('Could not verify session, proceeding anyway:', error);
    }

    await databases.createDocument(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      ID.unique(),
      depositDocument,
      permissions // Will use collection-level permissions if undefined
    );

    return {
      success: true,
      requestId,
      token,
    };
  } catch (error: any) {
    console.error('Error creating deposit request:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite collection permissions.');
      console.error('Collection ID:', DEPOSIT_COLLECTION_ID);
      console.error('Make sure CREATE permission is set for "users()" role in Appwrite Console.');
      throw new Error('Permission denied. Please check Appwrite collection permissions. Make sure CREATE permission is set for authenticated users.');
    }
    throw new Error(error.message || 'Failed to create deposit request. Please try again.');
  }
}

// Get deposit request by ID
export async function getDepositRequestById(requestId: string): Promise<DepositRequest | null> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return null;
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [Query.equal('requestId', requestId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    return documentToDepositRequest(response.documents[0] as unknown as DepositDocument);
  } catch (error) {
    console.error('Error fetching deposit request:', error);
    return null;
  }
}

// Get deposit requests by user ID
export async function getDepositRequestsByUserId(userId: string): Promise<DepositRequest[]> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToDepositRequest(doc as unknown as DepositDocument)
    );
  } catch (error) {
    console.error('Error fetching deposit requests by user ID:', error);
    return [];
  }
}

// Get deposit requests by type
export async function getDepositRequestsByType(type: 'INR' | 'USD' | 'Crypto'): Promise<DepositRequest[]> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [
        Query.equal('type', type),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToDepositRequest(doc as unknown as DepositDocument)
    );
  } catch (error) {
    console.error('Error fetching deposit requests by type:', error);
    return [];
  }
}

// Get deposit requests by status (for admin review)
export async function getDepositRequestsByStatus(status: 'Pending' | 'Approved' | 'Rejected'): Promise<DepositRequest[]> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [
        Query.equal('status', status),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToDepositRequest(doc as unknown as DepositDocument)
    );
  } catch (error) {
    console.error('Error fetching deposit requests by status:', error);
    return [];
  }
}

// Update deposit request status (for admin approval/rejection)
export async function updateDepositRequestStatus(
  documentId: string,
  status: 'Pending' | 'Approved' | 'Rejected'
): Promise<DepositRequest | null> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      throw new Error('Deposit collection ID not configured.');
    }

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      documentId,
      { status }
    ) as unknown as DepositDocument;

    return documentToDepositRequest(updatedDoc);
  } catch (error) {
    console.error('Error updating deposit request status:', error);
    return null;
  }
}
