import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: mongoose.Types.ObjectId;
  actorRole?: string;
  action: string;
  targetStudent?: mongoose.Types.ObjectId;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true },
    targetStudent: { type: Schema.Types.ObjectId, ref: 'Student' },
    details: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'UNAUTHORIZED'], default: 'SUCCESS' },
    ipAddress: { type: String, default: '127.0.0.1' },
  },
  { timestamps: true }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
