// Deposit Service - Using Appwrite for persistent storage

import { databases, storage, ID, Permission, Role, DATABASE_ID, DEPOSIT_COLLECTION_ID, STORAGE_BUCKET_ID, account } from './appwrite';
import { Query } from 'appwrite';
import { createDepositTransaction } from './transactions';
import { incrementWalletBalance } from './wallet';

export interface DepositRequest {
  $id?: string; // Appwrite document ID
  requestId: string;
  token: string;
  userId: string;
  name: string;
  type: 'INR' | 'USD' | 'Crypto';
  amount: number;
  txnId: string;
  receiptFileId?: string; // File ID from Appwrite Storage (not full URL due to length limit)
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
  receiptFileId?: string; // File ID from Appwrite Storage
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Generate a unique deposit request ID
function generateDepositRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEP-${timestamp}-${random}`;
}

// Generate a secure token for the deposit request (max 50 chars for Appwrite)
function generateDepositToken(): string {
  // Generate a random token - using 24 bytes to get 48 hex chars (under 50 char limit)
  const array = new Uint8Array(24);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to hex string (24 bytes = 48 hex characters, under 50 char limit)
  const token = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return token;
}

// Upload receipt file to Appwrite Storage
// Returns the file ID (not full URL) to store in database due to length constraints
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

    // Return only the file ID (not full URL) to store in database
    // The file ID is shorter and can be used to construct the URL when needed
    return uploadedFile.$id;
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite storage bucket permissions.');
      console.error('Storage Bucket ID:', STORAGE_BUCKET_ID);
      console.error('Make sure CREATE permission is set for "users()" role in Appwrite Console.');
    }
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
    receiptFileId: doc.receiptFileId,
    date: doc.date,
    status: doc.status,
  };
}

// Helper function to get receipt URL from file ID
export function getReceiptUrl(fileId: string | undefined): string | null {
  if (!fileId || !STORAGE_BUCKET_ID) {
    return null;
  }
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  if (!projectId) {
    console.warn('Appwrite project ID not configured. Cannot generate receipt URL.');
    return null;
  }
  return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
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
    // Store file ID and generate URL for storage in receiptUrl field (which exists in collection)
    let receiptFileId: string | undefined;
    let receiptUrl: string | null = null;
    if (receipt) {
      console.log('Attempting to upload receipt file:', receipt.name);
      const uploadedFileId = await uploadReceipt(receipt, requestId);
      if (uploadedFileId) {
        receiptFileId = uploadedFileId;
        receiptUrl = getReceiptUrl(uploadedFileId);
        console.log('✅ Receipt uploaded successfully!');
        console.log('   File ID:', uploadedFileId);
        console.log('   Receipt URL:', receiptUrl);
      } else {
        console.warn('❌ Failed to upload receipt file. Deposit will be created without receipt.');
      }
    } else {
      console.log('No receipt file provided.');
    }

    // Create deposit request document in Appwrite
    const depositDocument: any = {
      requestId,
      token,
      userId,
      name,
      type,
      amount,
      txnId,
      date: new Date().toISOString(),
      status: 'Pending' as const,
    };

    // Add receipt information if available (only include fields that exist in collection)
    if (receiptUrl) {
      depositDocument.receiptUrl = receiptUrl;
    }
    if (receiptFileId) {
      depositDocument.receiptFileId = receiptFileId;
    }

    // Set document-level permissions if we have the user ID
    const permissions = appwriteUserId
      ? [
          Permission.read(Role.user(appwriteUserId)),
          Permission.update(Role.user(appwriteUserId)),
        ]
      : undefined;

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

    // Create document - if unknown attribute error occurs, retry without receipt fields
    try {
      await databases.createDocument(
        DATABASE_ID,
        DEPOSIT_COLLECTION_ID,
        ID.unique(),
        depositDocument,
        permissions
      );
      console.log('✅ Deposit request created successfully!');
    } catch (createError: any) {
      // If error is due to unknown receipt attribute, retry without receipt fields
      if (createError.message?.toLowerCase().includes('unknown attribute') && 
          (receiptUrl || receiptFileId)) {
        console.warn('Receipt attribute not found in collection. Creating deposit without receipt info.');
        const { receiptUrl: _, receiptFileId: __, ...documentWithoutReceipt } = depositDocument;
        
        await databases.createDocument(
          DATABASE_ID,
          DEPOSIT_COLLECTION_ID,
          ID.unique(),
          documentWithoutReceipt,
          permissions
        );
        console.warn('Deposit created but receipt was not stored. Add receiptUrl or receiptFileId attribute to collection.');
      } else {
        throw createError;
      }
    }

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
    if (error.message && error.message.includes('Unknown attribute')) {
      console.error('Collection schema error:', error.message);
      console.error('The collection is missing an attribute. Options:');
      console.error('1. Add "receiptFileId" attribute (string, optional, max 20 chars) to your collection');
      console.error('2. Or remove receiptFileId from the code if you don\'t need to store file IDs');
      throw new Error('Collection schema mismatch. Please add "receiptFileId" attribute (string, optional, max 20 chars) to your Deposit Requests collection in Appwrite Console, or contact support.');
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

    // Get the deposit request first to access its data
    const depositRequest = await getDepositRequestByDocumentId(documentId);
    if (!depositRequest) {
      throw new Error('Deposit request not found.');
    }

    // Update the deposit request status
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      documentId,
      { status }
    ) as unknown as DepositDocument;

    const updatedRequest = documentToDepositRequest(updatedDoc);

    // If deposit is approved, create transaction and update wallet
    if (status === 'Approved' && depositRequest.status !== 'Approved') {
      try {
        // Update wallet balance
        const updatedWallet = await incrementWalletBalance(depositRequest.userId, 'mainWallet', depositRequest.amount);
        
        // Create transaction record with actual balance after update
        await createDepositTransaction(
          depositRequest.userId,
          depositRequest.amount,
          depositRequest.type,
          depositRequest.requestId,
          'Completed',
          updatedWallet?.mainWallet
        );
        
        console.log('✅ Deposit approved: Wallet updated and transaction created');
      } catch (transactionError) {
        console.error('Error creating transaction or updating wallet for approved deposit:', transactionError);
        // Don't throw - the deposit status is already updated
        // Transaction creation failure shouldn't prevent deposit approval
      }
    }

    return updatedRequest;
  } catch (error) {
    console.error('Error updating deposit request status:', error);
    return null;
  }
}

// Helper function to get deposit request by document ID
async function getDepositRequestByDocumentId(documentId: string): Promise<DepositRequest | null> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return null;
    }

    const doc = await databases.getDocument(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      documentId
    ) as unknown as DepositDocument;

    return documentToDepositRequest(doc);
  } catch (error) {
    console.error('Error fetching deposit request by document ID:', error);
    return null;
  }
}
