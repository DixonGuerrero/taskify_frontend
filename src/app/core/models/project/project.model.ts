import { Image } from '../image/image.model';
import { User } from '../user/user.model';
import { ProjectStatus } from './project-status.model';

export type Project = {
  id?: number;
  name: string;
  description: string;
  status: ProjectStatus;
  due_date: Date;
  invite_code?: string;
  created_by: User;
  image: Image;
  members: User[];
};

export type ProjectCreateRequest = {
  name: string;
  description: string;
  status: string;
  due_date: string;
  image_id: number;
  created_by: number;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string;
  status?: string;
  due_date?: string;
  image_id?: number;
};
