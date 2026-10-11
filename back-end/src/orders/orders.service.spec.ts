import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '../schema/order.schema';
import { PaymentStatus } from '../common/enums';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderDoc = {
    _id: 'order-001',
    customer: 'cust-123',
    items: [],
    itemTotal: 1500,
    convenienceFee: 50,
    totalAmount: 1550,
    paymentStatus: PaymentStatus.CREATED,
  };

  const mockOrderModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'order-001', ...dto }),
  }));

  mockOrderModel.find = jest.fn();
  mockOrderModel.findById = jest.fn();
  mockOrderModel.findByIdAndUpdate = jest.fn();
  mockOrderModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and persist a new order', async () => {
      const dto = {
        customer: 'cust-123',
        items: [],
        address: {
          line: '123 Tech Street',
          city: 'TechCity',
          location: { type: 'Point', coordinates: [80.0, 13.0] },
        },
        itemTotal: 1500,
        convenienceFee: 50,
        totalAmount: 1550,
      };

      const result = await service.create(dto as any);

      expect(mockOrderModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: 'order-001', totalAmount: 1550 }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      mockOrderModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockOrderDoc]),
      });

      const result = await service.findAll();

      expect(mockOrderModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockOrderDoc]);
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer sorted by createdAt', async () => {
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockOrderDoc]),
        }),
      });

      const result = await service.findByCustomer('cust-123');

      expect(mockOrderModel.find).toHaveBeenCalledWith({
        customer: 'cust-123',
      });
      expect(result).toEqual([mockOrderDoc]);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrderDoc),
      });

      const result = await service.findOne('order-001');

      expect(mockOrderModel.findById).toHaveBeenCalledWith('order-001');
      expect(result).toEqual(mockOrderDoc);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invalid-order')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update order payment status', async () => {
      const updated = {
        ...mockOrderDoc,
        paymentStatus: PaymentStatus.PAID,
      };
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('order-001', {
        paymentStatus: PaymentStatus.PAID,
      });

      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'order-001',
        { paymentStatus: PaymentStatus.PAID },
        { new: true },
      );
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('should throw NotFoundException if order to update not found', async () => {
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('missing-order', {
          paymentStatus: PaymentStatus.PAID,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an order', async () => {
      mockOrderModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrderDoc),
      });

      const result = await service.remove('order-001');

      expect(mockOrderModel.findByIdAndDelete).toHaveBeenCalledWith(
        'order-001',
      );
      expect(result).toEqual(mockOrderDoc);
    });

    it('should throw NotFoundException if order to delete not found', async () => {
      mockOrderModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing-order')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
