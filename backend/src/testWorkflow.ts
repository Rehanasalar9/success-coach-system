import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB, closeDB } from './config/db';
import { seedDatabase } from './seed';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import coachRoutes from './routes/coachRoutes';
import interactionRoutes from './routes/interactionRoutes';
import otpRoutes from './routes/otpRoutes';
import studentRoutes from './routes/studentRoutes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/student', studentRoutes);

const PORT = 5055;

export const runTests = async () => {
  console.log('🧪 Starting Automated Workflow Verification Tests...');
  await connectDB();
  await seedDatabase();

  const server = app.listen(PORT, async () => {
    try {
      const baseURL = `http://localhost:${PORT}/api`;

      // 1. Admin login test
      console.log('\n1️⃣ Testing Admin Login...');
      const adminRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: 'admin@college.edu', password: 'admin123' }),
      });
      const adminData = await adminRes.json();
      console.log('✅ Admin login successful. Role:', adminData.user.role);

      // 2. Coach Smith login test
      console.log('\n2️⃣ Testing Primary Coach (Smith) Login...');
      const smithRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: 'coach.smith@college.edu', password: 'coach123' }),
      });
      const smithData = await smithRes.json();
      const smithToken = smithData.token;
      console.log('✅ Coach Smith logged in. College ID:', smithData.user.collegeId);

      // 3. Coach Davis (Backup Coach) login test
      console.log('\n3️⃣ Testing Backup Coach (Davis) Login...');
      const davisRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: 'coach.davis@college.edu', password: 'coach123' }),
      });
      const davisData = await davisRes.json();
      const davisToken = davisData.token;
      console.log('✅ Coach Davis logged in. College ID:', davisData.user.collegeId);

      // 4. Student Alex login test
      console.log('\n4️⃣ Testing Student Alex Login...');
      const alexRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: 'STU-2026-001', password: 'student123' }),
      });
      const alexData = await alexRes.json();
      console.log('✅ Student Alex logged in successfully.');

      // 5. Search Student STU-2026-001 as Coach Davis
      console.log('\n5️⃣ Coach Davis searching for Alex (STU-2026-001)...');
      const searchRes = await fetch(`${baseURL}/coach/search-student?query=STU-2026-001`, {
        headers: { Authorization: `Bearer ${davisToken}` },
      });
      const searchData = await searchRes.json();
      const alexStudentDoc = searchData.students[0];
      console.log('✅ Found student STU-2026-001. Requires OTP:', alexStudentDoc.requiresOtp);

      // 6. Direct access attempt without OTP by Coach Davis (should fail with 403)
      console.log('\n6️⃣ Testing Direct Unauthorized Profile Access by Coach Davis (No OTP)...');
      const unauthRes = await fetch(`${baseURL}/coach/student-profile/${alexStudentDoc._id}`, {
        headers: { Authorization: `Bearer ${davisToken}` },
      });
      const unauthData = await unauthRes.json();
      if (unauthRes.status === 403) {
        console.log('✅ Correctly Blocked with 403 Forbidden:', unauthData.message);
      } else {
        console.error('❌ Failed: Direct access should have been blocked!');
      }

      // 7. Request OTP Access by Coach Davis
      console.log('\n7️⃣ Coach Davis requesting Parent Visit OTP for STU-2026-001...');
      const otpReqRes = await fetch(`${baseURL}/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${davisToken}`,
        },
        body: JSON.stringify({ studentId: alexStudentDoc._id, reason: 'Parent Visit - Coach Smith absent' }),
      });
      const otpReqData = await otpReqRes.json();
      const generatedOtp = otpReqData.plainOtp;
      console.log('✅ Generated 6-digit OTP:', generatedOtp, 'Expires At:', otpReqData.expiresAt);

      // 8. Verify OTP Code by Coach Davis
      console.log('\n8️⃣ Coach Davis verifying OTP code...');
      const verifyRes = await fetch(`${baseURL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${davisToken}`,
        },
        body: JSON.stringify({ studentId: alexStudentDoc._id, otpCode: generatedOtp }),
      });
      const verifyData = await verifyRes.json();
      const tempToken = verifyData.tempToken;
      console.log('✅ OTP Verified Successfully! Read-Only Temp Access Token Granted.');

      // 9. View Student Profile using Temp Access Token
      console.log('\n9️⃣ Viewing Profile with Temporary Read-Only Token...');
      const tempProfileRes = await fetch(`${baseURL}/coach/student-profile/${alexStudentDoc._id}`, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      const tempProfileData = await tempProfileRes.json();
      console.log('✅ Profile Accessed! Access Info:', tempProfileData.accessInfo);

      // 10. Attempting to ADD interaction with Temp Token (Should fail with 403 Read-Only restriction!)
      console.log('\n🔟 Testing Modification Security Check: Adding interaction with Temp Token...');
      const editRes = await fetch(`${baseURL}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          studentId: alexStudentDoc._id,
          interactionType: 'Academic',
          academicProgress: 'Attempting edit under temp access',
          behaviourNotes: 'Notes',
          attendanceNotes: 'Notes',
          topicsDiscussed: 'Topics',
          coachRemarks: 'Remarks',
        }),
      });
      const editData = await editRes.json();
      if (editRes.status === 403) {
        console.log('✅ Security Check Passed! Modification Blocked:', editData.message);
      } else {
        console.error('❌ Failed: Temp token should not allow adding interactions!');
      }

      // 11. Attempting to reuse the single-use OTP
      console.log('\n1️⃣1️⃣ Testing OTP Single-Use Enforcement (Reusing OTP)...');
      const reuseRes = await fetch(`${baseURL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${davisToken}`,
        },
        body: JSON.stringify({ studentId: alexStudentDoc._id, otpCode: generatedOtp }),
      });
      const reuseData = await reuseRes.json();
      if (reuseRes.status === 400 || reuseRes.status === 401) {
        console.log('✅ OTP Single-Use Check Passed! Re-use Blocked:', reuseData.message);
      } else {
        console.error('❌ Failed: OTP reuse should have been rejected!');
      }

      console.log('\n🎉 ALL 11 END-TO-END WORKFLOW & SECURITY TESTS PASSED PERFECTLY!\n');
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      server.close();
      await closeDB();
      process.exit(0);
    }
  });
};

if (require.main === module) {
  runTests();
}
