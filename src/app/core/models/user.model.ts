export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterUserDto {
  email: string;
  name?: string;
}
