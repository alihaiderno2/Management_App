'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Badge } from '../ui/Badge';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BACKLOG';
  order: number;
  sprintId?: string | null;
  assignee?: {
    id: string;
    name: string;
  };
}

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  activeSprintId?: string | null;
  userRole: 'VIEWER' | 'MANAGER' | 'CONTRIBUTOR';
  currentUserId: string;
  onTaskUpdated: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (taskId: string) => void;
}

function SortableTask({ task, onClick, canDrag }: { task: Task; onClick: (id: string) => void , canDrag: boolean}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: canDrag ? 'grab' : 'pointer',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-manipulation">
      <div onPointerDown={(e) => {
        if (e.button !== 0) e.preventDefault();
      }}>
        <TaskCard
          task={{
            id: task.id,
            title: task.title,
            status: task.status as any,
            assigneeName: task.assignee?.name,
            assigneeId : task.assignee?.id,
          }}
          onClick={() => onClick(task.id)}
        />
      </div>
    </div>
  );
}

function KanbanColumn({ 
  id, title, tasks, userRole, currentUserId, onTaskClick 
}: { 
  id: string; title: string; tasks: Task[]; userRole: string; currentUserId: string; onTaskClick: (id: string) => void 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'Column', status: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-[85vw] sm:min-w-75 md:min-w-0 snap-center shrink-0 
        bg-[#F5F5F4] rounded-2xl p-4 flex flex-col border transition-colors duration-200 
        ${isOver ? 'border-[#0F7B6C] bg-[#E1F5EE]' : 'border-[#E4E4E1]'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1B1D1F] uppercase tracking-wide">{title}</h3>
        <Badge variant="default">{tasks.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 min-h-75 w-full">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const isAssignee = task.assignee?.id === currentUserId;
            const isManager = userRole === 'MANAGER';
            const isUnassigned = !task.assignee;
            const canDrag = isManager || isAssignee || (isUnassigned && userRole !== 'VIEWER');

            return (
              <SortableTask key={task.id} task={task} onClick={onTaskClick} canDrag={canDrag} />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ projectId, tasks, activeSprintId, userRole, currentUserId, onTaskUpdated, onTaskClick }: KanbanBoardProps) {
  const { accessToken } = useAuthStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { 
      activationConstraint: { distance: 5 } 
    }),
    useSensor(TouchSensor, { 
      activationConstraint: { delay: 250, tolerance: 5 } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  if (!activeSprintId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-100 border border-dashed border-[#E4E4E1] rounded-2xl bg-[#FAFAFA]">
        <h2 className="text-lg font-bold text-[#1B1D1F] mb-2">No Active Sprint</h2>
        <p className="text-sm text-[#6B6F76]">
          Go to the Backlog tab and start a pending sprint to view tasks on the board.
        </p>
      </div>
    );
  }

  const sprintTasks = tasks.filter(t => t.sprintId === activeSprintId);

  const todoTasks = sprintTasks.filter((t) => t.status === 'TODO').sort((a, b) => a.order - b.order);
  const inProgressTasks = sprintTasks.filter((t) => t.status === 'IN_PROGRESS').sort((a, b) => a.order - b.order);
  const doneTasks = sprintTasks.filter((t) => t.status === 'DONE').sort((a, b) => a.order - b.order);


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    let newStatus = activeTask.status;
    let isSameColumnSort = false;

    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(overId)) {
      newStatus = overId as any;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        if (newStatus === activeTask.status) {
          isSameColumnSort = true;
        }
      }
    }

    if (isSameColumnSort && activeTaskId !== overId) {
      const columnTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => a.order - b.order);
      
      const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);
      
      const newSortedColumn = arrayMove(columnTasks, oldIndex, newIndex);
      
      let newOrder = 0;
      if (newIndex === 0) {
        newOrder = newSortedColumn[1].order - 1000; 
      } else if (newIndex === newSortedColumn.length - 1) {
        newOrder = newSortedColumn[newIndex - 1].order + 1000;
      } else {
        const prevOrder = newSortedColumn[newIndex - 1].order;
        const nextOrder = newSortedColumn[newIndex + 1].order;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      onTaskUpdated(activeTaskId, { order: newOrder });

      try {
        await apiClient.patch(
          `/project/${projectId}/task/${activeTaskId}/move`,
          { order: newOrder, status: newStatus },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (error) {
        console.error('Failed to reorder task', error);
        onTaskUpdated(activeTaskId, { order: activeTask.order });
      }
      return; 
    }

    if (newStatus !== activeTask.status) {
      const oldStatus = activeTask.status;
      const oldOrder = activeTask.order;

      const destTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => a.order - b.order);
      const newOrder = destTasks.length > 0 ? destTasks[destTasks.length - 1].order + 1000 : 1000;

      onTaskUpdated(activeTaskId, { status: newStatus, order: newOrder });

      try {
        await apiClient.patch(
          `/project/${projectId}/task/${activeTaskId}/move`,
          { status: newStatus, order: newOrder },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (error) {
        console.error('Failed to move task', error);
        onTaskUpdated(activeTaskId, { status: oldStatus, order: oldOrder }); 
      }
    }
  };

  const activeDragTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex md:grid md:grid-cols-3 gap-6 h-full min-h-125 overflow-x-auto snap-x snap-mandatory pb-6 sm:pb-0 scrollbar-hide">
        <KanbanColumn
          id="TODO" title="To Do" tasks={todoTasks}
          userRole={userRole} currentUserId={currentUserId} onTaskClick={onTaskClick} 
        />
        <KanbanColumn
          id="IN_PROGRESS" title="In Progress" tasks={inProgressTasks}
          userRole={userRole} currentUserId={currentUserId} onTaskClick={onTaskClick}
        />
        <KanbanColumn
          id="DONE" title="Done" tasks={doneTasks}
          userRole={userRole} currentUserId={currentUserId} onTaskClick={onTaskClick}
        />
      </div>

      <DragOverlay>
        {activeId && activeDragTask ? (
          <div className="opacity-90 shadow-xl cursor-grabbing scale-105 rotate-2 transition-transform">
            <TaskCard
              task={{
                id: activeDragTask.id,
                title: activeDragTask.title,
                status: activeDragTask.status as any,
                assigneeName: activeDragTask.assignee?.name,
                assigneeId : activeDragTask.assignee?.id,
              }}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}