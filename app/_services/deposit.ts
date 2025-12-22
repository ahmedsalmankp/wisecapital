// Deposit Service

export interface DepositRequest {
  requestId: string;
  token: string;
  userId: string;
  name: string;
  type: 'INR' | 'USD' | 'Crypto';
  amount: number;
  txnId: string;
  receipt?: File | null;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const DEPOSIT_REQUESTS_KEY = 'deposit_requests';

// Generate a unique deposit request ID
function generateDepositRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEP-${timestamp}-${random}`;
}

// Generate a secure token for the deposit request
function generateDepositToken(): string {
  // Generate a random token using crypto API if available, otherwise use Math.random
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to hex string
  const token = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return token;
}

// Get all deposit requests from localStorage
export function getDepositRequests(): DepositRequest[] {
  if (typeof window === 'undefined') return [];
  const requestsJson = localStorage.getItem(DEPOSIT_REQUESTS_KEY);
  return requestsJson ? JSON.parse(requestsJson) : [];
}

// Save deposit requests to localStorage
function saveDepositRequests(requests: DepositRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(requests));
}

// Create a new deposit request
export async function createDepositRequest(
  userId: string,
  name: string,
  type: 'INR' | 'USD' | 'Crypto',
  amount: number,
  txnId: string,
  receipt?: File | null
): Promise<{ success: boolean; requestId: string; token: string }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate request ID and token
  const requestId = generateDepositRequestId();
  const token = generateDepositToken();

  // Create deposit request object
  const depositRequest: DepositRequest = {
    requestId,
    token,
    userId,
    name,
    type,
    amount,
    txnId,
    receipt: receipt ? new File([], receipt.name) : null, // Create a File object with the name
    date: new Date().toISOString(),
    status: 'Pending',
  };

  // Get existing requests and add new one
  const requests = getDepositRequests();
  requests.unshift(depositRequest); // Add to beginning
  saveDepositRequests(requests);

  return {
    success: true,
    requestId,
    token,
  };
}

// Get deposit request by ID
export function getDepositRequestById(requestId: string): DepositRequest | null {
  const requests = getDepositRequests();
  return requests.find(req => req.requestId === requestId) || null;
}

// Get deposit requests by user ID
export function getDepositRequestsByUserId(userId: string): DepositRequest[] {
  const requests = getDepositRequests();
  return requests.filter(req => req.userId === userId);
}

// Get deposit requests by type
export function getDepositRequestsByType(type: 'INR' | 'USD' | 'Crypto'): DepositRequest[] {
  const requests = getDepositRequests();
  return requests.filter(req => req.type === type);
}



