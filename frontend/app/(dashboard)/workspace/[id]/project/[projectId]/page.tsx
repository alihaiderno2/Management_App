'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../../../../../componenets/ui/Button';
import { Modal } from '../../../../../componenets/ui/Modal';
import { Avatar } from '../../../../../componenets/ui/Avatar';
import { Badge } from '../../../../../componenets/ui/Badge';
import {TaskDrawer} from '../../../../../componenets/board/TaskDrawer';
import { TaskCard } from '@/app/componenets/board/TaskCard';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
}

interface ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee?: {
    id: string;
    name: string;
  };
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;
  const { accessToken, user } = useAuthStore();

  // Project and members state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'backlog' |'board' | 'settings'>('board');
  const [settingsView, setSettingsView] = useState<'general' | 'members'>('general');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const myProjectMembership = projectMembers.find((pm) => pm.user.email === user?.email);
  const isManager = myProjectMembership?.role === 'MANAGER';

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'>('CONTRIBUTOR');
  const [addMemberError, setAddMemberError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchProjectData = async () => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const response = await apiClient.get(`/workspace/${workspaceId}/project/${projectId}`, { headers });
      setProject(response.data);
    } catch (err) {
      console.error('Could not load project details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembersData = async () => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [projMembersRes, workMembersRes] = await Promise.all([
        apiClient.get(`/workspace/${workspaceId}/project/${projectId}/members`, { headers }),
        apiClient.get(`/workspace/${workspaceId}/members`, { headers }),
      ]);
      setProjectMembers(projMembersRes.data);
      setWorkspaceMembers(workMembersRes.data.members ?? workMembersRes.data);
    } catch (err) {
      console.error('Could not load members', err);
    }
  };

  const fetchTasksData = async () => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const response = await apiClient.get(`/project/${projectId}/task`, { headers });
      setTasks(response.data);
    } catch (err) {
      console.error('Could not load tasks', err);
    }
  };

  useEffect(() => {
    if (accessToken && workspaceId && projectId) {
      fetchProjectData();
      fetchMembersData();
      fetchTasksData();
    }
  }, [accessToken, workspaceId, projectId]);

  const handleDeleteProject = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await apiClient.delete(`/workspace/${workspaceId}/project/${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      router.push(`/workspace/${workspaceId}`);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Could not delete project.');
      setIsDeleting(false);
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    setAddMemberError('');
    if (!selectedUserId) {
      setAddMemberError('Please select a user');
      return;
    }
    setIsAddingMember(true);
    try {
      await apiClient.post(
        `/workspace/${workspaceId}/project/${projectId}/members`,
        { userId: selectedUserId, role: selectedRole },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSelectedUserId('');
      setSelectedRole('CONTRIBUTOR');
      setIsAddMemberOpen(false);
      fetchMembersData();
    } catch (err: any) {
      setAddMemberError(err?.response?.data?.message ?? 'Could not add member.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      await apiClient.patch(
        `/workspace/${workspaceId}/project/${projectId}/members/${targetUserId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setOpenMenuFor(null);
      fetchMembersData();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Could not update role.');
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    const confirmed = window.confirm(`Remove ${memberName} from this project?`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/workspace/${workspaceId}/project/${projectId}/members/${targetUserId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOpenMenuFor(null);
      fetchMembersData();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Could not remove member.');
    }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    setTaskError('');

    if (!taskTitle.trim()) {
      setTaskError('Task title is required');
      return;
    }

    setIsCreatingTask(true);
    try {
      await apiClient.post(
        `/project/${projectId}/task`,
        {
          title: taskTitle,
          description: taskDescription,
          assigneeId: taskAssignee || null,
          status: 'TODO',
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setTaskTitle('');
      setTaskDescription('');
      setTaskAssignee('');
      setIsNewTaskOpen(false);

      alert('Task created successfully!');
      fetchTasksData();

    } catch (err: any) {
      setTaskError(err?.response?.data?.message ?? 'Could not create task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskUpdated = (updatedTaskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTaskId ? { ...task, ...updates } : task
      )
    );
  };

  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm) => !projectMembers.some((pm) => pm.user.id === wm.id)
  );

  if (isLoading) return <p className="text-sm text-[#6B6F76]">Loading project...</p>;
  if (!project) return <p className="text-sm text-[#C1443A]">Project not found.</p>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-sm text-[#6B6F76] mb-1">Workspace / Project</p>
          <h1 className="text-2xl font-semibold text-[#1B1D1F]">{project.name}</h1>
        </div>

        <div>
        {myProjectMembership?.role !== 'VIEWER' && (
          <Button variant="primary" className="w-auto px-4" onClick={() => setIsNewTaskOpen(true)}>
            + New Task
          </Button>
        )}
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex space-x-6 border-b border-[#E4E4E1] mb-6">
        <button
          onClick={() => setActiveTab('backlog')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'backlog' ? 'border-[#0F7B6C] text-[#0F7B6C]' : 'border-transparent text-[#6B6F76] hover:text-[#1B1D1F]'
          }`}
        >
          Backlog
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'board' ? 'border-[#0F7B6C] text-[#0F7B6C]' : 'border-transparent text-[#6B6F76] hover:text-[#1B1D1F]'
          }`}
        >
          Board
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

      {/* Main Canvas */}
      <div className="flex-1">

        {/* BACKLOG VIEW */}
        {activeTab === 'backlog' && (
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E4E1] p-6">
            <h2 className="text-lg font-semibold text-[#1B1D1F] mb-4">Project Backlog</h2>
            <div className="flex flex-col gap-2">

              {tasks.length === 0 ? (
                <p className="text-sm text-[#6B6F76]">No tasks created yet.</p>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTaskId(task.id)}
                    className="flex justify-between items-center p-4 border border-[#E4E4E1] rounded-xl hover:border-[#0F7B6C] cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1B1D1F]">{task.title}</p>
                      <p className="text-xs text-[#6B6F76] mt-1">Assignee: {task.assignee?.name || 'Unassigned'}</p>
                    </div>
                    <Badge variant={task.status === 'DONE' ? 'accent' : 'default'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BOARD VIEW */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-125">
            
            {/* TO DO COLUMN */}
            <div className="bg-[#F5F5F4] rounded-2xl p-4 flex flex-col border border-[#E4E4E1]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1B1D1F] uppercase tracking-wide">To Do</h3>
                <Badge variant="default">{tasks.filter(t => t.status === 'TODO').length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {tasks.filter(t => t.status === 'TODO').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={{ id: task.id, title: task.title, status: task.status, assigneeName: task.assignee?.name }} 
                    onClick={(id) => setSelectedTaskId(id)} 
                  />
                ))}
              </div>
            </div>

            {/* IN PROGRESS COLUMN */}
            <div className="bg-[#F5F5F4] rounded-2xl p-4 flex flex-col border border-[#E4E4E1]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1B1D1F] uppercase tracking-wide">In Progress</h3>
                <Badge variant="default">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={{ id: task.id, title: task.title, status: task.status, assigneeName: task.assignee?.name }} 
                    onClick={(id) => setSelectedTaskId(id)} 
                  />
                ))}
              </div>
            </div>

            {/* DONE COLUMN */}
            <div className="bg-[#F5F5F4] rounded-2xl p-4 flex flex-col border border-[#E4E4E1]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1B1D1F] uppercase tracking-wide">Done</h3>
                <Badge variant="default">{tasks.filter(t => t.status === 'DONE').length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {tasks.filter(t => t.status === 'DONE').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={{ id: task.id, title: task.title, status: task.status, assigneeName: task.assignee?.name }} 
                    onClick={(id) => setSelectedTaskId(id)} 
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex gap-8">
            <div className="w-48 flex-shrink-0 flex flex-col space-y-1">
              <button
                onClick={() => setSettingsView('general')}
                className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  settingsView === 'general' ? 'bg-[#E1F5EE] text-[#0F7B6C]' : 'text-[#6B6F76] hover:bg-[#F5F5F4] hover:text-[#1B1D1F]'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setSettingsView('members')}
                className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  settingsView === 'members' ? 'bg-[#E1F5EE] text-[#0F7B6C]' : 'text-[#6B6F76] hover:bg-[#F5F5F4] hover:text-[#1B1D1F]'
                }`}
              >
                Members
              </button>
            </div>

            <div className="flex-1 max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E4E4E1] p-6">

              {settingsView === 'general' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1B1D1F] mb-4">Project Details</h2>
                  <div className="mb-8">
                    <p className="text-sm font-bold text-[#1B1D1F] mb-1">Description</p>
                    <p className="text-sm text-[#6B6F76]">{project.description || 'No description provided.'}</p>
                  </div>

                  <hr className="border-[#E4E4E1] my-6" />

                  <div>
                    <h3 className="text-md font-semibold text-[#C1443A] mb-2">Danger Zone</h3>
                    <p className="text-sm text-[#6B6F76] mb-4">
                      Deleting a project will permanently remove all associated sprints and tasks.
                    </p>
                    {deleteError && <p className="text-sm text-[#C1443A] mb-2">{deleteError}</p>}
                    <Button 
                      variant="primary" 
                      onClick={handleDeleteProject} 
                      disabled={isDeleting}
                      className="!bg-[#C1443A] hover:!bg-[#A33931] !border-none w-auto px-4"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </Button>
                  </div>
                </div>
              )}

              {/* MEMBERS VIEW */}
              {settingsView === 'members' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1B1D1F]">Project Members</h2>
                      <p className="text-sm text-[#6B6F76]">Manage who has access to this project.</p>
                    </div>
                    <div>

                      {isManager && (
                        <Button variant="primary" className="w-auto px-4" onClick={() => setIsAddMemberOpen(true)}>
                          + Add Member
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="border border-[#E4E4E1] rounded-xl overflow-visible">
                    {projectMembers.map((member, i) => (
                      <div
                        key={member.user.id}
                        className={`flex items-center justify-between px-4 py-3 ${i !== projectMembers.length - 1 ? 'border-b border-[#F0F0EE]' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={member.user.name} size="sm" />
                          <div>
                            <p className="text-sm text-[#1B1D1F]">
                              {member.user.name}
                              {member.user.email === user?.email && <span className="text-[#9A9CA3] font-normal"> (you)</span>}
                            </p>
                            <p className="text-xs text-[#9A9CA3]">{member.user.email}</p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-3 relative ${openMenuFor === member.user.id ? 'z-50' : 'z-10'}`}>
                          <Badge variant={member.role === 'MANAGER' ? 'accent' : 'default'}>{member.role}</Badge>

                          {isManager && (
                            <>
                              <button
                                onClick={() => setOpenMenuFor(openMenuFor === member.user.id ? null : member.user.id)}
                                className="text-[#9A9CA3] hover:text-[#1B1D1F] px-1"
                              >
                                ⋯
                              </button>

                              {openMenuFor === member.user.id && (
                                <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-[#E4E4E1] shadow-lg bg-[#FFFFFF] overflow-hidden">
                                  {/* Display role options the user DOES NOT currently have */}
                                  {member.role !== 'MANAGER' && (
                                    <button
                                      onClick={() => handleUpdateRole(member.user.id, 'MANAGER')}
                                      className="w-full text-left px-4 py-2 text-sm text-[#1B1D1F] hover:bg-[#F5F5F4]"
                                    >
                                      Make Manager
                                    </button>
                                  )}
                                  {member.role !== 'CONTRIBUTOR' && (
                                    <button
                                      onClick={() => handleUpdateRole(member.user.id, 'CONTRIBUTOR')}
                                      className="w-full text-left px-4 py-2 text-sm text-[#1B1D1F] hover:bg-[#F5F5F4]"
                                    >
                                      Make Contributor
                                    </button>
                                  )}
                                  {member.role !== 'VIEWER' && (
                                    <button
                                      onClick={() => handleUpdateRole(member.user.id, 'VIEWER')}
                                      className="w-full text-left px-4 py-2 text-sm text-[#1B1D1F] hover:bg-[#F5F5F4]"
                                    >
                                      Make Viewer
                                    </button>
                                  )}
                                  <div className="border-t border-[#E4E4E1] my-1"></div>
                                  <button
                                    onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                                    className="w-full text-left px-4 py-2 text-sm text-[#C1443A] hover:bg-[#F5F5F4]"
                                  >
                                    Remove from project
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {projectMembers.length === 0 && (
                      <div className="p-4 text-center text-sm text-[#6B6F76]">No members found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Project Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add to Project">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Select Workspace Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none"
            >
              <option value="" disabled>Select someone...</option>
              {availableWorkspaceMembers.map((wm) => (
                <option key={wm.id} value={wm.id}>
                  {wm.name} ({wm.email})
                </option>
              ))}
            </select>
            {availableWorkspaceMembers.length === 0 && (
              <p className="text-xs text-[#9A9CA3] mt-1">All workspace members are already in this project.</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Project Role
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('VIEWER')}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  selectedRole === 'VIEWER' ? 'border-[#0F7B6C] text-[#0F7B6C] bg-[#E1F5EE]' : 'border-[#E4E4E1] text-[#6B6F76]'
                }`}
              >
                Viewer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('CONTRIBUTOR')}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  selectedRole === 'CONTRIBUTOR' ? 'border-[#0F7B6C] text-[#0F7B6C] bg-[#E1F5EE]' : 'border-[#E4E4E1] text-[#6B6F76]'
                }`}
              >
                Contributor
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('MANAGER')}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  selectedRole === 'MANAGER' ? 'border-[#0F7B6C] text-[#0F7B6C] bg-[#E1F5EE]' : 'border-[#E4E4E1] text-[#6B6F76]'
                }`}
              >
                Manager
              </button>
            </div>
          </div>

          {addMemberError && <p className="text-sm text-[#C1443A]">{addMemberError}</p>}
          <Button variant="primary" type="submit" disabled={isAddingMember || !selectedUserId}>
            {isAddingMember ? 'Adding…' : 'Add Member'}
          </Button>
        </form>
      </Modal>

      {/* Create New Task Modal */}
      <Modal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Update user authentication logic"
              className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              placeholder="Add more details about this task..."
              className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
              Assignee (Optional)
            </label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((pm) => (
                <option key={pm.user.id} value={pm.user.id}>
                  {pm.user.name} {pm.user.email === user?.email ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {taskError && <p className="text-sm text-[#C1443A]">{taskError}</p>}

          <div className="pt-2">
            <Button variant="primary" type="submit" disabled={isCreatingTask || !taskTitle.trim()}>
              {isCreatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* The Task Slide-Over Drawer */}
        <TaskDrawer 
          isOpen={!!selectedTaskId} 
          taskId={selectedTaskId} 
          projectId={projectId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={handleTaskUpdated}
        />
    </div>
  );
}