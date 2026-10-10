import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// -- Embedded sub-schemas -----------------------------------------------------
@Schema({ _id: false })
export class HowItWorksStep {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  desc: string;
}

@Schema({ _id: false })
export class FaqItem {
  @Prop({ type: String, required: true })
  question: string;

  @Prop({ type: String, required: true })
  answer: string;
}

// -- Service document ---------------------------------------------------------
export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  reviewCount: number;

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true }) // integer paise
  price: number;

  @Prop({ type: Number, required: true }) // minutes
  duration: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({ type: [String], default: [] })
  whatIsCovered: string[];

  @Prop({ type: [String], default: [] })
  whatIsNotCovered: string[];

  @Prop({ type: [HowItWorksStep], default: [] })
  howItWorks: HowItWorksStep[];

  @Prop({ type: [FaqItem], default: [] })
  faq: FaqItem[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// -- Indexes ----------------------------------------------------------------
ServiceSchema.index({ category: 1, isActive: 1 });
