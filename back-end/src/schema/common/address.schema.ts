import { Prop, Schema } from '@nestjs/mongoose';
import { GeoPointSchema } from './geo-point.schema';

/** Inline type used on @Prop fields to avoid TS1272 with isolatedModules. */
type GeoPointType = { type: string; coordinates: [number, number] };

/**
 * UserAddress � a saved address entry inside User.addresses[].
 * Has a self-generated `id` (used as a reference inside User.cart.address)
 * and a human-readable `label` (e.g. "Home", "Office").
 */
@Schema({ _id: false })
export class UserAddress {
  @Prop({ type: String, required: true })
  id: string; // self-generated ObjectId string

  @Prop({ type: String, required: true })
  label: string; // e.g. "Home", "Office"

  @Prop({ type: String, required: true })
  line: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: GeoPointSchema, required: true })
  location: GeoPointType;
}

/**
 * AddressSnapshot � an immutable address copied onto Order at checkout.
 * Does NOT have `id` or `label`; must never be updated after creation.
 */
@Schema({ _id: false })
export class AddressSnapshot {
  @Prop({ type: String, required: true })
  line: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: GeoPointSchema, required: true })
  location: GeoPointType;
}
