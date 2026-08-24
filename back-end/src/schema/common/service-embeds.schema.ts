import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class HowItWorksStep {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  desc!: string;
}

export const HowItWorksStepSchema =
  SchemaFactory.createForClass(HowItWorksStep);

@Schema({ _id: false })
export class Faq {
  @Prop({ required: true })
  question!: string;

  @Prop({ required: true })
  answer!: string;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
