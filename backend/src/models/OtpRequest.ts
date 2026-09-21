import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpRequest extends Document {
  student: mongoose.Types.ObjectId;
  assignedCoach: mongoose.Types.ObjectId;
  backupCoach: mongoose.Types.ObjectId;
  otpHash: string;
  plainOtp?: string;
  expiresAt: Date;
  isUsed: boolean;
  verifiedAt?: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OtpRequestSchema: Schema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedCoach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    backupCoach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    otpHash: { type: String, required: true },
    plainOtp: { type: String }, // Provided only temporarily to assigned coach UI upon creation
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    reason: { type: String, trim: true, default: 'Parent Visit' },
  },
  { timestamps: true }
);

export default mongoose.model<IOtpRequest>('OtpRequest', OtpRequestSchema);
