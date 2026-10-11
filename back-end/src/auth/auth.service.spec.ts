import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { Role } from '../common/enums/roles.enum';
import { UserStatus } from '../common/enums/user-status.enum';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a plain password', async () => {
      const password = 'plainPassword123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'mySecretPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await service.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mySecretPassword';
      const hash = await bcrypt.hash('differentPassword', 10);

      const isValid = await service.comparePassword(password, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should call jwtService.signAsync with the payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        phone: '+919876543210',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      };
      mockJwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const token = await service.generateToken(payload);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload);
      expect(token).toBe('signed.jwt.token');
    });
  });

  describe('verifyToken', () => {
    it('should return payload when token verification succeeds', async () => {
      const expectedPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      };
      mockJwtService.verifyAsync.mockResolvedValue(expectedPayload);

      const result = await service.verifyToken('valid.jwt.token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid.jwt.token',
      );
      expect(result).toEqual(expectedPayload);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.verifyToken('expired.jwt.token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyToken('expired.jwt.token')).rejects.toThrow(
        'Invalid or expired authentication token',
      );
    });
  });
});
