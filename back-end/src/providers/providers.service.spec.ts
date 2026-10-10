import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Provider } from '../schema/provider.schema';
import { ProviderStatus } from '../common/enums';

describe('ProvidersService', () => {
  let service: ProvidersService;

  const mockProviderDoc = {
    _id: 'prov-001',
    user: 'user-001',
    bio: 'Professional plumber with 5 years experience',
    status: ProviderStatus.PENDING,
    skills: [],
    primaryRegion: 'reg-001',
    currentLocation: { type: 'Point', coordinates: [80.0, 13.0] },
  };

  const mockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockProviderModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'prov-001', ...dto }),
  }));

  mockProviderModel.find = jest.fn();
  mockProviderModel.findById = jest.fn();
  mockProviderModel.findOne = jest.fn();
  mockProviderModel.findByIdAndUpdate = jest.fn();
  mockProviderModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a provider profile', async () => {
      const dto = {
        user: 'user-001',
        bio: 'Professional plumber',
        status: ProviderStatus.PENDING,
        primaryRegion: 'reg-001',
        currentLocation: { type: 'Point', coordinates: [80.0, 13.0] },
      };

      const result = await service.create(dto as any);

      expect(mockProviderModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: 'prov-001', user: 'user-001' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all providers populating user info without password', async () => {
      mockProviderModel.find.mockReturnValue(mockQuery([mockProviderDoc]));

      const result = await service.findAll();

      expect(mockProviderModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockProviderDoc]);
    });
  });

  describe('findOne', () => {
    it('should return provider by ID populating user', async () => {
      mockProviderModel.findById.mockReturnValue(mockQuery(mockProviderDoc));

      const result = await service.findOne('prov-001');

      expect(mockProviderModel.findById).toHaveBeenCalledWith('prov-001');
      expect(result).toEqual(mockProviderDoc);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockProviderModel.findById.mockReturnValue(mockQuery(null));

      await expect(service.findOne('invalid-prov')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('should find provider profile by associated user ID', async () => {
      mockProviderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProviderDoc),
      });

      const result = await service.findByUser('user-001');

      expect(mockProviderModel.findOne).toHaveBeenCalledWith({
        user: 'user-001',
      });
      expect(result).toEqual(mockProviderDoc);
    });
  });

  describe('update', () => {
    it('should update provider status (e.g. approved by manager)', async () => {
      const updated = {
        ...mockProviderDoc,
        status: ProviderStatus.APPROVED,
      };
      mockProviderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('prov-001', {
        status: ProviderStatus.APPROVED,
      });

      expect(mockProviderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'prov-001',
        { status: ProviderStatus.APPROVED },
        { new: true },
      );
      expect(result.status).toBe(ProviderStatus.APPROVED);
    });

    it('should throw NotFoundException if provider to update not found', async () => {
      mockProviderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('missing-prov', {
          status: ProviderStatus.APPROVED,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a provider record', async () => {
      mockProviderModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProviderDoc),
      });

      const result = await service.remove('prov-001');

      expect(mockProviderModel.findByIdAndDelete).toHaveBeenCalledWith(
        'prov-001',
      );
      expect(result).toEqual(mockProviderDoc);
    });

    it('should throw NotFoundException if provider to delete not found', async () => {
      mockProviderModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing-prov')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
