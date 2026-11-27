import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ProvidersService } from '../providers/providers.service';
import { RegionsService } from '../regions/regions.service';
import { isValidGeoCoordinates } from '../common/utils/geo.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserStatus } from '../common/enums/user-status.enum';
import { Role } from '../common/enums/roles.enum';
import { ProviderStatus } from '../common/enums';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly regionsService: RegionsService,
  ) {}

  private async ensureProviderProfile(
    userId: string,
    location?: { type: string; coordinates: [number, number] },
  ) {
    const existing = await this.providersService.findByUser(userId);
    if (!existing) {
      const hasValidCoords = isValidGeoCoordinates(location?.coordinates);
      const resolvedRegion = hasValidCoords
        ? await this.regionsService.resolveForLocation(
            location!.coordinates[0],
            location!.coordinates[1],
          )
        : null;

      await this.providersService.create({
        user: userId,
        offeredServices: [],
        experience: 0,
        workHourStart: 540,
        workHourEnd: 1080,
        workingDays: [1, 2, 3, 4, 5],
        location: {
          type: 'Point',
          coordinates: hasValidCoords ? location!.coordinates : [0, 0],
        },
        region: resolvedRegion ? resolvedRegion._id.toString() : undefined,
        status: ProviderStatus.PENDING,
      });
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user & issue JWT Bearer token',
    description:
      'Validates user email and password against the database, verifies account status, and generates a signed JWT token containing user identity and role claims.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access token and user metadata.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or blocked user account.',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Your account has been blocked. Contact support.',
      );
    }

    const isMatch = await this.authService.comparePassword(
      loginDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role === Role.PROVIDER) {
      await this.ensureProviderProfile(user._id.toString());
    }

    const accessToken = await this.authService.generateToken({
      sub: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      user: {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new customer or provider account with securely hashed password and returns the user object with an initial JWT access token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account successfully registered and authenticated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already registered or invalid fields.',
  })
  async register(@Body() registerDto: RegisterDto, @Req() req: any) {
    const name = registerDto.name || registerDto.fullName;
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    let role = registerDto.role || Role.CUSTOMER;
    if ((role as any) === 'service_provider') {
      role = Role.PROVIDER;
    }

    if (
      role === Role.ADMIN ||
      role === Role.MANAGER ||
      (role as any) === 'admin' ||
      (role as any) === 'manager'
    ) {
      const user = req?.user as AuthenticatedUser | undefined;
      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Cannot register as admin or manager through public registration. Only admins can create admin and manager accounts.',
        );
      }
    }

    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const createdUser: any = await this.usersService.create({
      name,
      email: registerDto.email,
      password: registerDto.password,
      phone: registerDto.phone,
      role: role,
      gender: registerDto.gender,
      dob: registerDto.dob,
    });

    if (createdUser.role === Role.PROVIDER) {
      await this.ensureProviderProfile(
        createdUser._id.toString(),
        registerDto.address?.location,
      );
    } else if (registerDto.address) {
      await this.usersService.addAddress(createdUser._id.toString(), {
        label: 'Home',
        line: registerDto.address.line,
        city: registerDto.address.city,
        location: registerDto.address.location,
      });
    }

    const accessToken = await this.authService.generateToken({
      sub: createdUser._id.toString(),
      email: createdUser.email,
      phone: createdUser.phone,
      role: createdUser.role,
      status: createdUser.status || UserStatus.ACTIVE,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      user: {
        id: createdUser._id.toString(),
        role: createdUser.role,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
      },
    };
  }

  @Get('profile')
  @ApiBearerAuth('bearer-token')
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description:
      'Returns the authenticated user details extracted from the JWT Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user session profile.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token.',
  })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
