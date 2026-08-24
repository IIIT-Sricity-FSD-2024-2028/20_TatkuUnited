import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema()
export class Category {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating!: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
