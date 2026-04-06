import mongoose, { Document, Schema } from 'mongoose';

export interface IAudit extends Document {
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
}

const auditSchema = new Schema<IAudit>({
  timestamp: { type: String, default: () => new Date().toISOString() },
  user: { type: String, default: 'admin' },
  action: { type: String, required: true },
  target: { type: String },
  details: { type: String }
});

export default mongoose.model<IAudit>('Audit', auditSchema);
