'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../_contexts/AuthContext';
import { getTeamMembers, LevelData } from '../../_services/teams';
import { Users } from 'lucide-react';

export default function Teams() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your referral network across all levels.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading team data...</div>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {/* Green Header Banner */}
          <div className="bg-green-600 px-6 py-3">
            <h2 className="text-lg font-semibold text-white">
              Team Members Details
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.NO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USERID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PACKAGE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SPONSOR ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {levels.map((levelData) =>
                  levelData.members.length > 0 ? (
                    levelData.members.map((member, index) => (
                      <tr
                        key={`${levelData.level}-${member.userId}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 font-medium">
                            LEVEL {levelData.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.package}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.sponsorId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              member.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr
                      key={`level-${levelData.level}-empty`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-600 font-medium">
                          LEVEL {levelData.level}
                        </span>
                      </td>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-sm text-gray-500 text-center"
                      >
                        No referrals at this level
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {levels.every((level) => level.members.length === 0) && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No team members yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start referring users to build your team network.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

