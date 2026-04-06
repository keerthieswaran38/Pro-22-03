import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  id?: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountPercent?: number;
  maxUses?: number;
  usedCount: number;
  expiryDate?: string;
  active: boolean;
  eventId?: string;
  createdAt: string;
}

const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, index: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  discountPercent: Number,
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  expiryDate: String,
  active: { type: Boolean, default: true },
  eventId: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export default mongoose.model<ICoupon>('Coupon', couponSchema);
