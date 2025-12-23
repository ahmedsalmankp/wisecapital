# Transactions Collection Setup Guide

## Fix 401 Unauthorized Error for Transactions

If you're seeing a **401 Unauthorized** error related to transactions, follow these steps:

## Quick Fix Steps

### 1. Create Transactions Collection in Appwrite

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Database** → Your Database
3. Click **"Create Collection"**
4. Name it: `Transactions` (or any name you prefer)
5. Copy the **Collection ID** (you'll need this for step 3)

### 2. Add Collection Attributes

Click on the collection, then go to **Attributes** tab and add:

| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| `transactionId` | String | 255 | ✅ Yes | ❌ No | - |
| `userId` | String | 255 | ✅ Yes | ❌ No | - |
| `type` | String | 50 | ✅ Yes | ❌ No | - |
| `amount` | Double | - | ✅ Yes | ❌ No | 0 |
| `currency` | String | 10 | ✅ Yes | ❌ No | - |
| `status` | String | 20 | ✅ Yes | ❌ No | - |
| `description` | String | 500 | ✅ Yes | ❌ No | - |
| `relatedRequestId` | String | 255 | ❌ No | ❌ No | - |
| `date` | DateTime | - | ✅ Yes | ❌ No | - |
| `balanceAfter` | Double | - | ✅ Yes | ❌ No | 0 |

**Important**: For `type` and `status` fields, you can add **Enums**:
- `type`: `Deposit`, `Withdrawal`, `Bonus`, `Transfer`
- `status`: `Pending`, `Completed`, `Failed`, `Cancelled`

### 3. Set Up Permissions

1. Go to **Settings** tab → **Permissions**
2. Add these permissions:

**CREATE Permission:**
- Click **"Add Permission"**
- Select **"Role"** → Type `users()` and select it
- This allows the system to create transaction records

**READ Permission:**
- Click **"Add Permission"**
- Select **"Role"** → Type `users()` and select it
- This allows users to read their transactions

**UPDATE Permission (Optional):**
- Click **"Add Permission"**
- Select **"Role"** → Type `users()` and select it
- OR leave empty if only admins should update status

**DELETE Permission:**
- Leave empty (transactions should not be deleted for audit trail)

### 4. Add Environment Variable

Add this to your `.env.local` file:

```env
NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=your_collection_id_here
```

Replace `your_collection_id_here` with the actual Collection ID from step 1.

### 5. Restart Your Development Server

After adding the environment variable:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Verify Setup

After completing the above steps:

1. ✅ Check browser console - 401 errors should be gone
2. ✅ Approve a deposit request - transaction should be created
3. ✅ Complete a withdrawal request - transaction should be created
4. ✅ Check Appwrite Console - you should see transaction documents

## Common Issues

### Issue: "Transactions collection ID not configured"
**Solution**: Add `NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID` to `.env.local` and restart the server.

### Issue: "401 Unauthorized" when creating transactions
**Solution**: 
1. Check that the collection exists in Appwrite
2. Verify CREATE permission is set for `users()` role
3. Make sure you're logged in

### Issue: "404 Not Found" 
**Solution**: The collection doesn't exist. Create it following step 1 above.

### Issue: "Unknown attribute" error
**Solution**: Make sure all required attributes are added to the collection (see step 2).

## Testing

To test if transactions are working:

1. Create a deposit request
2. Approve it (this should create a transaction)
3. Check the browser console for: `✅ Transaction created successfully!`
4. Check Appwrite Console → Transactions collection for the new document

## Notes

- Transactions are created automatically when:
  - A deposit is approved
  - A withdrawal is completed
  - A bonus is awarded (if implemented)
  - A transfer is made (if implemented)

- If transaction creation fails, it won't break the deposit/withdrawal flow - it will just log an error
- All transactions maintain a complete audit trail with `balanceAfter` showing the wallet balance after each transaction

