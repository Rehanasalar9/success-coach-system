import mongoose, { Schema, Document } from 'mongoose';

export type InteractionType = 'Academic' | 'Behavioural' | 'Attendance' | 'Career' | 'Personal' | 'Parent Meeting' | 'General';

export interface IInteraction extends Document {
  student: mongoose.Types.ObjectId;
  coach: mongoose.Types.ObjectId;
  dateTime: Date;
  interactionType: InteractionType;
  academicProgress: string;
  behaviourNotes: string;
  attendanceNotes: string;
  topicsDiscussed: string;
  coachRemarks: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema: Schema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateTime: { type: Date, default: Date.now, required: true },
    interactionType: {
      type: String,
      enum: ['Academic', 'Behavioural', 'Attendance', 'Career', 'Personal', 'Parent Meeting', 'General'],
      default: 'General',
      required: true,
    },
    academicProgress: { type: String, required: true, trim: true },
    behaviourNotes: { type: String, required: true, trim: true },
    attendanceNotes: { type: String, required: true, trim: true },
    topicsDiscussed: { type: String, required: true, trim: true },
    coachRemarks: { type: String, required: true, trim: true },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IInteraction>('Interaction', InteractionSchema);
