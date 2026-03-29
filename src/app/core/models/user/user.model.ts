import { Image } from '../image/image.model';
import { Role } from './role.model';

export type User = {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  is_enabled: boolean;
  account_non_expired: boolean;
  account_non_locked: boolean;
  credentials_non_expired: boolean;
  image: Image;
  role: Role;
};

export type UserRequest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  image_id?: number;
  phone?: string;
  role_id?: number;
};
