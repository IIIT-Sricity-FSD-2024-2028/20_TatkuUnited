/**
 * One-off migration script to backfill `regionId` on User.addresses[] and `region` on Provider documents
 * using RegionsService.resolveForLocation(lng, lat).
 *
 * Usage (from back-end/):
 *   npx ts-node -r tsconfig-paths/register src/scripts/backfill-regions.ts
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { RegionsService } from '../regions/regions.service';
import { User, type UserDocument } from '../schema/user.schema';
import { Provider, type ProviderDocument } from '../schema/provider.schema';
import { isValidGeoCoordinates } from '../common/utils/geo.util';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const regionsService = app.get(RegionsService);
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const providerModel = app.get<Model<ProviderDocument>>(
      getModelToken(Provider.name),
    );

    const providers = await providerModel.find().exec();
    let providersUpdated = 0;
    let providersUnassigned = 0;

    for (const provider of providers) {
      const coords = provider.location?.coordinates;
      if (!isValidGeoCoordinates(coords)) {
        providersUnassigned++;
        continue;
      }
      const resolved = await regionsService.resolveForLocation(
        coords[0],
        coords[1],
      );
      const nextRegionId = resolved ? resolved._id : null;
      if (
        (provider.region?.toString() ?? null) !==
        (nextRegionId?.toString() ?? null)
      ) {
        provider.region = nextRegionId;
        await provider.save();
        providersUpdated++;
      }
      if (!nextRegionId) {
        providersUnassigned++;
      }
    }

    const users = await userModel.find({ 'addresses.0': { $exists: true } }).exec();
    let addressesUpdated = 0;
    let addressesUnassigned = 0;

    for (const user of users) {
      let dirty = false;
      for (const addr of user.addresses || []) {
        const coords = addr.location?.coordinates;
        if (!isValidGeoCoordinates(coords)) {
          if (addr.regionId !== null) {
            addr.regionId = null;
            dirty = true;
          }
          addressesUnassigned++;
          continue;
        }
        const resolved = await regionsService.resolveForLocation(
          coords[0],
          coords[1],
        );
        const nextRegionId = resolved ? resolved._id : null;
        if (
          (addr.regionId?.toString() ?? null) !==
          (nextRegionId?.toString() ?? null)
        ) {
          addr.regionId = nextRegionId;
          dirty = true;
          addressesUpdated++;
        }
        if (!nextRegionId) {
          addressesUnassigned++;
        } else if (!user.defaultRegionId) {
          user.defaultRegionId = nextRegionId;
          dirty = true;
        }
      }
      if (dirty) {
        await user.save();
      }
    }

    console.log(
      JSON.stringify(
        {
          providersUpdated,
          providersUnassigned,
          addressesUpdated,
          addressesUnassigned,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
