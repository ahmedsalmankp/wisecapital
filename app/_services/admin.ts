// Admin Service - Admin-only operations

import { databases, DATABASE_ID, COLLECTION_ID, DEPOSIT_COLLECTION_ID, WITHDRAWAL_COLLECTION_ID } from './appwrite';
import { Query } from 'appwrite';
import { User } from './auth';
import { DepositRequest, updateDepositRequestStatus } from './deposit';
import { WithdrawalRequest, updateWithdrawalRequestStatus } from './withdrawal';
import { SupportTicket, getAllSupportTickets, updateSupportTicket } from './support';
import { Wallet, updateWallet, getWalletByUserId as getWallet } from './wallet';
import { getCurrentUser } from './auth';

// Check if current user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return user.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.orderDesc('$createdAt')]
    );

    return response.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      email: doc.email,
      mobile: doc.mobile,
      password: doc.password || '',
      sponsorId: doc.sponsorId || '',
      bankName: doc.bankName || '',
      accountNumber: doc.accountNumber || '',
      ifscCode: doc.ifscCode || '',
      usdtAddress: doc.usdtAddress || '',
      profileImage: doc.profileImage,
      country: doc.country,
      sponsorName: doc.sponsorName,
      isAdmin: doc.isAdmin || false,
      status: doc.status || 'active',
    })) as User[];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0];
    return {
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      email: doc.email,
      mobile: doc.mobile,
      password: doc.password || '',
      sponsorId: doc.sponsorId || '',
      bankName: doc.bankName || '',
      accountNumber: doc.accountNumber || '',
      ifscCode: doc.ifscCode || '',
      usdtAddress: doc.usdtAddress || '',
      profileImage: doc.profileImage,
      country: doc.country,
      sponsorName: doc.sponsorName,
      isAdmin: doc.isAdmin || false,
      status: doc.status || 'active',
    } as User;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// Update user status (active/blocked)
export async function updateUserStatus(documentId: string, status: 'active' | 'blocked'): Promise<User | null> {
  try {
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      { status }
    );

    return {
      $id: updatedDoc.$id,
      userId: updatedDoc.userId,
      name: updatedDoc.name,
      email: updatedDoc.email,
      mobile: updatedDoc.mobile,
      password: updatedDoc.password || '',
      sponsorId: updatedDoc.sponsorId || '',
      bankName: updatedDoc.bankName || '',
      accountNumber: updatedDoc.accountNumber || '',
      ifscCode: updatedDoc.ifscCode || '',
      usdtAddress: updatedDoc.usdtAddress || '',
      profileImage: updatedDoc.profileImage,
      country: updatedDoc.country,
      sponsorName: updatedDoc.sponsorName,
      isAdmin: updatedDoc.isAdmin || false,
      status: updatedDoc.status || 'active',
    } as User;
  } catch (error) {
    console.error('Error updating user status:', error);
    return null;
  }
}

// Update admin access (promote/revoke admin)
export async function updateAdminAccess(documentId: string, isAdmin: boolean): Promise<User | null> {
  try {
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      { isAdmin }
    );

    return {
      $id: updatedDoc.$id,
      userId: updatedDoc.userId,
      name: updatedDoc.name,
      email: updatedDoc.email,
      mobile: updatedDoc.mobile,
      password: updatedDoc.password || '',
      sponsorId: updatedDoc.sponsorId || '',
      bankName: updatedDoc.bankName || '',
      accountNumber: updatedDoc.accountNumber || '',
      ifscCode: updatedDoc.ifscCode || '',
      usdtAddress: updatedDoc.usdtAddress || '',
      profileImage: updatedDoc.profileImage,
      country: updatedDoc.country,
      sponsorName: updatedDoc.sponsorName,
      isAdmin: updatedDoc.isAdmin || false,
      status: updatedDoc.status || 'active',
    } as User;
  } catch (error) {
    console.error('Error updating admin access:', error);
    return null;
  }
}

// Get all deposits (admin only)
export async function getAllDeposits(): Promise<DepositRequest[]> {
  try {
    if (!DEPOSIT_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      DEPOSIT_COLLECTION_ID,
      [Query.orderDesc('date')]
    );

    return response.documents.map((doc) => ({
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
    })) as DepositRequest[];
  } catch (error) {
    console.error('Error fetching all deposits:', error);
    return [];
  }
}

// Get all withdrawals (admin only)
export async function getAllWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    if (!WITHDRAWAL_COLLECTION_ID) {
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      WITHDRAWAL_COLLECTION_ID,
      [Query.orderDesc('date')]
    );

    return response.documents.map((doc) => ({
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
    })) as WithdrawalRequest[];
  } catch (error) {
    console.error('Error fetching all withdrawals:', error);
    return [];
  }
}

// Admin wrapper functions for deposit/withdrawal/support updates
export { updateDepositRequestStatus, updateWithdrawalRequestStatus, getAllSupportTickets, updateSupportTicket };

// Update wallet balance (admin only)
export async function adminUpdateWallet(userId: string, updates: {
  mainWallet?: number;
  totalBonus?: number;
  directBonus?: number;
  levelBonus?: number;
}): Promise<Wallet | null> {
  try {
    return await updateWallet(userId, updates);
  } catch (error) {
    console.error('Error updating wallet (admin):', error);
    return null;
  }
}

// Get wallet by user ID (admin only) - re-export from wallet service
export { getWallet as getWalletByUserId };

