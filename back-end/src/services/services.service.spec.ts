import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from '../schema/service.schema';

describe('ServicesService', () => {
  let service: ServicesService;

  const mockServiceDoc = {
    _id: 'serv-001',
    name: 'Home Deep Cleaning',
    description: 'Comprehensive sanitization and cleaning',
    category: 'cat-001',
    basePrice: 999,
    durationMinutes: 120,
    isActive: true,
  };

  const mockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockServiceModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'serv-001', ...dto }),
  }));

  mockServiceModel.find = jest.fn();
  mockServiceModel.findById = jest.fn();
  mockServiceModel.findByIdAndUpdate = jest.fn();
  mockServiceModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: mockServiceModel,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new service', async () => {
      const dto = {
        name: 'Home Deep Cleaning',
        description: 'Comprehensive sanitization and cleaning',
        category: 'cat-001',
        basePrice: 999,
        durationMinutes: 120,
      };

      const result = await service.create(dto as any);

      expect(mockServiceModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({
          _id: 'serv-001',
          name: 'Home Deep Cleaning',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should find active services with populated category', async () => {
      mockServiceModel.find.mockReturnValue(mockQuery([mockServiceDoc]));

      const result = await service.findAll();

      expect(mockServiceModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual([mockServiceDoc]);
    });

    it('should filter by category when categoryId is provided', async () => {
      mockServiceModel.find.mockReturnValue(mockQuery([mockServiceDoc]));

      const result = await service.findAll('cat-001');

      expect(mockServiceModel.find).toHaveBeenCalledWith({
        isActive: true,
        category: 'cat-001',
      });
      expect(result).toEqual([mockServiceDoc]);
    });
  });

  describe('findOne', () => {
    it('should find service by ID populating category', async () => {
      mockServiceModel.findById.mockReturnValue(mockQuery(mockServiceDoc));

      const result = await service.findOne('serv-001');

      expect(mockServiceModel.findById).toHaveBeenCalledWith('serv-001');
      expect(result).toEqual(mockServiceDoc);
    });

    it('should throw NotFoundException if service not found', async () => {
      mockServiceModel.findById.mockReturnValue(mockQuery(null));

      await expect(service.findOne('invalid-serv')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update service details', async () => {
      const updated = { ...mockServiceDoc, basePrice: 1299 };
      mockServiceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('serv-001', {
        basePrice: 1299,
      } as any);

      expect(mockServiceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'serv-001',
        { basePrice: 1299 },
        { new: true },
      );
      expect(result.basePrice).toBe(1299);
    });

    it('should throw NotFoundException if service to update does not exist', async () => {
      mockServiceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('missing-serv', { basePrice: 1299 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockServiceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockServiceDoc),
      });

      const result = await service.remove('serv-001');

      expect(mockServiceModel.findByIdAndDelete).toHaveBeenCalledWith(
        'serv-001',
      );
      expect(result).toEqual(mockServiceDoc);
    });

    it('should throw NotFoundException if service to delete does not exist', async () => {
      mockServiceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing-serv')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
