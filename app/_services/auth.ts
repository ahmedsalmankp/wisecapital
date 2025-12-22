// Demo Authentication Service using localStorage

export interface User {
  $id: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  sponsorId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  usdtAddress: string;
  profileImage?: string;
  password?: string; // Only for demo purposes - never store passwords in production
}

interface UserData {
  email: string;
  password: string;
  name: string;
  mobile: string;
  sponsorId?: string;
  sponsorName?: string;
  country?: string;
}

const USERS_STORAGE_KEY = 'demo_users';
const CURRENT_USER_KEY = 'current_user';
const SESSION_KEY = 'demo_session';

// Helper function to generate a simple user ID
function generateUserId(phone: string): string {
  const firstFour = phone.replace(/\D/g, '').slice(0, 4);
  const randomTwo = Math.floor(10 + Math.random() * 90);
  return `${firstFour}${randomTwo}`;
}

// Get all users from localStorage
function getUsers(): Record<string, UserData> {
  if (typeof window === 'undefined') return {};
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
}

// Save users to localStorage
function saveUsers(users: Record<string, UserData>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsers();

  // Check if email already exists
  if (Object.values(users).some(user => user.email === email)) {
    throw new Error('Email already registered');
  }

  // Generate user ID
  let userId = generateUserId(phone);
  let attempts = 0;
  while (users[userId] && attempts < 5) {
    userId = generateUserId(phone);
    attempts++;
  }

  if (users[userId]) {
    throw new Error('Failed to create user. Please try again.');
  }

  // Create user data
  const userData: UserData = {
    email,
    password, // In production, this should be hashed
    name: username,
    mobile: phone,
    sponsorId,
    sponsorName,
    country,
  };

  users[userId] = userData;
  saveUsers(users);

  return {
    success: true,
    userId,
  };
}

// Login user
export async function loginUser(
  identifier: string,
  password: string
): Promise<{ success: boolean; user: User | null }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsers();

  // Find user by email or userId
  let userData: UserData | null = null;
  let userId: string | null = null;

  for (const [id, user] of Object.entries(users)) {
    if (user.email === identifier || id === identifier) {
      userData = user;
      userId = id;
      break;
    }
  }

  if (!userData || !userId) {
    return { success: false, user: null };
  }

  // Check password (in production, compare hashed passwords)
  if (userData.password !== password) {
    return { success: false, user: null };
  }

  // Create user object
  const user: User = {
    $id: userId,
    userId: userId.substring(0, 7),
    name: userData.name,
    email: userData.email,
    mobile: userData.mobile,
    sponsorId: userData.sponsorId || '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    usdtAddress: '',
  };

  // Save current user and session
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, 'active');
  }

  return { success: true, user };
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    const session = localStorage.getItem(SESSION_KEY);

    if (!userJson || session !== 'active') {
      return null;
    }

    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Sign out user
export async function signOut(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const session = localStorage.getItem(SESSION_KEY);
    const user = await getCurrentUser();
    return session === 'active' && user !== null;
  } catch (error) {
    return false;
  }
}

