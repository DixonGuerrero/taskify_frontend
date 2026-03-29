export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  username: string;
  message: string;
  jwt: string;
  status: boolean;
};
