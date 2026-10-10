import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from '../schema/payment.schema';
import { PaymentStatus, RefundStatus } from '../common/enums';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentDoc = {
    _id: 'payment-001',
    order: 'order-001',
    razorpayOrderId: 'order_rzp_123456',
    razorpayPaymentId: 'pay_rzp_789012',
    amount: 1550,
    status: PaymentStatus.PAID,
  };

  const mockPaymentModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'payment-001', ...dto }),
  }));

  mockPaymentModel.find = jest.fn();
  mockPaymentModel.findById = jest.fn();
  mockPaymentModel.findOne = jest.fn();
  mockPaymentModel.findByIdAndUpdate = jest.fn();
  mockPaymentModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new payment record', async () => {
      const dto = {
        order: 'order-001',
        razorpayOrderId: 'order_rzp_123456',
        amount: 1550,
        status: PaymentStatus.CREATED,
      };

      const result = await service.create(dto as any);

      expect(mockPaymentModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: 'payment-001', amount: 1550 }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      mockPaymentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPaymentDoc]),
      });

      const result = await service.findAll();

      expect(mockPaymentModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockPaymentDoc]);
    });
  });

  describe('findOne', () => {
    it('should return payment by ID', async () => {
      mockPaymentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPaymentDoc),
      });

      const result = await service.findOne('payment-001');

      expect(mockPaymentModel.findById).toHaveBeenCalledWith('payment-001');
      expect(result).toEqual(mockPaymentDoc);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('missing-payment')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOrder', () => {
    it('should find payment by order reference', async () => {
      mockPaymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPaymentDoc),
      });

      const result = await service.findByOrder('order-001');

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        order: 'order-001',
      });
      expect(result).toEqual(mockPaymentDoc);
    });
  });

  describe('findByRazorpayOrderId', () => {
    it('should find payment by razorpayOrderId for webhook processing', async () => {
      mockPaymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPaymentDoc),
      });

      const result = await service.findByRazorpayOrderId('order_rzp_123456');

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        razorpayOrderId: 'order_rzp_123456',
      });
      expect(result).toEqual(mockPaymentDoc);
    });
  });

  describe('update', () => {
    it('should update payment status and refund fields', async () => {
      const updated = {
        ...mockPaymentDoc,
        status: PaymentStatus.REFUNDED,
        refund: {
          refundId: 'rfnd_123',
          amount: 1550,
          status: RefundStatus.PROCESSED,
        },
      };
      mockPaymentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('payment-001', {
        status: PaymentStatus.REFUNDED,
      } as any);

      expect(mockPaymentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'payment-001',
        { status: PaymentStatus.REFUNDED },
        { new: true },
      );
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw NotFoundException if payment to update is missing', async () => {
      mockPaymentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('missing-payment', {
          status: PaymentStatus.PAID,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a payment record', async () => {
      mockPaymentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPaymentDoc),
      });

      const result = await service.remove('payment-001');

      expect(mockPaymentModel.findByIdAndDelete).toHaveBeenCalledWith(
        'payment-001',
      );
      expect(result).toEqual(mockPaymentDoc);
    });

    it('should throw NotFoundException if payment to delete is missing', async () => {
      mockPaymentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing-payment')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
