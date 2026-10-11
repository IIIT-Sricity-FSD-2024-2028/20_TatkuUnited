import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from '../schema/booking.schema';
import { BookingStatus } from '../common/enums';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockBookingDoc = {
    _id: 'booking-001',
    order: 'order-101',
    customer: 'cust-201',
    provider: 'prov-301',
    service: 'serv-401',
    region: 'reg-501',
    scheduledDate: new Date('2026-10-15'),
    startTime: 600, // 10:00 AM
    endTime: 660, // 11:00 AM
    status: BookingStatus.PENDING,
  };

  const mockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockBookingModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'booking-001', ...dto }),
  }));

  mockBookingModel.find = jest.fn();
  mockBookingModel.findById = jest.fn();
  mockBookingModel.findByIdAndUpdate = jest.fn();
  mockBookingModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new booking', async () => {
      const dto = {
        order: 'order-101',
        customer: 'cust-201',
        provider: 'prov-301',
        service: 'serv-401',
        region: 'reg-501',
        scheduledDate: new Date('2026-10-15'),
        startTime: 600,
        endTime: 660,
      };

      const result = await service.create(dto as any);

      expect(mockBookingModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: 'booking-001', order: 'order-101' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all bookings', async () => {
      mockBookingModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockBookingDoc]),
      });

      const result = await service.findAll();

      expect(mockBookingModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockBookingDoc]);
    });
  });

  describe('findByCustomer', () => {
    it('should find bookings for customer sorted by createdAt desc', async () => {
      mockBookingModel.find.mockReturnValue(mockQuery([mockBookingDoc]));

      const result = await service.findByCustomer('cust-201');

      expect(mockBookingModel.find).toHaveBeenCalledWith({
        customer: 'cust-201',
      });
      expect(result).toEqual([mockBookingDoc]);
    });
  });

  describe('findByProvider', () => {
    it('should find bookings for provider sorted by scheduledDate and startTime', async () => {
      mockBookingModel.find.mockReturnValue(mockQuery([mockBookingDoc]));

      const result = await service.findByProvider('prov-301');

      expect(mockBookingModel.find).toHaveBeenCalledWith({
        provider: 'prov-301',
      });
      expect(result).toEqual([mockBookingDoc]);
    });
  });

  describe('findActiveByProviderAndDate', () => {
    it('should find bookings that hold slots for slot overlap prevention', async () => {
      const targetDate = new Date('2026-10-15');
      mockBookingModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockBookingDoc]),
      });

      const result = await service.findActiveByProviderAndDate(
        'prov-301',
        targetDate,
      );

      expect(mockBookingModel.find).toHaveBeenCalledWith({
        provider: 'prov-301',
        scheduledDate: targetDate,
        status: {
          $in: [
            BookingStatus.PENDING,
            BookingStatus.AWAITING_PROVIDER,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      });
      expect(result).toEqual([mockBookingDoc]);
    });
  });

  describe('findOne', () => {
    it('should return a populated booking document', async () => {
      mockBookingModel.findById.mockReturnValue(mockQuery(mockBookingDoc));

      const result = await service.findOne('booking-001');

      expect(mockBookingModel.findById).toHaveBeenCalledWith('booking-001');
      expect(result).toEqual(mockBookingDoc);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockBookingModel.findById.mockReturnValue(mockQuery(null));

      await expect(service.findOne('invalid-booking')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update booking status / fields', async () => {
      const updated = { ...mockBookingDoc, status: BookingStatus.CONFIRMED };
      mockBookingModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('booking-001', {
        status: BookingStatus.CONFIRMED,
      });

      expect(mockBookingModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'booking-001',
        { status: BookingStatus.CONFIRMED },
        { new: true },
      );
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw NotFoundException if booking to update not found', async () => {
      mockBookingModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('missing-booking', {
          status: BookingStatus.CANCELLED,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a booking', async () => {
      mockBookingModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingDoc),
      });

      const result = await service.remove('booking-001');

      expect(mockBookingModel.findByIdAndDelete).toHaveBeenCalledWith(
        'booking-001',
      );
      expect(result).toEqual(mockBookingDoc);
    });

    it('should throw NotFoundException if booking to delete not found', async () => {
      mockBookingModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing-booking')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
