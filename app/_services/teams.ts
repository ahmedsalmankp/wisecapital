import { User } from './auth';
import { getDepositRequests } from './deposit';
import { databases, DATABASE_ID, COLLECTION_ID } from './appwrite';
import { Query } from 'appwrite';

export interface TeamMember {
  userId: string;
  name: string;
  package: string;
  sponsorId: string;
  status: 'Active' | 'Inactive';
}

export interface LevelData {
  level: number;
  members: TeamMember[];
  earnings: number;
}

// Get all users from Appwrite database
async function getAllUsers(): Promise<Record<string, User>> {
  try {
    if (!COLLECTION_ID) {
      console.warn('Users collection ID not configured.');
      return {};
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID
    );

    // Convert array to object keyed by userId for easier lookup
    const usersMap: Record<string, User> = {};
    response.documents.forEach((doc) => {
      const user = doc as unknown as User;
      if (user.userId) {
        usersMap[user.userId] = user;
        // Also index by $id for Appwrite document ID lookups
        usersMap[user.$id] = user;
      }
    });

    return usersMap;
  } catch (error) {
    console.error('Error fetching users from Appwrite:', error);
    return {};
  }
}

// Build referral tree - get all users referred by a specific user (direct and indirect)
function getReferralsByLevel(
  currentUserId: string,
  allUsers: Record<string, User>,
  level: number,
  maxLevel: number = 4
): Array<TeamMember & { fullUserId: string }> {
  if (level > maxLevel) return [];

  const referrals: Array<TeamMember & { fullUserId: string }> = [];
  
  // Find direct referrals (users whose sponsorId matches currentUserId)
  // Check both full userId and shortened userId for sponsorId matching
  for (const [userId, userData] of Object.entries(allUsers)) {
    // Skip if this is the Appwrite document ID ($id) and not the actual userId
    if (userId === userData.$id && userId !== userData.userId) {
      continue;
    }

    const shortenedUserId = userData.userId ? userData.userId.substring(0, 7) : '';
    const sponsorIdMatches =
      userData.sponsorId === currentUserId ||
      userData.sponsorId === userData.userId?.substring(0, 7) ||
      (userData.sponsorId && currentUserId && userData.sponsorId.substring(0, 7) === currentUserId.substring(0, 7));

    if (sponsorIdMatches && userData.userId) {
      // Get package info (you can extend this based on your package system)
      const packageName = (userData as any).package || 'Basic';
      const status: 'Active' | 'Inactive' = (userData as any).status || 'Active';
      
      // Display shortened sponsorId if it's a full userId
      let displaySponsorId = userData.sponsorId || '';
      if (displaySponsorId.length > 7) {
        displaySponsorId = displaySponsorId.substring(0, 7);
      }
      
      referrals.push({
        userId: shortenedUserId, // Shortened user ID for display
        fullUserId: userData.userId, // Full user ID for internal tracking
        name: userData.name || 'Unknown',
        package: packageName,
        sponsorId: displaySponsorId,
        status: status,
      });
    }
  }

  return referrals;
}

// Calculate earnings for a user based on their approved deposits
async function calculateUserEarnings(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  const deposits = await getDepositRequests();
  // Calculate earnings from approved deposits
  // Earnings = 5% of approved deposits (you can adjust this percentage)
  // Check both full userId and shortened userId (first 7 characters) for matching
  const shortenedUserId = userId.substring(0, 7);
  const userDeposits = deposits.filter(
    (deposit) => 
      (deposit.userId === userId || deposit.userId === shortenedUserId) && 
      deposit.status === 'Approved'
  );
  
  const totalDeposits = userDeposits.reduce((sum, deposit) => {
    // Convert all amounts to a common currency (assuming INR as base)
    let amount = deposit.amount;
    if (deposit.type === 'USD') {
      amount = deposit.amount * 83; // Approximate conversion rate
    } else if (deposit.type === 'Crypto') {
      amount = deposit.amount * 3500; // Approximate conversion rate (adjust as needed)
    }
    return sum + amount;
  }, 0);
  
  // Calculate earnings as 5% of total approved deposits
  return totalDeposits * 0.05;
}

// Calculate total earnings for a level based on all active members' deposits
async function calculateLevelEarnings(
  levelData: Array<TeamMember & { fullUserId: string }>
): Promise<number> {
  let totalEarnings = 0;
  
  for (const member of levelData) {
    // Only count earnings from active members
    if (member.status === 'Active') {
      const earnings = await calculateUserEarnings(member.fullUserId);
      totalEarnings += earnings;
    }
  }
  
  return totalEarnings;
}

// Get team members organized by level
export async function getTeamMembers(
  currentUserId: string
): Promise<LevelData[]> {
  const allUsers = await getAllUsers();
  const levels: LevelData[] = [];
  
  // If no users found, return empty levels
  if (Object.keys(allUsers).length === 0) {
    return [
      { level: 1, members: [], earnings: 0 },
      { level: 2, members: [], earnings: 0 },
      { level: 3, members: [], earnings: 0 },
      { level: 4, members: [], earnings: 0 },
    ];
  }

  // Build level 1 (direct referrals)
  const level1Data = getReferralsByLevel(currentUserId, allUsers, 1);
  const level1Members: TeamMember[] = level1Data.map(({ fullUserId, ...member }) => member);
  const level1Earnings = await calculateLevelEarnings(level1Data);
  levels.push({ level: 1, members: level1Members, earnings: level1Earnings });

  // Build level 2 (referrals of level 1 members)
  const level2Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level1Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 2);
    level2Data.push(...referrals);
  }
  const level2Members: TeamMember[] = level2Data.map(({ fullUserId, ...member }) => member);
  const level2Earnings = await calculateLevelEarnings(level2Data);
  levels.push({ level: 2, members: level2Members, earnings: level2Earnings });

  // Build level 3 (referrals of level 2 members)
  const level3Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level2Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 3);
    level3Data.push(...referrals);
  }
  const level3Members: TeamMember[] = level3Data.map(({ fullUserId, ...member }) => member);
  const level3Earnings = await calculateLevelEarnings(level3Data);
  levels.push({ level: 3, members: level3Members, earnings: level3Earnings });

  // Build level 4 (referrals of level 3 members)
  const level4Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level3Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 4);
    level4Data.push(...referrals);
  }
  const level4Members: TeamMember[] = level4Data.map(({ fullUserId, ...member }) => member);
  const level4Earnings = await calculateLevelEarnings(level4Data);
  levels.push({ level: 4, members: level4Members, earnings: level4Earnings });

  return levels;
}

