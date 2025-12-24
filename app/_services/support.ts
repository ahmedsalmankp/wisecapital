// Support Service - Using Appwrite for persistent storage

import { databases, ID, Permission, Role, DATABASE_ID, account } from './appwrite';
import { Query } from 'appwrite';

export interface SupportTicket {
  $id?: string; // Appwrite document ID
  ticketId: string;
  userId: string;
  name: string;
  query: string;
  subject: string;
  description: string;
  reply: string;
  date: string;
  status: 'pending' | 'replied' | 'resolved';
}

interface SupportTicketDocument {
  $id: string;
  ticketId: string;
  userId: string;
  name: string;
  query: string;
  subject: string;
  description: string;
  reply: string;
  date: string;
  status: 'pending' | 'replied' | 'resolved';
}

// Get collection ID from environment variable
const SUPPORT_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SUPPORT_COLLECTION_ID || '';

// Generate a unique ticket ID
function generateTicketId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${timestamp}-${random}`;
}

// Convert Appwrite document to SupportTicket
function documentToSupportTicket(doc: SupportTicketDocument): SupportTicket {
  return {
    $id: doc.$id,
    ticketId: doc.ticketId,
    userId: doc.userId,
    name: doc.name,
    query: doc.query,
    subject: doc.subject,
    description: doc.description,
    reply: doc.reply,
    date: doc.date,
    status: doc.status,
  };
}

// Create a new support ticket
export async function createSupportTicket(
  userId: string,
  name: string,
  query: string,
  subject: string,
  description: string
): Promise<{ success: boolean; ticketId: string }> {
  try {
    if (!SUPPORT_COLLECTION_ID) {
      console.warn('Support collection ID not configured. Ticket will not be saved.');
      // Return success anyway to not break the UI, but log a warning
      return {
        success: true,
        ticketId: generateTicketId(),
      };
    }

    // Get current Appwrite user to set permissions
    let appwriteUserId: string | null = null;
    try {
      const appwriteUser = await account.get();
      appwriteUserId = appwriteUser.$id;
    } catch (error) {
      console.warn('Could not get Appwrite user ID for permissions:', error);
    }

    // Generate ticket ID
    const ticketId = generateTicketId();

    // Create ticket document
    const ticketDocument = {
      ticketId,
      userId,
      name,
      query,
      subject,
      description,
      reply: '',
      date: new Date().toISOString(),
      status: 'pending' as const,
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
    await databases.createDocument(
      DATABASE_ID,
      SUPPORT_COLLECTION_ID,
      ID.unique(),
      ticketDocument,
      permissions
    );

    console.log('✅ Support ticket created successfully!');
    console.log('   Ticket ID:', ticketId);

    return {
      success: true,
      ticketId,
    };
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    if (error.code === 401) {
      console.error('401 Unauthorized: Please check Appwrite collection permissions.');
      console.error('Collection ID:', SUPPORT_COLLECTION_ID);
      console.error('Make sure CREATE permission is set for "users()" role in Appwrite Console.');
      throw new Error('Permission denied. Please check Appwrite collection permissions.');
    }
    throw new Error(error.message || 'Failed to create support ticket. Please try again.');
  }
}

// Get all support tickets for a user
export async function getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]> {
  try {
    if (!SUPPORT_COLLECTION_ID) {
      console.warn('Support collection ID not configured.');
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      SUPPORT_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('date')
      ]
    );

    return response.documents.map((doc) => 
      documentToSupportTicket(doc as unknown as SupportTicketDocument)
    );
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
}

// Get all support tickets (for admin)
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  try {
    if (!SUPPORT_COLLECTION_ID) {
      console.warn('Support collection ID not configured.');
      return [];
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      SUPPORT_COLLECTION_ID,
      [Query.orderDesc('date')]
    );

    return response.documents.map((doc) => 
      documentToSupportTicket(doc as unknown as SupportTicketDocument)
    );
  } catch (error) {
    console.error('Error fetching all support tickets:', error);
    return [];
  }
}

// Update support ticket (e.g., add reply or change status)
export async function updateSupportTicket(
  documentId: string,
  updates: Partial<SupportTicket>
): Promise<SupportTicket | null> {
  try {
    if (!SUPPORT_COLLECTION_ID) {
      throw new Error('Support collection ID not configured.');
    }

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      SUPPORT_COLLECTION_ID,
      documentId,
      updates
    ) as unknown as SupportTicketDocument;

    return documentToSupportTicket(updatedDoc);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return null;
  }
}

