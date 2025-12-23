// Transactions Service - Using Appwrite for persistent storage

import { databases, ID, Permission, Role, DATABASE_ID, TRANSACTIONS_COLLECTION_ID, account } from './appwrite';
import { Query } from 'appwrite';
import { getWalletByUserId } from './wallet';

export type TransactionType = 'Deposit' | 'Withdrawal' | 'Bonus' | 'Transfer';
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';

export interface Transaction {
  $id?: string; // Appwrite document ID
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string; // 'INR', 'USD', 'Crypto', etc.
  status: TransactionStatus;
  description: string;
  relatedRequestId?: string; // Links to deposit/withdrawal request ID
  date: string;
  balanceAfter: number; // Wallet balance after this transaction
}

interface TransactionDocument {
  $id: string;
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  relatedRequestId?: string;
  date: string;
  balanceAfter: number;
}

// Generate a unique transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `TXN-${timestamp}-${random}`;
}

// Convert Appwrite document to Transaction
function documentToTransaction(doc: TransactionDocument): Transaction {
  return {
    $id: doc.$id,
    transactionId: doc.transactionId,
    userId: doc.userId,
    type: doc.type,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status,
    description: doc.description,
    relatedRequestId: doc.relatedRequestId,
    date: doc.date,
    balanceAfter: doc.balanceAfter,
  };
}

/**
 * Create a new transaction record
 * This should be called whenever a financial transaction occurs
 * @param balanceAfter - Optional: The wallet balance after this transaction. If not provided, will be fetched from wallet.
 */
export async function createTransaction(
  userId: string,
  type: TransactionType,
  amount: number,
  currency: string,
  status: TransactionStatus,
  description: string,
  relatedRequestId?: string,
  balanceAfter?: number
): Promise<Transaction> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      const errorMsg = 'Transactions collection ID not configured. Please add NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID to your .env.local file.';
      console.error('❌', errorMsg);
      console.error('📝 Setup Instructions:');
      console.error('   1. Create a Transactions collection in Appwrite Console');
      console.error('   2. Add NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID to .env.local');
      console.error('   3. Set CREATE and READ permissions for users() role');
      throw new Error(errorMsg);
    }

    // Get current wallet balance if balanceAfter not provided
    let finalBalanceAfter = balanceAfter;
    if (finalBalanceAfter === undefined) {
      const wallet = await getWalletByUserId(userId);
      finalBalanceAfter = wallet?.mainWallet || 0;
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Get current Appwrite user to set permissions
    let appwriteUserId: string | null = null;
    try {
      const appwriteUser = await account.get();
      appwriteUserId = appwriteUser.$id;
    } catch (error) {
      console.warn('Could not get Appwrite user ID for permissions:', error);
    }

    // Create transaction document
    const transactionDocument = {
      transactionId,
      userId,
      type,
      amount,
      currency,
      status,
      description,
      relatedRequestId,
      date: new Date().toISOString(),
      balanceAfter: finalBalanceAfter,
    };

    // Set document-level permissions if we have the user ID
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

    // Create document in Appwrite
    const createdDoc = await databases.createDocument(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      ID.unique(),
      transactionDocument,
      permissions
    ) as unknown as TransactionDocument;

    console.log('✅ Transaction created successfully!');
    console.log('   Transaction ID:', transactionId);
    console.log('   Type:', type);
    console.log('   Amount:', amount, currency);

    return documentToTransaction(createdDoc);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Transactions collection permissions issue.');
      console.error('Collection ID:', TRANSACTIONS_COLLECTION_ID || 'NOT CONFIGURED');
      console.error('Possible issues:');
      console.error('1. Transactions collection does not exist in Appwrite');
      console.error('2. NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID not set in .env.local');
      console.error('3. CREATE permission not set for "users()" role in Appwrite Console');
      console.error('4. Collection attributes do not match the expected schema');
      throw new Error('Transaction creation failed: Check Appwrite collection setup and permissions.');
    }
    if (error.code === 404) {
      console.error('404 Not Found: Transactions collection does not exist.');
      console.error('Please create the Transactions collection in Appwrite Console first.');
      throw new Error('Transaction creation failed: Transactions collection not found.');
    }
    throw new Error(error.message || 'Failed to create transaction. Please try again.');
  }
}

/**
 * Create a transaction for a deposit approval
 * @param balanceAfter - The wallet balance after the deposit (should be fetched after wallet update)
 */
export async function createDepositTransaction(
  userId: string,
  amount: number,
  currency: string,
  requestId: string,
  status: TransactionStatus = 'Completed',
  balanceAfter?: number
): Promise<Transaction> {
  const description = `Deposit of ${amount} ${currency} - Request ID: ${requestId}`;
  return createTransaction(
    userId,
    'Deposit',
    amount,
    currency,
    status,
    description,
    requestId,
    balanceAfter
  );
}

/**
 * Create a transaction for a withdrawal completion
 * @param balanceAfter - The wallet balance after the withdrawal (should be fetched after wallet update)
 */
export async function createWithdrawalTransaction(
  userId: string,
  amount: number,
  currency: string,
  requestId: string,
  status: TransactionStatus = 'Completed',
  balanceAfter?: number
): Promise<Transaction> {
  const description = `Withdrawal of ${amount} ${currency} - Request ID: ${requestId}`;
  return createTransaction(
    userId,
    'Withdrawal',
    amount,
    currency,
    status,
    description,
    requestId,
    balanceAfter
  );
}

/**
 * Create a transaction for a bonus
 */
export async function createBonusTransaction(
  userId: string,
  amount: number,
  currency: string,
  bonusType: string,
  description?: string
): Promise<Transaction> {
  const desc = description || `Bonus: ${bonusType} - ${amount} ${currency}`;
  return createTransaction(
    userId,
    'Bonus',
    amount,
    currency,
    'Completed',
    desc
  );
}

/**
 * Create a transaction for a transfer
 */
export async function createTransferTransaction(
  userId: string,
  amount: number,
  currency: string,
  toUserId: string,
  description?: string
): Promise<Transaction> {
  const desc = description || `Transfer of ${amount} ${currency} to user ${toUserId}`;
  return createTransaction(
    userId,
    'Transfer',
    amount,
    currency,
    'Completed',
    desc
  );
}

/**
 * Get all transactions for a user
 */
export async function getTransactionsByUserId(
  userId: string,
  limit?: number
): Promise<Transaction[]> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      console.warn('Transactions collection ID not configured.');
      return [];
    }

    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('date')
    ];

    if (limit) {
      queries.push(Query.limit(limit));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      queries
    );

    return response.documents.map((doc) => 
      documentToTransaction(doc as unknown as TransactionDocument)
    );
  } catch (error) {
    console.error('Error fetching transactions by user ID:', error);
    return [];
  }
}

/**
 * Get all transactions
 */
export async function getAllTransactions(limit?: number): Promise<Transaction[]> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      console.warn('Transactions collection ID not configured.');
      return [];
    }

    const queries = [Query.orderDesc('date')];

    if (limit) {
      queries.push(Query.limit(limit));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      queries
    );

    return response.documents.map((doc) => 
      documentToTransaction(doc as unknown as TransactionDocument)
    );
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
}

/**
 * Get transactions by type
 */
export async function getTransactionsByType(
  type: TransactionType,
  userId?: string,
  limit?: number
): Promise<Transaction[]> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      console.warn('Transactions collection ID not configured.');
      return [];
    }

    const queries = [
      Query.equal('type', type),
      Query.orderDesc('date')
    ];

    if (userId) {
      queries.unshift(Query.equal('userId', userId));
    }

    if (limit) {
      queries.push(Query.limit(limit));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      queries
    );

    return response.documents.map((doc) => 
      documentToTransaction(doc as unknown as TransactionDocument)
    );
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    return [];
  }
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(
  status: TransactionStatus,
  userId?: string,
  limit?: number
): Promise<Transaction[]> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      console.warn('Transactions collection ID not configured.');
      return [];
    }

    const queries = [
      Query.equal('status', status),
      Query.orderDesc('date')
    ];

    if (userId) {
      queries.unshift(Query.equal('userId', userId));
    }

    if (limit) {
      queries.push(Query.limit(limit));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      queries
    );

    return response.documents.map((doc) => 
      documentToTransaction(doc as unknown as TransactionDocument)
    );
  } catch (error) {
    console.error('Error fetching transactions by status:', error);
    return [];
  }
}

/**
 * Get transaction by transaction ID
 */
export async function getTransactionByTransactionId(
  transactionId: string
): Promise<Transaction | null> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      return null;
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      [Query.equal('transactionId', transactionId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    return documentToTransaction(response.documents[0] as unknown as TransactionDocument);
  } catch (error) {
    console.error('Error fetching transaction by transaction ID:', error);
    return null;
  }
}

/**
 * Get transactions by related request ID (e.g., deposit or withdrawal request)
 */
export async function getTransactionsByRequestId(
  relatedRequestId: string
): Promise<Transaction[]> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      [
        Query.equal('relatedRequestId', relatedRequestId),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToTransaction(doc as unknown as TransactionDocument)
    );
  } catch (error) {
    console.error('Error fetching transactions by request ID:', error);
    return [];
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  documentId: string,
  status: TransactionStatus
): Promise<Transaction | null> {
  try {
    if (!TRANSACTIONS_COLLECTION_ID) {
      throw new Error('Transactions collection ID not configured.');
    }

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      TRANSACTIONS_COLLECTION_ID,
      documentId,
      { status }
    ) as unknown as TransactionDocument;

    return documentToTransaction(updatedDoc);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return null;
  }
}

/**
 * Get transaction statistics for a user
 */
export interface TransactionStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalBonuses: number;
  totalTransfers: number;
  totalTransactions: number;
}

export async function getTransactionStats(userId: string): Promise<TransactionStats> {
  try {
    const transactions = await getTransactionsByUserId(userId);
    
    const stats: TransactionStats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalBonuses: 0,
      totalTransfers: 0,
      totalTransactions: transactions.length,
    };

    transactions.forEach((txn) => {
      if (txn.status === 'Completed') {
        switch (txn.type) {
          case 'Deposit':
            stats.totalDeposits += txn.amount;
            break;
          case 'Withdrawal':
            stats.totalWithdrawals += txn.amount;
            break;
          case 'Bonus':
            stats.totalBonuses += txn.amount;
            break;
          case 'Transfer':
            stats.totalTransfers += txn.amount;
            break;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error calculating transaction stats:', error);
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalBonuses: 0,
      totalTransfers: 0,
      totalTransactions: 0,
    };
  }
}

