import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory {
  name: string;
  price: string;
  details: string[];
  prizes?: Map<string, string>;
}

export interface IEvent extends Document {
  slug: string;
  title: string;
  tag: string;
  date: string;
  time: string;
  venue: string;
  bgImg: string;
  desc: string;
  categories: ICategory[];
  deliverables: string[];
  registrationOpen: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  rules?: string;
  prizes_desc?: string;
  contact_email?: string;
  contact_phone?: string;
  archived: boolean;
  isDraft: boolean;
  status: 'Open' | 'Closed' | 'Sold Out' | 'Coming Soon';
  registeredCount: number;
  latLng?: { lat: number; lng: number };
  completedDate?: string;
  capacity?: number;
  createdAt: string;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    details: [String],
    prizes: { type: Map, of: String }
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>({
  slug: { type: String, unique: true, required: true, index: true },
  title: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length >= 4 && !/test|mock|dummy|^123$|^abc$/i.test(v),
      message: 'Event title is too short or contains test keywords.'
    }
  },
  tag: String,
  date: String,
  time: String,
  venue: String,
  bgImg: String,
  desc: String,
  categories: [categorySchema],
  deliverables: [String],
  registrationOpen: { type: Boolean, default: true },
  registrationStart: String,
  registrationEnd: String,
  rules: String,
  prizes_desc: String,
  contact_email: String,
  contact_phone: String,
  archived: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Sold Out', 'Coming Soon'],
    default: 'Open'
  },
  registeredCount: { type: Number, default: 0 },
  latLng: {
    lat: Number,
    lng: Number
  },
  completedDate: String,
  capacity: Number,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

// Optimization: Indexing common search fields
eventSchema.index({ archived: 1, isDraft: 1, status: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
