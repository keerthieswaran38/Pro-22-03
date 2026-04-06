import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant extends Document {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  gender?: string;
  ageGroup?: string;
  age?: string;
  tshirtSize?: string;
  eventSlug: string;
  eventName: string;
  category: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  isPaid: boolean;
  orderId: string;
  transactionId?: string;
  tracking_id?: string;
  registeredAt: string;
}

const participantSchema = new Schema<IParticipant>({
  name: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length >= 3 && !/test|mock|dummy|^123$|^abc$/i.test(v),
      message: 'Participant name is too short or contains test keywords.'
    }
  },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  city: String,
  gender: String,
  ageGroup: String,
  age: String,
  tshirtSize: String,
  eventSlug: { type: String, required: true, index: true },
  eventName: String,
  category: String,
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed'],
    default: 'Pending'
  },
  isPaid: { type: Boolean, default: false },
  orderId: { type: String, required: true, unique: true, index: true },
  transactionId: String,
  tracking_id: String,
  registeredAt: { type: String, default: () => new Date().toISOString() }
});

// Added compound index for common lookups
participantSchema.index({ eventSlug: 1, paymentStatus: 1 });

export default mongoose.model<IParticipant>('Participant', participantSchema);
