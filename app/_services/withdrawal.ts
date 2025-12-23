// Withdrawal Service - Using Appwrite for persistent storage

import { databases, ID, Permission, Role, DATABASE_ID, WITHDRAWAL_COLLECTION_ID, account } from './appwrite';
import { Query } from 'appwrite';
import { createWithdrawalTransaction } from './transactions';
import { decrementWalletBalance } from './wallet';

export interface WithdrawalRequest {
  $id?: string; // Appwrite document ID
  requestId: string;
  userId: string;
  amount: number;
  payInr: number;
  accountNumber: string;
  ifscCode: string;
  fullname: string;
  companyId: string;
  txnId: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

interface WithdrawalDocument {
  $id: string;
  requestId: string;
  userId: string;
  amount: number;
  payInr: number;
  accountNumber: string;
  ifscCode: string;
  fullname: string;
  companyId: string;
  txnId: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

// Generate a unique withdrawal request ID
function generateWithdrawalRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WTH-${timestamp}-${random}`;
}

// Generate a unique transaction ID
function generateTxnId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `TXN${timestamp}${random}`;
}

// Convert Appwrite document to WithdrawalRequest
function documentToWithdrawalRequest(doc: WithdrawalDocument): WithdrawalRequest {
  return {
    $id: doc.$id,
    requestId: doc.requestId,
    userId: doc.userId,
    amount: doc.amount,
    payInr: doc.payInr,
    accountNumber: doc.accountNumber,
    ifscCode: doc.ifscCode,
    fullname: doc.fullname,
    companyId: doc.companyId,
    txnId: doc.txnId,
    date: doc.date,
    status: doc.status,
  };
}

// Get all withdrawal requests from Appwrite
export async function getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      console.warn('Withdrawal collection ID not configured.');
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      [Query.orderDesc('date')] // Order by date descending (newest first)
    );

    return response.documents.map((doc) => 
      documentToWithdrawalRequest(doc as unknown as WithdrawalDocument)
    );
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }
}

// Create a new withdrawal request
export async function createWithdrawalRequest(
  userId: string,
  fullname: string,
  companyId: string,
  amount: number,
  accountNumber: string,
  ifscCode: string
): Promise<{ success: boolean; requestId: string; txnId: string }> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      throw new Error('Withdrawal collection ID not configured.');
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

    // Generate request ID and transaction ID
    const requestId = generateWithdrawalRequestId();
    const txnId = generateTxnId();

    // payInr is the same as amount for INR withdrawals
    const payInr = amount;

    // Create withdrawal request document in Appwrite
    const withdrawalDocument = {
      requestId,
      userId,
      amount,
      payInr,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(), // Store IFSC in uppercase
      fullname,
      companyId,
      txnId,
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

    // Create document
    await databases.createDocument(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      ID.unique(),
      withdrawalDocument,
      permissions // Will use collection-level permissions if undefined
    );

    console.log('✅ Withdrawal request created successfully!');
    console.log('   Request ID:', requestId);
    console.log('   Transaction ID:', txnId);

    return {
      success: true,
      requestId,
      txnId,
    };
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite collection permissions.');
      console.error('Collection ID:', WITHDRAWAL_COLLECTION_ID);
      console.error('Make sure CREATE permission is set for "users()" role in Appwrite Console.');
      throw new Error('Permission denied. Please check Appwrite collection permissions. Make sure CREATE permission is set for authenticated users.');
    }
    throw new Error(error.message || 'Failed to create withdrawal request. Please try again.');
  }
}

// Get withdrawal request by ID
export async function getWithdrawalRequestById(requestId: string): Promise<WithdrawalRequest | null> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      return null;
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      [Query.equal('requestId', requestId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    return documentToWithdrawalRequest(response.documents[0] as unknown as WithdrawalDocument);
  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    return null;
  }
}

// Get withdrawal requests by user ID
export async function getWithdrawalRequestsByUserId(userId: string): Promise<WithdrawalRequest[]> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToWithdrawalRequest(doc as unknown as WithdrawalDocument)
    );
  } catch (error) {
    console.error('Error fetching withdrawal requests by user ID:', error);
    return [];
  }
}

// Get withdrawal requests by status (for admin review)
export async function getWithdrawalRequestsByStatus(status: 'Pending' | 'Completed' | 'Failed'): Promise<WithdrawalRequest[]> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      [
        Query.equal('status', status),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToWithdrawalRequest(doc as unknown as WithdrawalDocument)
    );
  } catch (error) {
    console.error('Error fetching withdrawal requests by status:', error);
    return [];
  }
}

// Update withdrawal request status (for admin processing)
export async function updateWithdrawalRequestStatus(
  documentId: string,
  status: 'Pending' | 'Completed' | 'Failed'
): Promise<WithdrawalRequest | null> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      throw new Error('Withdrawal collection ID not configured.');
    }

    // Get the withdrawal request first to access its data
    const withdrawalRequest = await getWithdrawalRequestByDocumentId(documentId);
    if (!withdrawalRequest) {
      throw new Error('Withdrawal request not found.');
    }

    // Update the withdrawal request status
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      documentId,
      { status }
    ) as unknown as WithdrawalDocument;

    const updatedRequest = documentToWithdrawalRequest(updatedDoc);

    // If withdrawal is completed, create transaction and update wallet
    if (status === 'Completed' && withdrawalRequest.status !== 'Completed') {
      try {
        // Update wallet balance (deduct amount)
        const updatedWallet = await decrementWalletBalance(withdrawalRequest.userId, 'mainWallet', withdrawalRequest.amount);
        
        // Create transaction record with actual balance after update
        await createWithdrawalTransaction(
          withdrawalRequest.userId,
          withdrawalRequest.amount,
          'INR', // Withdrawals are typically in INR
          withdrawalRequest.requestId,
          'Completed',
          updatedWallet?.mainWallet
        );
        
        console.log('✅ Withdrawal completed: Wallet updated and transaction created');
      } catch (transactionError) {
        console.error('Error creating transaction or updating wallet for completed withdrawal:', transactionError);
        // Don't throw - the withdrawal status is already updated
        // Transaction creation failure shouldn't prevent withdrawal completion
      }
    }

    return updatedRequest;
  } catch (error) {
    console.error('Error updating withdrawal request status:', error);
    return null;
  }
}

// Helper function to get withdrawal request by document ID
async function getWithdrawalRequestByDocumentId(documentId: string): Promise<WithdrawalRequest | null> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      return null;
    }

    const doc = await databases.getDocument(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      documentId
    ) as unknown as WithdrawalDocument;

    return documentToWithdrawalRequest(doc);
  } catch (error) {
    console.error('Error fetching withdrawal request by document ID:', error);
    return null;
  }
}

