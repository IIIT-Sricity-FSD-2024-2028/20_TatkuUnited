import { Role } from '../../common/enums/roles.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

export interface JwtPayload {
  sub: string; // User._id
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  iat?: number;
  exp?: number;
}
