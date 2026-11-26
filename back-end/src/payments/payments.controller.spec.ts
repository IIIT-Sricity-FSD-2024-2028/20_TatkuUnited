import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController - Mock Payment Guard Truth Table', () => {
  let controller: PaymentsController;
  let paymentsServiceMock: any;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    paymentsServiceMock = {
      simulate: jest.fn().mockResolvedValue({
        success: true,
        orderId: 'order-001',
        paymentStatus: 'paid',
      }),
      create: jest.fn(),
      findAll: jest.fn(),
      findByOrder: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: paymentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  const dummyReq = {
    user: {
      userId: 'user-001',
      role: 'customer',
      email: 'customer@test.com',
      status: 'active',
    },
  };

  // Truth Table Combination 1: production + MOCK_PAYMENTS=true => FORBIDDEN
  it('1. should reject simulation in production even when MOCK_PAYMENTS=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MOCK_PAYMENTS = 'true';

    expect(() =>
      controller.simulate({ orderId: 'order-001', success: true }, dummyReq),
    ).toThrow(
      new ForbiddenException('Mock payment simulation is disabled in production.'),
    );
    expect(paymentsServiceMock.simulate).not.toHaveBeenCalled();
  });

  // Truth Table Combination 2: production + MOCK_PAYMENTS=false => FORBIDDEN
  it('2. should reject simulation in production when MOCK_PAYMENTS is false', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MOCK_PAYMENTS = 'false';

    expect(() =>
      controller.simulate({ orderId: 'order-001', success: true }, dummyReq),
    ).toThrow(
      new ForbiddenException('Mock payment simulation is disabled in production.'),
    );
    expect(paymentsServiceMock.simulate).not.toHaveBeenCalled();
  });

  // Truth Table Combination 3: development + MOCK_PAYMENTS=true => ALLOWED
  it('3. should allow simulation in development when MOCK_PAYMENTS=true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MOCK_PAYMENTS = 'true';

    const result = await controller.simulate(
      { orderId: 'order-001', success: true },
      dummyReq,
    );

    expect(paymentsServiceMock.simulate).toHaveBeenCalledWith(
      'order-001',
      true,
      dummyReq.user,
    );
    expect(result.success).toBe(true);
  });

  // Truth Table Combination 4: development + MOCK_PAYMENTS=false => FORBIDDEN
  it('4. should reject simulation in development when MOCK_PAYMENTS is false', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MOCK_PAYMENTS = 'false';

    expect(() =>
      controller.simulate({ orderId: 'order-001', success: true }, dummyReq),
    ).toThrow(
      new ForbiddenException(
        'Mock payment simulation is disabled. Set MOCK_PAYMENTS=true to enable.',
      ),
    );
    expect(paymentsServiceMock.simulate).not.toHaveBeenCalled();
  });

  // Truth Table Combination 5: test + MOCK_PAYMENTS=true => ALLOWED
  it('5. should allow simulation in test when MOCK_PAYMENTS=true', async () => {
    process.env.NODE_ENV = 'test';
    process.env.MOCK_PAYMENTS = 'true';

    const result = await controller.simulate(
      { orderId: 'order-001', success: false },
      dummyReq,
    );

    expect(paymentsServiceMock.simulate).toHaveBeenCalledWith(
      'order-001',
      false,
      dummyReq.user,
    );
    expect(result.success).toBe(true);
  });

  // Truth Table Combination 6: test + MOCK_PAYMENTS=false => FORBIDDEN
  it('6. should reject simulation in test when MOCK_PAYMENTS is false', async () => {
    process.env.NODE_ENV = 'test';
    process.env.MOCK_PAYMENTS = 'false';

    expect(() =>
      controller.simulate({ orderId: 'order-001', success: true }, dummyReq),
    ).toThrow(
      new ForbiddenException(
        'Mock payment simulation is disabled. Set MOCK_PAYMENTS=true to enable.',
      ),
    );
    expect(paymentsServiceMock.simulate).not.toHaveBeenCalled();
  });
});
