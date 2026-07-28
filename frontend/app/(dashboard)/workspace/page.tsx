'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../../componenets/ui/Button';
import { Input } from '../../componenets/ui/Input';
import { Modal } from '../../componenets/ui/Modal';
import { Avatar } from '@/app/componenets/ui/Avatar';

interface WorkspaceMember {
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  members?: WorkspaceMember[];
}

export default function WorkspaceListPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/workspace/all', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWorkspaces(response.data);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? 'Could not load workspaces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchWorkspaces();
  }, [accessToken]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!name.trim()) {
      setNameError('Workspace name is required');
      return;
    }
    setNameError('');

    setIsCreating(true);
    try {
      await apiClient.post(
        '/workspace/create',
        { name },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setName('');
      setIsModalOpen(false);
      fetchWorkspaces(); 
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Could not create workspace.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-semibold text-[#1B1D1F]">Workspaces</h1></div>
        <div>
          <Button variant="primary" className="w-auto px-4" onClick={() => setIsModalOpen(true)}>
            + New workspace
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6B6F76]">Loading…</p>}
      {loadError && <p className="text-sm text-[#C1443A]">{loadError}</p>}

      {!isLoading && !loadError && workspaces.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <p className="text-sm text-[#6B6F76] mb-4">
            You're not part of any workspace yet.
          </p>
          <Button variant="primary" className="w-auto px-4 mx-auto" onClick={() => setIsModalOpen(true)}>
            Create your first workspace
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => router.push(`/workspace/${workspace.id}`)}
            className="flex items-center justify-between text-left rounded-xl p-5 border border-[#E4E4E1] hover:border-[#0F7B6C] transition-colors"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <p className="font-bold text-[#1B1D1F] truncate pr-4">{workspace.name}</p>

            {workspace.members && workspace.members.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                {workspace.members.slice(0, 3).map((member) => (
                  <div key={member.user.id} className="inline-block rounded-full ring-2 ring-white">
                    <Avatar name={member.user.name} size="sm" userId={member.user.id} />
                  </div>
                ))}

                {workspace.members.length > 3 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white bg-gray-100 text-xs font-medium text-[#6B6F76] z-10">
                    +{workspace.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a workspace">
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <Input
            id="workspace-name"
            label="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            placeholder="Rev9"
          />
          {createError && <p className="text-sm text-[#C1443A]">{createError}</p>}
          <Button variant="primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create workspace'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}