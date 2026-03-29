import { Project } from '../project/project.model';
import { User } from '../user';
import { TaskPriority } from './task-priority.model';
import { TaskStatus } from './task-status.model';
import { File } from '../file';

export type Task = {
  id?: number;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Date;
  assigned: User;
  project: Project;
  attachments?: File[];
};

export type TaskRequest = {
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_id: number;
  project_id: number;
};
