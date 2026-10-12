import type { Role } from "@/common/roles.enum";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInterface
}

export interface AuthInterface {
  token: string;
  user: UserInterface
}

export interface UserRegistrationInterface {
  role: Role,
  name: string,
  email: string,
  password: string,
  phone: string,
}

export interface UserInterface {
  id: string,
  role: Role,
  name: string,
  email: string,
  phone: string,
  status: string
}