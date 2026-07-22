'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {Button} from '../../../componenets/ui/Button';
import { Avatar } from '../../../componenets/ui/Avatar';
import { Badge } from '../../../componenets/ui/Badge';
import {Input} from '../../../componenets/ui/Input';
import {Modal} from '../../../componenets/ui/Modal';

interface Workspace {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'USER';
    disabled: boolean;
}

const RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1 , USER : 1 };

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [myMembership, setMyMembership] = useState<Member | null>(null);

  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [workspaceRes, membersRes] = await Promise.all([
        apiClient.get(`/workspace/${workspaceId}`, { headers }),
        apiClient.get(`/workspace/${workspaceId}/members`, { headers }),
      ]);
      setWorkspace(workspaceRes.data);
      setMembers(membersRes.data.members ?? membersRes.data);
      setMyMembership(membersRes.data.members?.find((m: Member) => m.email === user?.email) ?? null);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? 'Could not load this workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && workspaceId) fetchData();
  }, [accessToken, workspaceId]);

  const myRank = myMembership ? RANK[myMembership.role] : 0;

  const canManage = (target: Member) => myRank > RANK[target.role];
  const canInviteAsAdmin = myMembership?.role === 'OWNER';

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    setIsInviting(true);
    try {
        const newInviteRole = inviteRole === 'MEMBER' ? 'USER' : inviteRole;
        const res = await apiClient.post(
        `/workspace/${workspaceId}/invite`,
        { email: inviteEmail, role: newInviteRole },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setInviteEmail('');
      setInviteRole('MEMBER');
      setIsInviteOpen(false);
    } catch (err: any) {
      setInviteError(err?.response?.data?.message ?? 'Could not send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  const handlePromote = async (member: Member) => {
    try {
      await apiClient.patch(
        `/workspace/${workspaceId}/members/${member.id}`,
        { role: member.role === 'ADMIN' ? 'USER' : 'ADMIN' },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setOpenMenuFor(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Could not update role.');
    }
  };

  const handleRemove = async (member: Member) => {
    const confirmed = window.confirm(`Remove ${member.name} from this workspace?`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/workspace/${workspaceId}/members/${member.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOpenMenuFor(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Could not remove member.');
    }
  };

  if (isLoading) return <p className="text-sm text-[#6B6F76]">Loading…</p>;
  if (loadError) return <p className="text-sm text-[#C1443A]">{loadError}</p>;
  if (!workspace) return null;

  const roleBadgeVariant = (role: Member['role']) =>
    role === 'OWNER' ? 'accent' : role === 'ADMIN' ? 'default' : 'default';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1D1F]">{workspace.name}</h1>
        </div>
        <div>
        {myMembership?.role !== 'MEMBER' && (
          <Button variant="primary" className="w-auto px-4" onClick={() => setIsInviteOpen(true)}>
            + Invite member
          </Button>
        )}
        </div>
      </div>

      {/* 1. REMOVED 'overflow-hidden' from this wrapper so the last menu doesn't get cut off */}
      <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="px-6 py-4 border-b border-[#E4E4E1]">
          <h2 className="text-sm font-medium text-[#1B1D1F]">Members {members.length}</h2>
        </div>

        <div>
          {members.map((member, i) => (
            member.disabled ? null : (
            <div
              key={member.id}
              className={`flex items-center justify-between px-6 py-3 ${i !== members.length - 1 ? 'border-b border-[#F0F0EE]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="sm" />
                <div>
                  <p className="text-sm text-[#1B1D1F]">
                    {member.name}
                    {member.email === user?.email && (
                      <span className="text-[#9A9CA3] font-normal"> (you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#9A9CA3]">{member.email}</p>
                </div>
              </div>

              {/* 2. ADDED a dynamic z-index here. If the menu is open, it gets z-50, otherwise it stays z-10 */}
              <div className={`flex items-center gap-3 relative ${openMenuFor === member.id ? 'z-50' : 'z-10'}`}>
                <Badge variant={roleBadgeVariant(member.role)}>{member.role}</Badge>

                {canManage(member) && (
                  <>
                    <button
                      onClick={() => setOpenMenuFor(openMenuFor === member.id ? null : member.id)}
                      className="text-[#9A9CA3] hover:text-[#1B1D1F] px-1"
                      aria-label="Member actions"
                    >
                      ⋯
                    </button>
                    {openMenuFor === member.id && (
                      <div
                        className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-[#E4E4E1] shadow-lg overflow-hidden"
                        style={{ backgroundColor: '#FFFFFF' }}
                      >
                        {myMembership?.role === 'OWNER' && member.role !== 'OWNER' && (
                          <button
                            onClick={() => handlePromote(member)}
                            className="w-full text-left px-4 py-2 text-sm text-[#1B1D1F] hover:bg-[#F5F5F4]"
                          >
                            {member.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(member)}
                          className="w-full text-left px-4 py-2 text-sm text-[#C1443A] hover:bg-[#F5F5F4]"
                        >
                          Remove from workspace
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>)
          ))}
        </div>
      </div>
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite a member">
        <form onSubmit={handleInvite} className="space-y-4" noValidate>
          <Input
            id="invite-email"
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@example.com"
            error={inviteError}
          />

          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Role
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInviteRole('MEMBER')}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  inviteRole === 'MEMBER'
                    ? 'border-[#0F7B6C] text-[#0F7B6C] bg-[#E1F5EE]'
                    : 'border-[#E4E4E1] text-[#6B6F76]'
                }`}
              >
                Member
              </button>

              {canInviteAsAdmin && (
                <button
                  type="button"
                  onClick={() => setInviteRole('ADMIN')}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    inviteRole === 'ADMIN'
                      ? 'border-[#0F7B6C] text-[#0F7B6C] bg-[#E1F5EE]'
                      : 'border-[#E4E4E1] text-[#6B6F76]'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          <Button variant="primary" type="submit" disabled={isInviting}>
            {isInviting ? 'Sending…' : 'Send invite'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}