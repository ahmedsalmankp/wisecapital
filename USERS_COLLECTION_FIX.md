# Fix 401 Error: Users Collection Permissions

## Problem

You're getting a 401 Unauthorized error during login because the **Users collection** doesn't have the correct READ permissions set up.

The login process needs to:
1. Query the Users collection to find the user by `userId` (before authentication)
2. Get the user's email
3. Authenticate with Appwrite using email and password

**The issue**: Step 1 requires READ permission, but the user isn't authenticated yet!

## Solution: Set Users Collection Permissions

### Step 1: Go to Users Collection in Appwrite

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: **Database** → Your Database → **Users Collection** (or whatever you named it)
3. Click on the **Settings** tab
4. Click on **Permissions** section

### Step 2: Add READ Permission for "any" Role

**This is the critical permission that fixes the login issue:**

1. Click **"Add Permission"** button
2. Select **"Role"** from the dropdown
3. Type: `any` and select it
   - This allows **anyone** (including unauthenticated users) to read from the collection
   - ⚠️ **Security Note**: This means user data is publicly readable. If this is a concern, see the alternative solution below.

**Why this is needed:**
- During login, the app needs to query the Users collection to find the user's email
- At this point, the user is NOT authenticated yet
- Without READ permission for "any", the query fails with 401

### Step 3: Add Other Permissions (Optional but Recommended)

**CREATE Permission:**
- Click **"Add Permission"** button
- Select **"Role"** → Type `any` and select it
- This allows new user registration

**UPDATE Permission:**
- Click **"Add Permission"** button
- Select **"Role"** → Type `users()` and select it
- This allows authenticated users to update their own profile

**DELETE Permission:**
- Leave empty (users shouldn't delete their accounts)

## Alternative Solution (More Secure)

If you don't want to make the Users collection publicly readable, you can modify the login flow to use a different approach:

### Option A: Use Appwrite's built-in user search (if available)
- Use Appwrite's user search API instead of querying the collection directly

### Option B: Create a separate "Login Lookup" collection
- Create a minimal collection with just `userId` and `email`
- Set READ permission for "any" on this collection only
- Keep the main Users collection private

### Option C: Use email as the login identifier
- Modify the login to use email directly instead of userId
- This way you don't need to query the collection first

## Quick Checklist

- [ ] Users Collection: READ permission for `any` role ⚠️ **CRITICAL FOR LOGIN**
- [ ] Users Collection: CREATE permission for `any` role (for registration)
- [ ] Users Collection: UPDATE permission for `users()` role (for profile updates)
- [ ] Verify the collection ID in `.env.local`: `NEXT_PUBLIC_APPWRITE_COLLECTION_ID`

## Testing

After setting permissions:

1. Try to register a new user - should work
2. Try to login - should work (no more 401 error)
3. Check browser console - should see successful login

## Common Issues

### Still getting 401 after setting permissions?

1. **Clear browser cache and cookies**
2. **Restart your development server**
3. **Verify collection ID** - Make sure `NEXT_PUBLIC_APPWRITE_COLLECTION_ID` matches the actual collection ID in Appwrite
4. **Check Appwrite project** - Make sure you're using the correct project ID

### "any" role not available?

- Make sure you're using the latest version of Appwrite
- The "any" role should be available in the permissions dropdown
- If not, try typing it manually: `any`

### Security Concerns?

If you're concerned about making user data publicly readable:
- Consider using one of the alternative solutions above
- Or implement field-level security (only expose necessary fields)
- Use Appwrite's built-in user management features if possible

## Current Login Flow

```
1. User enters userId and password
2. App queries Users collection (needs READ permission) ← 401 ERROR HERE
3. Gets user's email from document
4. Creates Appwrite session with email + password
5. Returns user data
```

The fix is to allow step 2 to work by setting READ permission for "any" role.

