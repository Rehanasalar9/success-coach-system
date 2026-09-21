import mongoose, { Schema, Document } from 'mongoose';

export type AcademicStatus = 'Excellent' | 'Good' | 'Average' | 'Needs Attention';

export interface IStudent extends Document {
  user: mongoose.Types.ObjectId;
  collegeStudentId: string;
  class?: mongoose.Types.ObjectId;
  primaryCoach?: mongoose.Types.ObjectId;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  academicStatus: AcademicStatus;
  attendancePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeStudentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    class: { type: Schema.Types.ObjectId, ref: 'Class' },
    primaryCoach: { type: Schema.Types.ObjectId, ref: 'User' },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    parentEmail: { type: String, trim: true, lowercase: true },
    academicStatus: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Needs Attention'],
      default: 'Good',
    },
    attendancePercentage: { type: Number, default: 90, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', StudentSchema);
