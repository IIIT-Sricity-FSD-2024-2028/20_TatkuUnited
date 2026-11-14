/** JSON values used in Redux: MongoDB IDs and dates are strings. */
export type ObjectId = string;
export type ISODateString = string;
export type Reference<T> = ObjectId | T;

export interface BaseDocument {
  _id: ObjectId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  __v?: number;
}
