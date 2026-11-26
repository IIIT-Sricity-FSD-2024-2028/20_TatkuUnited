import type { Role } from "@/common/roles.enum";
import type { User } from "@/schema";

/** Login returns a summary, not the full /users/me document. */
export type SessionUser = Pick<User, "name" | "email" | "phone" | "role"> & {
  id: User["_id"];
  status?: User["status"];
};

/** Compatibility alias; field definitions come from the canonical User schema. */
export type UserInterface = SessionUser;

/** /auth/profile returns JWT identity, not a database user or login summary. */
export interface AuthProfile {
  userId: string;
  email: User["email"];
  phone?: User["phone"];
  role: User["role"];
  status: User["status"];
  providerId?: string;
  managerId?: string;
  regionIds?: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: SessionUser
}

export interface AuthInterface {
  token: string;
  user: SessionUser
}

export interface UserRegistrationInterface {
  role: Role,
  name: string,
  email: string,
  password: string,
  phone: string,
  address?: {
    line: string;
    city: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  };
}
