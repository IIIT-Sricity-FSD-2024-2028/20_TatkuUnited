import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from './category.schema';
import {
  HowItWorksStep,
  HowItWorksStepSchema,
  Faq,
  FaqSchema,
} from './common/service-embeds.schema';

export type ServiceDocument = HydratedDocument<Service>;

@Schema()
export class Service {
  @Prop({ required: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
    index: true,
  })
  category!: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  reviewCount!: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating!: number;

  // Diagram has this as a string array (e.g. paragraphs/bullets)
  @Prop({ type: [String], default: [] })
  description!: string[];

  @Prop({ required: true, min: 0 })
  price!: number;

  // duration in minutes
  @Prop({ required: true, min: 0 })
  duration!: number;

  @Prop({ type: [HowItWorksStepSchema], default: [] })
  howItWorks!: HowItWorksStep[];

  @Prop({ type: [String], default: [] })
  whatIsCovered!: string[];

  @Prop({ type: [String], default: [] })
  whatIsNotCovered!: string[];

  @Prop({ type: [FaqSchema], default: [] })
  faq!: Faq[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
