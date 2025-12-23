# Appwrite Permissions Setup Guide

## Fix 401 Unauthorized Errors

The 401 errors you're seeing are because the Appwrite collections and storage buckets don't have the correct permissions set. Follow these steps to fix them:

## ⚠️ CRITICAL: Set Users Collection Permissions First

**This is the most important step to fix login 401 errors!**

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Database** → Your Database → **Users Collection**
3. Click on the **Settings** tab → **Permissions**
4. Add these permissions:

### READ Permission (CRITICAL FOR LOGIN)
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `any` and select it
- **Why**: Login needs to query the Users collection BEFORE authentication to find the user's email
- ⚠️ **Note**: This makes user data publicly readable. See `USERS_COLLECTION_FIX.md` for alternatives.

### CREATE Permission (For Registration)
- Click **"Add Permission"** button
- Select **"Role"** → Type `any` and select it
- This allows new user registration

### UPDATE Permission
- Click **"Add Permission"** button
- Select **"Role"** → Type `users()` and select it
- This allows authenticated users to update their profile

### DELETE Permission
- Leave empty (users shouldn't delete their accounts)

**Without READ permission for "any", login will fail with 401 error!**

## Step 1: Set Deposit Requests Collection Permissions

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Database** → Your Database → **Deposit Requests Collection**
3. Click on the **Settings** tab
4. Click on **Permissions** section
5. Add the following permissions:

### CREATE Permission
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows any authenticated user to create deposit requests

### READ Permission (REQUIRED - This fixes the 401 error)
- Click **"Add Permission"** button  
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows any authenticated user to read deposit requests
- **This is the most important permission to fix your 401 errors**

### UPDATE Permission (Optional)
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- OR leave empty if you want only admins to update status

### DELETE Permission
- Leave empty (users typically shouldn't delete their requests)

## Step 2: Set Storage Bucket Permissions

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Storage** → Your Bucket (ID: `694accdd000f9e1b196d`)
3. Click on the **Settings** tab
4. Click on **Permissions** section
5. Add the following permissions:

### CREATE Permission
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows users to upload receipt files

### READ Permission
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows users to view/download receipt files

### UPDATE Permission
- Leave empty (users shouldn't update uploaded files)

### DELETE Permission
- Leave empty (users shouldn't delete uploaded files)

## Step 3: Set Transactions Collection Permissions

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Database** → Your Database → **Transactions Collection** (create it if it doesn't exist)
3. If creating a new collection, add these attributes:
   - `transactionId` (string, required, unique)
   - `userId` (string, required)
   - `type` (string, required) - enum: 'Deposit', 'Withdrawal', 'Bonus', 'Transfer'
   - `amount` (double, required)
   - `currency` (string, required)
   - `status` (string, required) - enum: 'Pending', 'Completed', 'Failed', 'Cancelled'
   - `description` (string, required)
   - `relatedRequestId` (string, optional)
   - `date` (datetime, required)
   - `balanceAfter` (double, required)
4. Click on the **Settings** tab
5. Click on **Permissions** section
6. Add the following permissions:

### CREATE Permission
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows the system to create transaction records

### READ Permission (REQUIRED)
- Click **"Add Permission"** button  
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- This allows users to read their transactions

### UPDATE Permission (Optional)
- Click **"Add Permission"** button
- Select **"Role"** from the dropdown
- Type: `users()` and select it
- OR leave empty if you want only admins to update transaction status

### DELETE Permission
- Leave empty (transactions should not be deleted for audit purposes)

7. Add the collection ID to your `.env.local` file:
   ```
   NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=your_transactions_collection_id
   ```

**Note**: If you get a 401 error when creating transactions, it means:
- The Transactions collection doesn't exist yet (create it first)
- The environment variable is not set
- The permissions are not configured correctly

## Step 4: Verify Collection ID

Make sure your Deposit Requests Collection ID is correct:
- Current value in code: `depositrequest`
- This should be the actual Collection ID (usually a long alphanumeric string)
- If `depositrequest` is the collection name, you need to find the actual ID:
  1. Go to the collection in Appwrite Console
  2. Look at the URL or collection settings
  3. Copy the actual Collection ID
  4. Update your `.env.local` file:
     ```
     NEXT_PUBLIC_APPWRITE_DEPOSIT_COLLECTION_ID=your_actual_collection_id
     ```

## Step 5: Test After Setup

1. Refresh your application
2. Try creating a deposit request
3. Check the browser console - 401 errors should be gone
4. Verify that deposit history loads correctly

## Troubleshooting

### Still getting 401 errors?

1. **Check if you're logged in**: Make sure you have an active session
2. **Verify Collection ID**: Make sure `NEXT_PUBLIC_APPWRITE_DEPOSIT_COLLECTION_ID` matches the actual collection ID in Appwrite
3. **Check permissions again**: Make sure `users()` role is added for CREATE and READ
4. **Clear browser cache**: Sometimes cached errors persist
5. **Check Appwrite project**: Make sure you're using the correct project ID

### Collection ID Format

Appwrite Collection IDs are usually:
- Long alphanumeric strings like: `69497f4e00048afb413e`
- NOT the collection name like: `depositrequest`

If you see `depositrequest` as the collection ID, that's likely the collection name, not the ID. Find the actual ID in the Appwrite Console.

## Quick Checklist

- [ ] Deposit Requests Collection: CREATE permission for `users()`
- [ ] Deposit Requests Collection: READ permission for `users()` ⚠️ **MOST IMPORTANT**
- [ ] Storage Bucket: CREATE permission for `users()`
- [ ] Storage Bucket: READ permission for `users()`
- [ ] **Transactions Collection: CREATE permission for `users()`** ⚠️ **NEW**
- [ ] **Transactions Collection: READ permission for `users()`** ⚠️ **NEW**
- [ ] **Transactions Collection created with all required attributes** ⚠️ **NEW**
- [ ] **NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID set in .env.local** ⚠️ **NEW**
- [ ] Collection ID is correct (not the name, but the actual ID)
- [ ] User is logged in with an active session

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure you're logged in before trying to create/view deposits
4. Check Appwrite Console logs for permission errors

