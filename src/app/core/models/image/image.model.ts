import { ImageType } from './image-type.model';
import { File } from '../file';

// Base Image model
export type Image = {
  id?: number;
  file?: File;
  type: ImageType;
};

// Create request model for backend
export type ImageCreateRequest = {
  url: string;
  type: string;
};
