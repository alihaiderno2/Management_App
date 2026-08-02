'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/app/componenets/ui/Button';

interface PendingInvite {
  workspaceId: string;
  workspaceName: string;
  role: string;
  token: string;
}

interface ActiveTask {
  id: string;
  title: string;
  status: string;
  project?: { name: string };
}

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchInvites = async () => {
      try {
        const res = await apiClient.get('/workspace/pending-invites', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setInvites(res.data);
      } catch (error) {
        console.error('Failed to fetch pending invites', error);
      } finally {
        setIsLoadingInvites(false);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await apiClient.get('/task/my-tasks', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setTasks(res.data);
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchInvites();
    fetchTasks();
  }, [accessToken]);

  const handleAcceptInvite = async (workspaceId: string, token: string) => {
    setIsAccepting(workspaceId);
    try {
      await apiClient.post(`/workspace/${workspaceId}/invites/${token}/accept`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setInvites(prev => prev.filter(inv => inv.workspaceId !== workspaceId));
      router.push(`/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to accept invite', error);
      alert('Failed to accept invitation. It may have expired.');
    } finally {
      setIsAccepting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVIEW': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TODO': default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1B1D1F] mb-1">
          Good afternoon{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-[#6B6F76]">
          Here is what's happening across your workspaces today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Pending Invites Section */}
          {!isLoadingInvites && invites.length > 0 && (
            <div className="bg-[#F9FAFB] border border-[#E4E4E1] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#1B1D1F] mb-4 uppercase tracking-wider">
                Pending Invitations ({invites.length})
              </h2>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.workspaceId} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                      <p className="font-bold text-[#1B1D1F]">{invite.workspaceName}</p>
                      <p className="text-xs text-[#6B6F76] mt-0.5">
                        Invited as <span className="font-semibold text-[#1B1D1F]">{invite.role}</span>
                      </p>
                    </div>
                    <Button 
                      variant="primary" 
                      className="px-4 py-1.5 text-sm"
                      onClick={() => handleAcceptInvite(invite.workspaceId, invite.token)}
                      disabled={isAccepting === invite.workspaceId}
                    >
                      {isAccepting === invite.workspaceId ? 'Joining...' : 'Accept Invite'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
            <h2 className="text-sm font-semibold text-[#1B1D1F] mb-5 uppercase tracking-wider">My Active Tasks</h2>
            
            {isLoadingTasks ? (
              <p className="text-sm text-[#6B6F76] text-center mt-12">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl">📋</span>
                </div>
                <p className="text-sm font-medium text-[#1B1D1F]">No tasks assigned to you</p>
                <p className="text-xs text-[#9A9CA3] mt-1">Kick back and relax, your queue is clear.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[#9A9CA3] group-hover:bg-[#0F7B6C]/10 group-hover:text-[#0F7B6C] transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-[#1B1D1F] truncate group-hover:text-[#0F7B6C] transition-colors duration-200">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9A9CA3]">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <p className="text-xs font-medium text-[#6B6F76] truncate">
                            {task.project?.name ? task.project.name : 'Personal'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#1B1D1F] mb-4 uppercase tracking-wider">Recent Workspaces</h2>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start text-[#6B6F76]" onClick={() => router.push('/workspace')}>
                Browse all workspaces →
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[250px]">
            <h2 className="text-sm font-semibold text-[#1B1D1F] mb-4 uppercase tracking-wider">Recent Activity</h2>
            <p className="text-xs text-[#9A9CA3] text-center mt-12">No recent activity to show.</p>
          </div>
        </div>
      </div>
    </div>
  );
}