'use client';

import React, { useState, useEffect } from 'react';
import { 
  DndContext, DragOverlay, closestCorners, KeyboardSensor, 
  PointerSensor, useSensor, useSensors, useDraggable, useDroppable, 
  DragEndEvent, DragStartEvent 
} from '@dnd-kit/core';
import { Modal } from '../ui/Modal';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { TaskCard } from './TaskCard';
import { Task } from './KanbanBoard';

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

interface BacklogBoardProps {
  projectId: string;
  tasks: Task[];
  sprints: Sprint[];
  userRole: 'VIEWER' | 'MANAGER' | 'CONTRIBUTOR';
  onDataChanged: () => void;
  onTaskClick: (taskId: string) => void;
}


function DraggableTask({ task, onClick, disabled }: { task: Task; onClick: () => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled,
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      style={{ opacity: isDragging ? 0.4 : 1, cursor: disabled ? 'default' : 'grab' }}
      className="mb-2"
    >
      <TaskCard
        task={{
          id: task.id,
          title: task.title,
          status: task.status,
          assigneeName: task.assignee?.name,
          assigneeId: task.assignee?.id,
        }}
        onClick={onClick}
      />
    </div>
  );
}

function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`${className} transition-colors ${isOver ? 'bg-[#EAF5F3] border-[#0F7B6C]' : ''}`}
    >
      {children}
    </div>
  );
}


export function BacklogBoard({ projectId, tasks, sprints, userRole, onDataChanged, onTaskClick }: BacklogBoardProps) {
  const { accessToken } = useAuthStore();
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [updatingSprintId, setUpdatingSprintId] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const canEdit = userRole === 'MANAGER' || userRole === 'CONTRIBUTOR';

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const targetSprintId = over.id === 'backlog' ? null : (over.id as string);

    setLocalTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, sprintId: targetSprintId } : t
    ));

    try {
      await apiClient.patch(
        `project/${projectId}/task/${taskId}`, 
        { sprintId: targetSprintId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onDataChanged(); 
    } catch (error) {
      console.error('Failed to move task', error);
      setLocalTasks(tasks); 
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post(
        `/project/${projectId}/sprint`,
        { name: sprintName, startDate, endDate },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setIsModalOpen(false);
      setSprintName('');
      setStartDate('');
      setEndDate('');
      onDataChanged();
    } catch (error) {
      console.error('Failed to create sprint', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSprintStatus = async (sprintId: string, newStatus: 'ACTIVE' | 'COMPLETED') => {
    setUpdatingSprintId(sprintId);
    try {
      await apiClient.patch(
        `/project/${projectId}/sprint/${sprintId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onDataChanged();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? 'Failed to update sprint status.');
    } finally {
      setUpdatingSprintId(null);
      setOpenMenuFor(null);
    }
  };

  const handleDeleteSprint = async (sprintId: string, sprintName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${sprintName}"? Any tasks inside will be moved back to the backlog.`);
    if (!confirmed) return;
    
    setUpdatingSprintId(sprintId);
    try {
      await apiClient.delete(
        `/project/${projectId}/sprint/${sprintId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onDataChanged();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? 'Failed to delete sprint.');
    } finally {
      setUpdatingSprintId(null);
      setOpenMenuFor(null);
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 items-start">

{/* Left side */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center h-10">
            <h2 className="text-xl font-bold text-[#1B1D1F]">Sprints</h2>
            {userRole === 'MANAGER' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0F7B6C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B5C51] transition-colors"
              >
                + Create Sprint
              </button>
            )}
          </div>

          {sprints.length === 0 ? (
            <div className="p-8 border border-dashed border-[#E4E4E1] rounded-2xl text-center text-[#6B6F76]">
              No sprints created yet.
            </div>
          ) : (
            sprints.map(sprint => {
              const sprintTasks = localTasks.filter(t => (t as any).sprintId === sprint.id);
              
              return (
                <div key={sprint.id} className="bg-[#F5F5F4] rounded-2xl p-4 border border-[#E4E4E1] flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-[#1B1D1F]">{sprint.name}</h3>
                      <p className="text-xs text-[#6B6F76] mt-0.5">
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 relative">
                      <span className={`text-[10px] uppercase font-mono tracking-wide px-2 py-1 rounded-md border text-[#1B1D1F] ${sprint.status === 'ACTIVE' ? 'bg-[#EAF5F3] border-[#0F7B6C]' : 'bg-white border-[#E4E4E1]'}`}>
                        {sprint.status}
                      </span>

                      {userRole === 'MANAGER' && (
                        <>
                          {sprint.status === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateSprintStatus(sprint.id, 'ACTIVE')}
                              disabled={updatingSprintId === sprint.id}
                              className="text-xs text-[#1B1D1F] bg-white border border-[#E4E4E1] hover:border-[#0F7B6C] hover:text-[#0F7B6C] px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}

                          {sprint.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleUpdateSprintStatus(sprint.id, 'COMPLETED')}
                              disabled={updatingSprintId === sprint.id}
                              className="text-xs bg-[#0F7B6C] text-white hover:bg-[#0B5C51] px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() => setOpenMenuFor(openMenuFor === sprint.id ? null : sprint.id)}
                            className="text-[#9A9CA3] hover:text-[#1B1D1F] px-1 text-lg leading-none"
                          >
                            ⋯
                          </button>
                          
                          {openMenuFor === sprint.id && (
                            <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-[#E4E4E1] shadow-lg bg-[#FFFFFF] overflow-hidden">
                              <button
                                onClick={() => handleDeleteSprint(sprint.id, sprint.name)}
                                className="w-full text-left px-4 py-2 text-sm text-[#C1443A] hover:bg-[#F5F5F4] transition-colors"
                              >
                                Delete Sprint
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <DroppableZone 
                    id={sprint.id} 
                    className="min-h-25 bg-white rounded-xl border border-dashed border-[#E4E4E1] p-3 flex flex-col gap-2"
                  >
                    {sprintTasks.map(task => (
                      <DraggableTask key={task.id} task={task} onClick={() => onTaskClick(task.id)} disabled={!canEdit} />
                    ))}
                    {sprintTasks.length === 0 && (
                      <p className="text-xs text-[#9A9CA3] text-center my-auto">Drop tasks here</p>
                    )}
                  </DroppableZone>
                </div>
              );
            })
          )}
        </div>

{/* Right side */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center h-10">
            <h2 className="text-xl font-bold text-[#1B1D1F]">Backlog</h2>
          </div>
          
          <DroppableZone 
            id="backlog" 
            className="bg-[#F5F5F4] rounded-2xl p-4 border border-[#E4E4E1] min-h-125 flex flex-col gap-2"
          >
            {localTasks.filter(t => !(t as any).sprintId).map(task => (
              <DraggableTask key={task.id} task={task} onClick={() => onTaskClick(task.id)} disabled={!canEdit} />
            ))}
            {localTasks.filter(t => !(t as any).sprintId).length === 0 && (
              <p className="text-sm text-[#6B6F76] text-center pt-8">No tasks in the backlog.</p>
            )}
          </DroppableZone>
        </div>

      </div>

      {/* CREATE SPRINT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Sprint">
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">Sprint Name</label>
            <input required type="text" placeholder="e.g. Sprint 1" value={sprintName} onChange={(e) => setSprintName(e.target.value)} className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">Start Date</label>
              <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5">End Date</label>
              <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-[#E4E4E1] p-2 text-sm bg-white text-[#1B1D1F] focus:border-[#0F7B6C] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isSubmitting || !sprintName.trim()} className="w-full bg-[#0F7B6C] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0B5C51] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </Modal>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 scale-105 rotate-2 transition-transform cursor-grabbing">
            <TaskCard
              task={{
                id: activeTask.id,
                title: activeTask.title,
                status: activeTask.status,
                assigneeName: activeTask.assignee?.name,
                assigneeId: activeTask.assignee?.id,
              }}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}