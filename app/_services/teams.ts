import { User } from './auth';
import { getDepositRequests } from './deposit';

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

const USERS_STORAGE_KEY = 'demo_users';

// Get all users from localStorage
function getAllUsers(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
}

// Build referral tree - get all users referred by a specific user (direct and indirect)
function getReferralsByLevel(
  currentUserId: string,
  allUsers: Record<string, any>,
  level: number,
  maxLevel: number = 4
): Array<TeamMember & { fullUserId: string }> {
  if (level > maxLevel) return [];

  const referrals: Array<TeamMember & { fullUserId: string }> = [];
  
  // Find direct referrals (users whose sponsorId matches currentUserId)
  // Check both full userId and shortened userId for sponsorId matching
  for (const [userId, userData] of Object.entries(allUsers)) {
    const shortenedUserId = userId.substring(0, 7);
    const sponsorIdMatches =
      userData.sponsorId === currentUserId ||
      userData.sponsorId === shortenedUserId;

    if (sponsorIdMatches) {
      // Get package info (you can extend this based on your package system)
      const packageName = userData.package || 'Basic';
      const status: 'Active' | 'Inactive' = userData.status || 'Active';
      
      // Display shortened sponsorId if it's a full userId
      let displaySponsorId = userData.sponsorId || '';
      if (displaySponsorId.length > 7) {
        displaySponsorId = displaySponsorId.substring(0, 7);
      }
      
      referrals.push({
        userId: shortenedUserId, // Shortened user ID for display
        fullUserId: userId, // Full user ID for internal tracking
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
function calculateUserEarnings(userId: string): number {
  if (typeof window === 'undefined') return 0;
  
  const deposits = getDepositRequests();
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
function calculateLevelEarnings(
  levelData: Array<TeamMember & { fullUserId: string }>
): number {
  let totalEarnings = 0;
  
  for (const member of levelData) {
    // Only count earnings from active members
    if (member.status === 'Active') {
      const earnings = calculateUserEarnings(member.fullUserId);
      totalEarnings += earnings;
    }
  }
  
  return totalEarnings;
}

// Get team members organized by level
export async function getTeamMembers(
  currentUserId: string
): Promise<LevelData[]> {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 300));

  const allUsers = getAllUsers();
  const levels: LevelData[] = [];

  // Build level 1 (direct referrals)
  const level1Data = getReferralsByLevel(currentUserId, allUsers, 1);
  const level1Members: TeamMember[] = level1Data.map(({ fullUserId, ...member }) => member);
  const level1Earnings = calculateLevelEarnings(level1Data);
  levels.push({ level: 1, members: level1Members, earnings: level1Earnings });

  // Build level 2 (referrals of level 1 members)
  const level2Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level1Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 2);
    level2Data.push(...referrals);
  }
  const level2Members: TeamMember[] = level2Data.map(({ fullUserId, ...member }) => member);
  const level2Earnings = calculateLevelEarnings(level2Data);
  levels.push({ level: 2, members: level2Members, earnings: level2Earnings });

  // Build level 3 (referrals of level 2 members)
  const level3Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level2Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 3);
    level3Data.push(...referrals);
  }
  const level3Members: TeamMember[] = level3Data.map(({ fullUserId, ...member }) => member);
  const level3Earnings = calculateLevelEarnings(level3Data);
  levels.push({ level: 3, members: level3Members, earnings: level3Earnings });

  // Build level 4 (referrals of level 3 members)
  const level4Data: Array<TeamMember & { fullUserId: string }> = [];
  for (const memberData of level3Data) {
    const referrals = getReferralsByLevel(memberData.fullUserId, allUsers, 4);
    level4Data.push(...referrals);
  }
  const level4Members: TeamMember[] = level4Data.map(({ fullUserId, ...member }) => member);
  const level4Earnings = calculateLevelEarnings(level4Data);
  levels.push({ level: 4, members: level4Members, earnings: level4Earnings });

  return levels;
}

