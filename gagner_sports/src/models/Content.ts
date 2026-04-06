import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  id?: string;
  type: 'image' | 'logo' | 'sponsor' | 'content' | 'gallery' | 'service' | 'contact';
  title: string;
  imageUrl?: string;
  description?: string;
  link?: string;
  buttonName?: string;
  metadata?: any;
  order: number;
  active: boolean;
}

const contentSchema = new Schema<IContent>({
  type: {
    type: String,
    enum: ['image', 'logo', 'sponsor', 'content', 'gallery', 'service', 'contact'],
    required: true,
    index: true
  },
  title: String,
  imageUrl: String,
  description: String,
  link: String,
  buttonName: String,
  metadata: Schema.Types.Mixed,
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
});

export default mongoose.model<IContent>('Content', contentSchema, 'contents');
