import { account, databases, ID, DATABASE_ID, COLLECTION_ID } from './appwrite';
import { Query } from 'appwrite';

export interface User {
  $id: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  sponsorId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  usdtAddress: string;
  profileImage?: string;
  country?: string;
  sponsorName?: string;
}

interface UserDocument {
  $id: string;
  userId: string;
  email: string;
  name: string;
  mobile: string;
  password: string; // Hashed password stored in database
  sponsorId?: string;
  sponsorName?: string;
  country?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  usdtAddress?: string;
  profileImage?: string;
}

// Helper function to generate a user ID (first 4 digits of phone + 2 random digits)
function generateUserId(phone: string): string {
  const firstFour = phone.replace(/\D/g, '').slice(0, 4);
  const randomTwo = Math.floor(10 + Math.random() * 90);
  return `${firstFour}${randomTwo}`;
}

// Register a new user
export async function registerUser(
  username: string,
  email: string,
  phone: string,
  password: string,
  sponsorId?: string,
  sponsorName?: string,
  country?: string
): Promise<{ success: boolean; userId: string }> {
  try {
    // Check if email exists in database
    try {
      const existingUsers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('email', email)]
      );
      if (existingUsers.documents.length > 0) {
        throw new Error('Email already registered');
      }
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        throw error;
      }
      // If database query fails, continue (might be first user)
    }

    // Generate user ID
    let userId = generateUserId(phone);
    let attempts = 0;
    let userIdExists = true;

    // Check if userId already exists in database
    while (userIdExists && attempts < 10) {
      try {
        const existingUsers = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.equal('userId', userId)]
        );
        if (existingUsers.documents.length === 0) {
          userIdExists = false;
        } else {
          userId = generateUserId(phone);
          attempts++;
        }
      } catch (error) {
        // If query fails, assume userId is available
        userIdExists = false;
      }
    }

    if (userIdExists) {
      throw new Error('Failed to create user. Please try again.');
    }

    // Create Appwrite account with email and password
    const appwriteUser = await account.create(ID.unique(), email, password, username);

    // Create user document in database
    const userDocument: Omit<UserDocument, '$id'> = {
      userId,
      email,
      name: username,
      mobile: phone,
      password: password, // In production, this should be hashed separately or not stored
      sponsorId: sponsorId || '',
      sponsorName: sponsorName || '',
      country: country || '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      usdtAddress: '',
    };

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      appwriteUser.$id, // Use Appwrite user ID as document ID
      userDocument
    );

    return {
      success: true,
      userId,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
}

// Login user using userId and password
export async function loginUser(
  userId: string,
  password: string
): Promise<{ success: boolean; user: User | null }> {
  try {
    // Find user by userId in database
    const userQuery = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (userQuery.documents.length === 0) {
      return { success: false, user: null };
    }

    const userDoc = userQuery.documents[0] as unknown as UserDocument;
    const userEmail = userDoc.email;

    // Authenticate with Appwrite using email and password
    try {
      await account.createEmailPasswordSession(userEmail, password);
    } catch (error: any) {
      console.error('Appwrite authentication error:', error);
      return { success: false, user: null };
    }

    // Get current Appwrite session to verify
    const session = await account.getSession('current');
    if (!session) {
      return { success: false, user: null };
    }

    // Build user object from database document
    const user: User = {
      $id: userDoc.$id,
      userId: userDoc.userId,
      name: userDoc.name,
      email: userDoc.email,
      mobile: userDoc.mobile,
      password: userDoc.password,
      sponsorId: userDoc.sponsorId || '',
      bankName: userDoc.bankName || '',
      accountNumber: userDoc.accountNumber || '',
      ifscCode: userDoc.ifscCode || '',
      usdtAddress: userDoc.usdtAddress || '',
      profileImage: userDoc.profileImage,
      country: userDoc.country,
      sponsorName: userDoc.sponsorName,
    };

    return { success: true, user };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, user: null };
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Check if there's an active Appwrite session
    const session = await account.getSession('current');
    if (!session) {
      return null;
    }

    // Get the Appwrite user account
    const appwriteUser = await account.get();

    // Find user document in database using Appwrite user ID
    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        appwriteUser.$id
      ) as unknown as UserDocument;

      // Build user object
      const user: User = {
        $id: userDoc.$id,
        userId: userDoc.userId,
        name: userDoc.name,
        email: userDoc.email,
        mobile: userDoc.mobile,
        password: userDoc.password,
        sponsorId: userDoc.sponsorId || '',
        bankName: userDoc.bankName || '',
        accountNumber: userDoc.accountNumber || '',
        ifscCode: userDoc.ifscCode || '',
        usdtAddress: userDoc.usdtAddress || '',
        profileImage: userDoc.profileImage,
        country: userDoc.country,
        sponsorName: userDoc.sponsorName,
      };

      return user;
    } catch (error) {
      console.error('Error fetching user document:', error);
      return null;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Sign out user
export async function signOut(): Promise<boolean> {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    // Try to delete all sessions
    try {
      await account.deleteSessions();
      return true;
    } catch {
      return false;
    }
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await account.getSession('current');
    return session !== null;
  } catch (error) {
    return false;
  }
}

// Update user data in database
export async function updateUserData(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    // Find user document by userId
    const userQuery = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (userQuery.documents.length === 0) {
      return null;
    }

    const userDoc = userQuery.documents[0];
    
    // Update document
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      userDoc.$id,
      updates
    ) as unknown as UserDocument;

    // Build and return updated user object
    const user: User = {
      $id: updatedDoc.$id,
      userId: updatedDoc.userId,
      name: updatedDoc.name,
      email: updatedDoc.email,
      mobile: updatedDoc.mobile,
      password: updatedDoc.password,
      sponsorId: updatedDoc.sponsorId || '',
      bankName: updatedDoc.bankName || '',
      accountNumber: updatedDoc.accountNumber || '',
      ifscCode: updatedDoc.ifscCode || '',
      usdtAddress: updatedDoc.usdtAddress || '',
      profileImage: updatedDoc.profileImage,
      country: updatedDoc.country,
      sponsorName: updatedDoc.sponsorName,
    };

    return user;
  } catch (error) {
    console.error('Update user error:', error);
    return null;
  }
}
