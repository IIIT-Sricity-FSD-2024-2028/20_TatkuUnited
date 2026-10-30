import { model, Types } from 'mongoose';
import { BookingSchema } from './booking.schema';
import { PlatformSettingSchema } from './platform-setting.schema';
import { NotificationSchema } from './notification.schema';
import { ProviderSchema } from './provider.schema';

describe('Section 0: booking workflow schemas', () => {
  const Booking = model('WorkflowSchemaBooking', BookingSchema);
  const Settings = model('WorkflowSchemaSettings', PlatformSettingSchema);
  const booking = () =>
    new Booking({
      service: new Types.ObjectId(),
      customer: new Types.ObjectId(),
      order: new Types.ObjectId(),
      region: new Types.ObjectId(),
      scheduledDate: new Date(),
      startTime: 600,
      endTime: 660,
      blockStartTime: 570,
      price: 10000,
      platformFeePercent: 20,
      platformShare: 2000,
      providerShare: 8000,
    });

  it('allows checkout before assignment and preserves workflow defaults', () => {
    const doc = booking();
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.provider).toBeNull();
    expect(doc.status).toBe('awaiting_provider');
    expect(doc.offers).toHaveLength(0);
    expect(doc.offerRound).toBe(0);
    expect(doc.completedAt).toBeNull();
    expect(doc.completionRejectedAt).toBeNull();
  });

  it('validates offers and permits an explicit disputed state', () => {
    const doc = booking();
    doc.status = 'disputed';
    expect(doc.validateSync()).toBeUndefined();
    doc.set('offers', [{ provider: new Types.ObjectId(), status: 'invalid' }]);
    expect(doc.validateSync()?.errors['offers.0.status']).toBeDefined();
    expect(doc.validateSync()?.errors['offers.0.expiresAt']).toBeDefined();
  });

  it('supplies matching defaults', () => {
    const doc = new Settings({
      platformFeePercent: 20,
      maxAssignmentDistanceKm: 15,
    });
    expect(doc.validateSync()).toBeUndefined();
    expect([
      doc.offerTimeoutMinutes,
      doc.maxOfferRounds,
      doc.offerBatchSize,
      doc.payoutHoldHours,
    ]).toEqual([5, 3, 5, 0]);
    expect(doc.matchWeights.toObject()).toEqual({
      distance: 0.4,
      rating: 0.4,
      availability: 0.2,
    });
  });

  it('declares inbox, assignment and spherical location indexes', () => {
    expect(BookingSchema.indexes().map(([keys]) => keys)).toEqual(
      expect.arrayContaining([
        { status: 1, 'offers.provider': 1 },
        { provider: 1, scheduledDate: 1, status: 1 },
      ]),
    );
    expect(NotificationSchema.indexes()[0][0]).toEqual({
      user: 1,
      readAt: 1,
      createdAt: -1,
    });
    expect(ProviderSchema.indexes().map(([keys]) => keys)).toContainEqual({
      location: '2dsphere',
    });
  });
});
