import { Client, Account, Databases, ID } from 'appwrite';

/**
 * Appwrite Configuration
 * 
 * Set up your Appwrite project and configure these environment variables:
 * 
 * 1. Create an Appwrite project at https://cloud.appwrite.io
 * 2. Get your Project ID from the project settings
 * 3. Create a Database and get the Database ID
 * 4. Create a Collection in the database with the following attributes:
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
 * 5. Get the Collection ID
 * 6. Set up environment variables in your .env.local file:
 *    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
 *    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
 *    NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
 *    NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id
 */
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Export constants for use in other files
export { ID };
export const DATABASE_ID = APPWRITE_DATABASE_ID;
export const COLLECTION_ID = APPWRITE_COLLECTION_ID;

