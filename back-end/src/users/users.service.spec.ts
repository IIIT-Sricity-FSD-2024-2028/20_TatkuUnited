import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../schema/user.schema';
import { Role } from '../common/enums/roles.enum';
import { UserStatus } from '../common/enums/user-status.enum';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserDoc = {
    _id: 'user-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210',
    role: Role.CUSTOMER,
    status: UserStatus.ACTIVE,
  };

  const mockQuery = (result: any) => ({
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockUserModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'user-001', ...dto }),
  }));

  mockUserModel.find = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findOne = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();
  mockUserModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        password: 'hashedPassword',
        role: Role.CUSTOMER,
      };

      const result = await service.create(dto);

      expect(mockUserModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: 'user-001', email: 'john@example.com' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return list of users excluding password', async () => {
      mockUserModel.find.mockReturnValue(mockQuery([mockUserDoc]));

      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockUserDoc]);
    });
  });

  describe('findOne', () => {
    it('should return the user by ID', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery(mockUserDoc));

      const result = await service.findOne('user-001');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-001');
      expect(result).toEqual(mockUserDoc);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findById.mockReturnValue(mockQuery(null));

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should query user by email with password included', async () => {
      mockUserModel.findOne.mockReturnValue(mockQuery(mockUserDoc));

      const result = await service.findByEmail('john@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
      expect(result).toEqual(mockUserDoc);
    });
  });

  describe('update', () => {
    it('should update user and return modified document', async () => {
      const updated = { ...mockUserDoc, name: 'John Updated' };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      const result = await service.update('user-001', {
        name: 'John Updated',
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-001',
        { name: 'John Updated' },
        { new: true },
      );
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery(null));

      await expect(
        service.update('missing-id', { name: 'John Updated' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the user', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue(mockQuery(mockUserDoc));

      const result = await service.remove('user-001');

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user-001');
      expect(result).toEqual(mockUserDoc);
    });

    it('should throw NotFoundException if user to delete does not exist', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue(mockQuery(null));

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
