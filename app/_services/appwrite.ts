"use client"
import { Client, Account, Databases, Storage, ID, Permission, Role } from 'appwrite';

/**
 * Appwrite Configuration
 * 
 * Set up your Appwrite project and configure these environment variables:
 * 
 * 1. Create an Appwrite project at https://cloud.appwrite.io
 * 2. Get your Project ID from the project settings
 * 3. Create a Database and get the Database ID
 * 
 * 4. Create a Users Collection in the database with the following attributes:
 *    - userId (string, required, unique)
 *    - email (string, required, unique)
 *    - name (string, required)
 *    - mobile (string, required)
 *    - password (string, required) - Note: In production, consider not storing this
 *    - sponsorId (string, optional)
 *    - sponsorName (string, optional)
 *    - country (string, optional)
 *    - bankName (string, optional)
 *    - accountNumber (string, optional)
 *    - ifscCode (string, optional)
 *    - usdtAddress (string, optional)
 *    - profileImage (string, optional)
 * 
 * 5. Create a Deposit Requests Collection with the following attributes:
 *    - requestId (string, required, unique)
 *    - token (string, required)
 *    - userId (string, required)
 *    - name (string, required)
 *    - type (string, required) - enum: 'INR', 'USD', 'Crypto'
 *    - amount (double, required)
 *    - txnId (string, required)
 *    - receiptFileId (string, optional, max 20 chars) - File ID from Appwrite Storage
 *    - date (datetime, required)
 *    - status (string, required) - enum: 'Pending', 'Approved', 'Rejected'
 *    
 *    IMPORTANT: Field Size Constraints:
 *    - token: Must be max 50 characters (code generates 48-char tokens)
 *    - receiptFileId: Must be max 20 characters (stores file ID, not full URL)
 * 
 *    IMPORTANT: Set Collection Permissions in Appwrite Console:
 *    
 *    To fix 401 Unauthorized errors, set these permissions:
 *    1. Go to your Appwrite Console (https://cloud.appwrite.io)
 *    2. Navigate to: Database > Your Database > Deposit Requests Collection
 *    3. Click on "Settings" tab, then "Permissions"
 *    4. Add the following permissions:
 *    
 *       CREATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to create their own deposit requests
 *    
 *       READ:
 *       - Click "Add Permission"  
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to read deposit requests (filtered by userId in code)
 *    
 *       UPDATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - OR leave empty if you want only admins to update status
 *    
 *       DELETE:
 *       - Leave empty (users shouldn't delete their requests)
 *       - OR add "users()" if you want users to delete their own requests
 *    
 *    Alternative: If you want stricter permissions, you can use document-level permissions
 *    by removing collection-level read permissions and relying on the permissions set
 *    when creating documents (see createDepositRequest function).
 * 
 * 6. Create a Storage Bucket for deposit receipts:
 *    - Name: "deposit-receipts" (or any name)
 *    - File size limit: 10MB (or as needed)
 *    - Allowed file extensions: jpg, jpeg, png, pdf
 *    
 *    IMPORTANT: Set Storage Bucket Permissions:
 *    1. Go to your Appwrite Console (https://cloud.appwrite.io)
 *    2. Navigate to: Storage > Your Bucket
 *    3. Click on "Settings" tab, then "Permissions"
 *    4. Add the following permissions:
 *    
 *       CREATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to upload receipt files
 *    
 *       READ:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to view/download receipt files
 *    
 *       UPDATE:
 *       - Leave empty (users shouldn't update uploaded files)
 *    
 *       DELETE:
 *       - Leave empty (users shouldn't delete uploaded files)
 * 
 * 7. Set up environment variables in your .env.local file:
 *    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
 *    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
 *    NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
 *    NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id (Users collection)
 *    NEXT_PUBLIC_APPWRITE_DEPOSIT_COLLECTION_ID=your_deposit_collection_id
 *    NEXT_PUBLIC_APPWRITE_WITHDRAWAL_COLLECTION_ID=your_withdrawal_collection_id
 *    NEXT_PUBLIC_APPWRITE_WALLET_COLLECTION_ID=your_wallet_collection_id
 *    NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=your_transactions_collection_id
 *    NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_storage_bucket_id
 * 
 * 8. Create a Wallets Collection in the database with the following attributes:
 *    - userId (string, required, unique)
 *    - mainWallet (double, required, default: 0)
 *    - totalBonus (double, required, default: 0)
 *    - directBonus (double, required, default: 0)
 *    - levelBonus (double, required, default: 0)
 *    - lastUpdated (datetime, required)
 *    
 *    IMPORTANT: Set Collection Permissions in Appwrite Console:
 *    
 *    To fix 401 Unauthorized errors, set these permissions:
 *    1. Go to your Appwrite Console (https://cloud.appwrite.io)
 *    2. Navigate to: Database > Your Database > Wallets Collection
 *    3. Click on "Settings" tab, then "Permissions"
 *    4. Add the following permissions:
 *    
 *       CREATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to create their own wallet
 *    
 *       READ:
 *       - Click "Add Permission"  
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to read their wallet (filtered by userId in code)
 *    
 *       UPDATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to update their wallet balances
 *    
 *       DELETE:
 *       - Leave empty (users shouldn't delete their wallet)
 * 
 * 9. Create a Withdrawal Requests Collection in the database with the following attributes:
 *    - requestId (string, required, unique)
 *    - userId (string, required)
 *    - amount (double, required)
 *    - payInr (double, required)
 *    - accountNumber (string, required)
 *    - ifscCode (string, required, max 11 chars)
 *    - fullname (string, required)
 *    - companyId (string, required)
 *    - txnId (string, required)
 *    - date (datetime, required)
 *    - status (string, required) - enum: 'Pending', 'Completed', 'Failed'
 *    
 *    IMPORTANT: Set Collection Permissions in Appwrite Console:
 *    
 *    To fix 401 Unauthorized errors, set these permissions:
 *    1. Go to your Appwrite Console (https://cloud.appwrite.io)
 *    2. Navigate to: Database > Your Database > Withdrawal Requests Collection
 *    3. Click on "Settings" tab, then "Permissions"
 *    4. Add the following permissions:
 *    
 *       CREATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to create their own withdrawal requests
 *    
 *       READ:
 *       - Click "Add Permission"  
 *       - Select "Role" → "users()" (any authenticated user)
 *       - This allows users to read withdrawal requests (filtered by userId in code)
 *    
 *       UPDATE:
 *       - Click "Add Permission"
 *       - Select "Role" → "users()" (any authenticated user)
 *       - OR leave empty if you want only admins to update status
 *    
 *       DELETE:
 *       - Leave empty (users shouldn't delete their requests)
 * 
 * 10. Create a Transactions Collection in the database with the following attributes:
 *     - transactionId (string, required, unique)
 *     - userId (string, required)
 *     - type (string, required) - enum: 'Deposit', 'Withdrawal', 'Bonus', 'Transfer'
 *     - amount (double, required)
 *     - currency (string, required) - e.g., 'INR', 'USD', 'Crypto'
 *     - status (string, required) - enum: 'Pending', 'Completed', 'Failed', 'Cancelled'
 *     - description (string, required)
 *     - relatedRequestId (string, optional) - Links to deposit/withdrawal request ID
 *     - date (datetime, required)
 *     - balanceAfter (double, required) - Wallet balance after this transaction
 *     
 *     IMPORTANT: Set Collection Permissions in Appwrite Console:
 *     
 *     To fix 401 Unauthorized errors, set these permissions:
 *     1. Go to your Appwrite Console (https://cloud.appwrite.io)
 *     2. Navigate to: Database > Your Database > Transactions Collection
 *     3. Click on "Settings" tab, then "Permissions"
 *     4. Add the following permissions:
 *     
 *        CREATE:
 *        - Click "Add Permission"
 *        - Select "Role" → "users()" (any authenticated user)
 *        - This allows the system to create transaction records
 *     
 *        READ:
 *        - Click "Add Permission"  
 *        - Select "Role" → "users()" (any authenticated user)
 *        - This allows users to read their transactions (filtered by userId in code)
 *     
 *        UPDATE:
 *        - Click "Add Permission"
 *        - Select "Role" → "users()" (any authenticated user)
 *        - OR leave empty if you want only admins to update transaction status
 *     
 *        DELETE:
 *        - Leave empty (transactions should not be deleted for audit purposes)
 */
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';
const APPWRITE_DEPOSIT_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DEPOSIT_COLLECTION_ID || '';
const APPWRITE_WITHDRAWAL_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WITHDRAWAL_COLLECTION_ID || '';
const APPWRITE_WALLET_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WALLET_COLLECTION_ID || '';
const APPWRITE_STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || '';
const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID || '';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export constants for use in other files
export { ID, Permission, Role };
export const DATABASE_ID = APPWRITE_DATABASE_ID;
export const COLLECTION_ID = APPWRITE_COLLECTION_ID;
export const DEPOSIT_COLLECTION_ID = APPWRITE_DEPOSIT_COLLECTION_ID;
export const WITHDRAWAL_COLLECTION_ID = APPWRITE_WITHDRAWAL_COLLECTION_ID;
export const WALLET_COLLECTION_ID = APPWRITE_WALLET_COLLECTION_ID;
export const TRANSACTIONS_COLLECTION_ID = APPWRITE_TRANSACTIONS_COLLECTION_ID;
export const STORAGE_BUCKET_ID = APPWRITE_STORAGE_BUCKET_ID;

