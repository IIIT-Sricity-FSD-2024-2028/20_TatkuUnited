import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// -- Indexes ----------------------------------------------------------------
CategorySchema.index({ name: 1 }, { unique: true });
