import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'coach' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  collegeId: string;
  phone?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'coach', 'student'], required: true, default: 'student' },
    collegeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true, default: 'Computer Science' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
