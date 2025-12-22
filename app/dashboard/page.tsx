'use client';

import { useState, useEffect } from 'react';
import { Wallet, Gift, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../_contexts/AuthContext';
import { getTeamMembers, LevelData } from '../_services/teams';

const stats = [
  {
    name: 'Main Wallet',
    value: '₹12,450.00',
    icon: Wallet,
    color: 'bg-green-600',
    change: '+12.5%',
  },
  {
    name: 'Total Bonus',
    value: '₹3,250.00',
    icon: Gift,
    color: 'bg-green-600',
    change: '+8.2%',
  },
  {
    name: 'Direct Bonus',
    value: '₹1,850.00',
    icon: TrendingUp,
    color: 'bg-green-600',
    change: '+5.1%',
  },
  {
    name: 'Level Bonus',
    value: '₹2,400.00',
    icon: TrendingUp,
    color: 'bg-green-600',
    change: '+3.7%',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (user?.$id) {
        setIsLoading(true);
        try {
          const teamData = await getTeamMembers(user.$id);
          setLevels(teamData);
        } catch (error) {
          console.error('Error fetching team data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTeamData();
  }, [user]);

  // Calculate totals
  const totalMembers = levels.reduce((sum, level) => sum + level.members.length, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's your investment overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm font-medium text-green-600">
                    {stat.change}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">
                    from last month
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Team</h2>
              <Users className="h-5 w-5 text-green-600" />
            </div>
            {isLoading ? (
              <div className="mt-6 text-center py-4">
                <p className="text-sm text-gray-500">Loading team data...</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {[1, 2, 3, 4].map((levelNum) => {
                  const levelData = levels.find((l) => l.level === levelNum);
                  const members = levelData?.members || [];
                  const activeMembers = members.filter((m) => m.status === 'Active');
                  const levelEarnings = levelData?.earnings || 0;
                  
                  return (
                    <div
                      key={levelNum}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {levelNum} Level
                        </p>
                        <p className="text-xs text-gray-500">
                          {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(levelEarnings)}
                      </p>
                    </div>
                  );
                })}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Total Members
                      </p>
                      <p className="text-xs text-gray-500">All levels</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalMembers}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center  bg-green-200">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Bonus credited
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <p className="text-sm font-semibold text-green-600">+₹250</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-green-200">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New team member
                  </p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-green-200">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Investment return
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <p className="text-sm font-semibold text-green-600">+₹120</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

