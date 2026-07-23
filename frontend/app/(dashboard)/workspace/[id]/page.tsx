'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../../../componenets/ui/Button';
import { Input } from '../../../componenets/ui/Input';
import { Modal } from '../../../componenets/ui/Modal';
import { Avatar } from '../../../componenets/ui/Avatar';
import { Badge } from '../../../componenets/ui/Badge';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'USER';
  disabled: boolean;
}

const RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1, USER: 1 };

export default function WorkspaceOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { accessToken, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'settings'>('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [createProjectError, setCreateProjectError] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [myMembership, setMyMembership] = useState<Member | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const myRank = myMembership ? RANK[myMembership.role] : 0;
  const canManage = (target: Member) => myRank > RANK[target.role];
  const canInviteAsAdmin = myMembership?.role === 'OWNER';
  const roleBadgeVariant = (role: Member['role']) =>
    role === 'OWNER' ? 'accent' : role === 'ADMIN' ? 'default' : 'default';

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [projectsRes, membersRes] = await Promise.all([
        apiClient.get(`/workspace/${workspaceId}/project`, { headers }),
        apiClient.get(`/workspace/${workspaceId}/members`, { headers }),
      ]);
      
      setProjects(projectsRes.data);
      setMembers(membersRes.data.members ?? membersRes.data);
      setMyMembership(membersRes.data.members?.find((m: Member) => m.email === user?.email) ?? null);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? 'Could not load workspace data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && workspaceId) fetchData();
  }, [accessToken, workspaceId]);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    setCreateProjectError('');

    if (!projectName.trim()) {
      setProjectNameError('Project name is required');
      return;
    }
    setProjectNameError('');
    setIsCreatingProject(true);

    try {
      await apiClient.post(
        `/workspace/${workspaceId}/project`,
        { name: projectName, description: projectDesc },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setProjectName('');
      setProjectDesc('');
      setIsProjectModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      setCreateProjectError(err?.response?.data?.message ?? 'Could not create project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

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
      await apiClient.post(
        `/workspace/${workspaceId}/invite`,
        { email: inviteEmail, role: newInviteRole },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setInviteEmail('');
      setInviteRole('MEMBER');
      setIsInviteOpen(false);
      fetchData(); 
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

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <p className="text-sm text-[#6B6F76] mb-1">Workspace</p>
        <h1 className="text-2xl font-semibold text-[#1B1D1F]">Workspace Overview</h1>
      </div>

      <div className="flex space-x-6 border-b border-[#E4E4E1] mb-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'projects' ? 'border-[#0F7B6C] text-[#0F7B6C]' : 'border-transparent text-[#6B6F76] hover:text-[#1B1D1F]'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'members' ? 'border-[#0F7B6C] text-[#0F7B6C]' : 'border-transparent text-[#6B6F76] hover:text-[#1B1D1F]'
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings' ? 'border-[#0F7B6C] text-[#0F7B6C]' : 'border-transparent text-[#6B6F76] hover:text-[#1B1D1F]'
          }`}
        >
          Settings
        </button>
      </div>

      {isLoading && <p className="text-sm text-[#6B6F76]">Loading data…</p>}
      {loadError && <p className="text-sm text-[#C1443A]">{loadError}</p>}

      {/* Main Canvas Views */}
      {!isLoading && !loadError && (
        <div className="flex-1">
          
          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button variant="primary" className="w-auto px-4" onClick={() => setIsProjectModalOpen(true)}>
                  + New project
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl p-8 text-center bg-[#FFFFFF] border border-[#E4E4E1]">
                  <p className="text-sm text-[#6B6F76] mb-4">No projects exist in this workspace yet.</p>
                  <Button variant="primary" className="w-auto px-4 mx-auto" onClick={() => setIsProjectModalOpen(true)}>
                    Create your first project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => router.push(`/workspace/${workspaceId}/project/${project.id}`)}
                      className="text-left rounded-xl p-5 border border-[#E4E4E1] hover:border-[#0F7B6C] transition-colors flex flex-col items-start bg-[#FFFFFF]"
                    >
                      <p className="font-bold text-[#1B1D1F]">{project.name}</p>
                      <p className="text-sm text-[#6B6F76] mt-2 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div>
              <div className="flex justify-end mb-4">
                {myMembership?.role !== 'MEMBER' && (
                  <Button variant="primary" className="w-auto px-4" onClick={() => setIsInviteOpen(true)}>
                    + Invite member
                  </Button>
                )}
              </div>

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
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-xl bg-[#FFFFFF] rounded-2xl border border-[#E4E4E1] p-6">
              <h2 className="text-lg font-semibold text-[#1B1D1F] mb-4">Workspace Settings</h2>
              <p className="text-sm text-[#6B6F76]">
                Workspace renaming and deletion options will go here.
              </p>
            </div>
          )}

        </div>
      )}

      {/* --- Modals --- */}
      
      {/* Create Project Modal */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Create a project">
        <form onSubmit={handleCreateProject} className="space-y-4" noValidate>
          <Input
            id="project-name"
            label="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={projectNameError}
            placeholder="Frontend App"
          />
          <Input
            id="project-description"
            label="Description (optional)"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="Next.js interface development"
          />
          {createProjectError && <p className="text-sm text-[#C1443A]">{createProjectError}</p>}
          <Button variant="primary" type="submit" disabled={isCreatingProject}>
            {isCreatingProject ? 'Creating…' : 'Create project'}
          </Button>
        </form>
      </Modal>

      {/* Invite Member Modal */}
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