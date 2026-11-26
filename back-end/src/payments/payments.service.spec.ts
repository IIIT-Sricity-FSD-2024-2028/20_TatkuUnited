import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from '../schema/payment.schema';
import { Order } from '../schema/order.schema';
import { Booking } from '../schema/booking.schema';
import { User } from '../schema/user.schema';
import { Notification } from '../schema/notification.schema';
import { MatchingService } from '../matching/matching.service';
import { PaymentStatus, RefundStatus } from '../common/enums';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let orderModelMock: any;

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
  mockPaymentModel.db = {
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: {
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Booking.name),
          useValue: {
            updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
            find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findByIdAndUpdate: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getModelToken(Notification.name),
          useValue: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({}),
          })),
        },
        {
          provide: MatchingService,
          useValue: {
            offerBooking: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    orderModelMock = module.get(getModelToken(Order.name));
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
      expect((result as any).status).toBe(PaymentStatus.REFUNDED);
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

  describe('simulate', () => {
    it('should simulate payment success and update order/payment to PAID', async () => {
      const orderDoc: any = {
        _id: 'order-001',
        customer: 'cust-001',
        paymentStatus: PaymentStatus.CREATED,
        expiresAt: new Date(Date.now() + 600000),
        totalAmount: 1550,
        save: jest.fn().mockResolvedValue({}),
      };
      orderModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(orderDoc),
      });
      orderModelMock.findOneAndUpdate.mockResolvedValue({
        ...orderDoc,
        paymentStatus: PaymentStatus.PAID,
      });

      const paymentDoc = {
        _id: 'payment-001',
        order: 'order-001',
        status: PaymentStatus.CREATED,
        save: jest.fn().mockResolvedValue({}),
      };
      mockPaymentModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(paymentDoc),
        }),
      });

      const result = await service.simulate('order-001', true, {
        userId: 'cust-001',
        role: 'customer' as any,
        email: 'c@test.com',
        status: 'active' as any,
      });

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(paymentDoc.save).toHaveBeenCalled();
    });

    it('should simulate payment failure and update order/payment to FAILED', async () => {
      const orderDoc: any = {
        _id: 'order-001',
        customer: 'cust-001',
        paymentStatus: PaymentStatus.CREATED,
        expiresAt: new Date(Date.now() + 600000),
        totalAmount: 1550,
        save: jest.fn().mockResolvedValue({}),
      };
      orderModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(orderDoc),
      });
      orderModelMock.findOneAndUpdate.mockResolvedValue({
        ...orderDoc,
        paymentStatus: PaymentStatus.FAILED,
      });

      const paymentDoc = {
        _id: 'payment-001',
        order: 'order-001',
        save: jest.fn().mockResolvedValue({}),
      };
      mockPaymentModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(paymentDoc),
        }),
      });

      const result = await service.simulate('order-001', false, {
        userId: 'cust-001',
        role: 'customer' as any,
        email: 'c@test.com',
        status: 'active' as any,
      });

      expect(result.success).toBe(false);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
    });
  });
});
