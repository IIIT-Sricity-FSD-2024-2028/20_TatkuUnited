import { Role } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  providerId?: string; // profile id if role === Role.PROVIDER
  managerId?: string; // profile id if role === Role.MANAGER
  regionIds?: string[]; // regions managed if role === Role.MANAGER
}
