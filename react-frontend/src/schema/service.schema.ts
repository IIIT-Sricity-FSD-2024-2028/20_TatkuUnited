/** Serialized counterpart of back-end/src/schema/service.schema.ts. */
import type { Category, BaseDocument, Reference } from './index';

export interface HowItWorksStep {
  title: string;
  desc: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Service extends BaseDocument {
  name: string;
  category: Reference<Category>;
  reviewCount: number;
  rating: number;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  imageUrls: string[];
  whatIsCovered: string[];
  whatIsNotCovered: string[];
  howItWorks: HowItWorksStep[];
  faq: FaqItem[];
}

export type ServiceDocument = Service;
