// Wallet Service - Using Appwrite for persistent storage

import { databases, ID, Permission, Role, DATABASE_ID, WALLET_COLLECTION_ID, account } from './appwrite';
import { Query } from 'appwrite';

export interface Wallet {
  $id?: string; // Appwrite document ID
  userId: string;
  mainWallet: number;
  totalBonus: number;
  directBonus: number;
  levelBonus: number;
  lastUpdated: string;
}

interface WalletDocument {
  $id: string;
  userId: string;
  mainWallet: number;
  totalBonus: number;
  directBonus: number;
  levelBonus: number;
  lastUpdated: string;
}

// Convert Appwrite document to Wallet
function documentToWallet(doc: WalletDocument): Wallet {
  return {
    $id: doc.$id,
    userId: doc.userId,
    mainWallet: doc.mainWallet,
    totalBonus: doc.totalBonus,
    directBonus: doc.directBonus,
    levelBonus: doc.levelBonus,
    lastUpdated: doc.lastUpdated,
  };
}

// Get wallet by user ID
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  try {
    if (!WALLET_COLLECTION_ID) {
      console.warn('Wallet collection ID not configured.');
      return null;
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WALLET_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    return documentToWallet(response.documents[0] as unknown as WalletDocument);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
}

// Get or create wallet for a user (initializes if doesn't exist)
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  try {
    // Try to get existing wallet
    let wallet = await getWalletByUserId(userId);

    // If wallet doesn't exist, create a new one with default values
    if (!wallet) {
      wallet = await createWallet(userId);
    }

    return wallet;
  } catch (error) {
    console.error('Error getting or creating wallet:', error);
    throw error;
  }
}

// Create a new wallet with default values
export async function createWallet(userId: string, initialValues?: Partial<Wallet>): Promise<Wallet> {
  try {
    if (!WALLET_COLLECTION_ID) {
      throw new Error('Wallet collection ID not configured.');
    }

    // Check if wallet already exists
    const existingWallet = await getWalletByUserId(userId);
    if (existingWallet) {
      return existingWallet;
    }

    // Get current Appwrite user to set permissions
    let appwriteUserId: string | null = null;
    try {
      const appwriteUser = await account.get();
      appwriteUserId = appwriteUser.$id;
    } catch (error) {
      console.warn('Could not get Appwrite user ID for permissions:', error);
    }

    // Default wallet values
    const defaultWallet = {
      userId,
      mainWallet: initialValues?.mainWallet ?? 0,
      totalBonus: initialValues?.totalBonus ?? 0,
      directBonus: initialValues?.directBonus ?? 0,
      levelBonus: initialValues?.levelBonus ?? 0,
      lastUpdated: new Date().toISOString(),
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

    // Create wallet document in Appwrite
    const createdDoc = await databases.createDocument(
      DATABASE_ID,
      WALLET_COLLECTION_ID,
      ID.unique(),
      defaultWallet,
      permissions
    ) as unknown as WalletDocument;

    console.log('✅ Wallet created successfully for user:', userId);

    return documentToWallet(createdDoc);
  } catch (error: any) {
    console.error('Error creating wallet:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite collection permissions.');
      console.error('Collection ID:', WALLET_COLLECTION_ID);
      console.error('Make sure CREATE permission is set for "users()" role in Appwrite Console.');
      throw new Error('Permission denied. Please check Appwrite collection permissions. Make sure CREATE permission is set for authenticated users.');
    }
    throw new Error(error.message || 'Failed to create wallet. Please try again.');
  }
}

// Update wallet balances
export async function updateWallet(
  userId: string,
  updates: {
    mainWallet?: number;
    totalBonus?: number;
    directBonus?: number;
    levelBonus?: number;
  }
): Promise<Wallet | null> {
  try {
    if (!WALLET_COLLECTION_ID) {
      throw new Error('Wallet collection ID not configured.');
    }

    // Get existing wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet || !wallet.$id) {
      throw new Error('Wallet not found and could not be created.');
    }

    // Prepare update data
    const updateData: any = {
      lastUpdated: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (updates.mainWallet !== undefined) {
      updateData.mainWallet = updates.mainWallet;
    }
    if (updates.totalBonus !== undefined) {
      updateData.totalBonus = updates.totalBonus;
    }
    if (updates.directBonus !== undefined) {
      updateData.directBonus = updates.directBonus;
    }
    if (updates.levelBonus !== undefined) {
      updateData.levelBonus = updates.levelBonus;
    }

    // Update wallet document in Appwrite
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      WALLET_COLLECTION_ID,
      wallet.$id,
      updateData
    ) as unknown as WalletDocument;

    console.log('✅ Wallet updated successfully for user:', userId);

    return documentToWallet(updatedDoc);
  } catch (error: any) {
    console.error('Error updating wallet:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite collection permissions.');
      throw new Error('Permission denied. Please check Appwrite collection permissions.');
    }
    throw new Error(error.message || 'Failed to update wallet. Please try again.');
  }
}

// Increment wallet balance (add amount)
export async function incrementWalletBalance(
  userId: string,
  type: 'mainWallet' | 'totalBonus' | 'directBonus' | 'levelBonus',
  amount: number
): Promise<Wallet | null> {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found and could not be created.');
    }

    const currentValue = wallet[type];
    const newValue = currentValue + amount;

    return await updateWallet(userId, { [type]: newValue });
  } catch (error: any) {
    console.error('Error incrementing wallet balance:', error);
    throw error;
  }
}

// Decrement wallet balance (subtract amount)
export async function decrementWalletBalance(
  userId: string,
  type: 'mainWallet' | 'totalBonus' | 'directBonus' | 'levelBonus',
  amount: number
): Promise<Wallet | null> {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found and could not be created.');
    }

    const currentValue = wallet[type];
    const newValue = Math.max(0, currentValue - amount); // Prevent negative balances

    return await updateWallet(userId, { [type]: newValue });
  } catch (error: any) {
    console.error('Error decrementing wallet balance:', error);
    throw error;
  }
}

