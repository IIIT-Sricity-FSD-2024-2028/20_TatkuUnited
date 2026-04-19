import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with role-aware credentials and get JWT token',
  })
  @ApiResponse({ status: 201, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current user profile from JWT' })
  @ApiResponse({ status: 200, description: 'Current authenticated user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Request() req: { user: JwtPayload }) {
    return this.authService.getMe(req.user);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Change password for currently authenticated user' })
  @ApiResponse({ status: 201, description: 'Password updated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or wrong current password',
  })
  changePassword(
    @Request() req: { user: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Logout (stateless token invalidation handled client-side)',
  })
  @ApiResponse({ status: 201, description: 'Logged out successfully' })
  logout() {
    return { message: 'Logged out successfully' };
  }
}
