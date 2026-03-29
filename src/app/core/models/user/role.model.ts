export enum RoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export type Role = {
  id?: number;
  name: RoleEnum;
};
