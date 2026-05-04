import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { DatabaseService } from '../../common/database/database.service';
import { Role } from '../../common/enums/role.enum';

type CurrentPrincipal = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly databaseService: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'tatku-dev-jwt-secret',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    const current = this.resolveCurrentPrincipal(payload);
    if (!current) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      ...payload,
      sub: current.id,
      name: current.name,
      email: current.email,
      role: current.role,
    };
  }

  private resolveCurrentPrincipal(payload: JwtPayload): CurrentPrincipal | null {
    const email = payload.email?.trim().toLowerCase();
    if (!email) return null;

    const normalizedRole = payload.role?.toLowerCase() as Role;

    if (normalizedRole === Role.SUPER_USER) {
      const user = this.databaseService.superUsers.find(
        (row) => row.email.toLowerCase() === email && row.is_active,
      );
      return user
        ? { id: user.super_user_id, role: normalizedRole, name: user.name, email: user.email }
        : null;
    }

    if (normalizedRole === Role.COLLECTIVE_MANAGER) {
      const user = this.databaseService.collectiveManagers.find(
        (row) => row.email.toLowerCase() === email && row.is_active,
      );
      return user
        ? { id: user.cm_id, role: normalizedRole, name: user.name, email: user.email }
        : null;
    }

    if (normalizedRole === Role.UNIT_MANAGER) {
      const user = this.databaseService.unitManagers.find(
        (row) => row.email.toLowerCase() === email && row.is_active,
      );
      return user
        ? { id: user.um_id, role: normalizedRole, name: user.name, email: user.email }
        : null;
    }

    if (normalizedRole === Role.SERVICE_PROVIDER) {
      const user = this.databaseService.serviceProviders.find(
        (row) => row.email.toLowerCase() === email && row.is_active,
      );
      return user
        ? { id: user.sp_id, role: normalizedRole, name: user.name, email: user.email }
        : null;
    }

    if (normalizedRole === Role.CUSTOMER) {
      const user = this.databaseService.customers.find(
        (row) => row.email.toLowerCase() === email && row.is_active,
      );
      return user
        ? { id: user.customer_id, role: normalizedRole, name: user.full_name, email: user.email }
        : null;
    }

    return null;
  }
}
