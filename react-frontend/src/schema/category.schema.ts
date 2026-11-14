/** Serialized counterpart of back-end/src/schema/category.schema.ts. */
import type { BaseDocument } from './index';

export interface Category extends BaseDocument {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export type CategoryDocument = Category;
