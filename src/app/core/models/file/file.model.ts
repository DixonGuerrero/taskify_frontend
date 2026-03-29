import { Task } from "../task";

export type File = {
  id?: number;
  original_name: string;
  storage_key: string;
  extension: string;
  file_size: number;
  owner_id: number;
  created_at: Date;
  url: string;
  task?: Task
};
