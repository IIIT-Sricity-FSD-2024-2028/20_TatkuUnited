import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CollectiveManager,
  Customer,
  DatabaseService,
  ServiceProvider,
  SuperUser,
  UnitManager,
} from '../../common/database/database.service';
import { Role } from '../../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type AuthPrincipal = {
  id: string;
  role: Role;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  ref: SuperUser | CollectiveManager | UnitManager | ServiceProvider | Customer;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  login(dto: LoginDto) {
    const principal = this.resolvePrincipal(dto.email, dto.role);
    if (!principal) {
      throw new UnauthorizedException('Invalid email, role, or password');
    }

    if (!principal.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isValidPassword = this.databaseService.verifyPassword(
      dto.password,
      principal.password_hash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email, role, or password');
    }

    const payload: JwtPayload = {
      sub: principal.id,
      email: principal.email,
      role: principal.role,
      name: principal.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      user: {
        id: principal.id,
        role: principal.role,
        name: principal.name,
        email: principal.email,
      },
    };
  }

  getMe(payload: JwtPayload) {
    const principal = this.resolvePrincipal(payload.email, payload.role);
    if (!principal) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: principal.id,
      role: principal.role,
      name: principal.name,
      email: principal.email,
      is_active: principal.is_active,
    };
  }

  changePassword(
    payload: JwtPayload,
    currentPassword: string,
    newPassword: string,
  ): { message: string } {
    const principal = this.resolvePrincipal(payload.email, payload.role);
    if (!principal) {
      throw new UnauthorizedException('User no longer exists');
    }

    const isCurrentPasswordValid = this.databaseService.verifyPassword(
      currentPassword,
      principal.password_hash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    principal.ref.password_hash =
      this.databaseService.storePassword(newPassword);

    const now = this.databaseService.now();
    if ('updated_at' in principal.ref) {
      (
        principal.ref as CollectiveManager | UnitManager | ServiceProvider
      ).updated_at = now;
    }
    if ('last_login' in principal.ref) {
      (principal.ref as SuperUser).last_login = now;
    }

    return { message: 'Password updated successfully' };
  }

  private resolvePrincipal(email: string, role?: Role): AuthPrincipal | null {
    const normalizedEmail = email.trim().toLowerCase();
    const candidates: AuthPrincipal[] = [
      ...this.databaseService.superUsers.map((u) => ({
        id: u.super_user_id,
        role: Role.SUPER_USER,
        name: u.name,
        email: u.email,
        password_hash: u.password_hash,
        is_active: u.is_active,
        ref: u,
      })),
      ...this.databaseService.collectiveManagers.map((u) => ({
        id: u.cm_id,
        role: Role.COLLECTIVE_MANAGER,
        name: u.name,
        email: u.email,
        password_hash: u.password_hash,
        is_active: u.is_active,
        ref: u,
      })),
      ...this.databaseService.unitManagers.map((u) => ({
        id: u.um_id,
        role: Role.UNIT_MANAGER,
        name: u.name,
        email: u.email,
        password_hash: u.password_hash,
        is_active: u.is_active,
        ref: u,
      })),
      ...this.databaseService.serviceProviders.map((u) => ({
        id: u.sp_id,
        role: Role.SERVICE_PROVIDER,
        name: u.name,
        email: u.email,
        password_hash: u.password_hash,
        is_active: u.is_active,
        ref: u,
      })),
      ...this.databaseService.customers.map((u) => ({
        id: u.customer_id,
        role: Role.CUSTOMER,
        name: u.full_name,
        email: u.email,
        password_hash: u.password_hash,
        is_active: u.is_active,
        ref: u,
      })),
    ]
      .filter((u) => u.email.toLowerCase() === normalizedEmail)
      .filter((u) => (role ? u.role === role : true));

    if (candidates.length === 0) return null;
    if (candidates.length > 1 && !role) {
      throw new BadRequestException(
        'Multiple roles found for this email; provide role',
      );
    }

    return candidates[0];
  }
}
