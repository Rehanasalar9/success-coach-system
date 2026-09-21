import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

const logStep = (stepName: string, passed: boolean, details: string) => {
  results.push({ step: stepName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${stepName}]: ${details}`);
};

export const runFullE2ETest = async () => {
  console.log('\n===============================================================');
  console.log('🚀 EXHAUSTIVE REAL-WORLD END-TO-END FUNCTIONAL & SECURITY SUITE');
  console.log('===============================================================\n');

  try {
    // STEP 1: Invalid Login Test
    console.log('--- TEST 1: Authentication & Invalid Logins ---');
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'invalid@college.edu', password: 'wrongpassword' }),
    });
    const invalidLoginData = await invalidLoginRes.json();
    logStep(
      'Invalid Login Security',
      invalidLoginRes.status === 401 && !invalidLoginData.success,
      'Invalid credentials properly rejected with 401 Unauthorized.'
    );

    // STEP 2: Login as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'admin@college.edu', password: 'admin123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    logStep('Admin Login', adminLoginRes.ok, `Admin authenticated successfully (Role: ${adminData.user.role})`);

    // STEP 3: Login as Coach Smith (Primary Coach)
    console.log('\n--- TEST 2: Coach Smith Login & Primary Interaction ---');
    const smithLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'coach.smith@college.edu', password: 'coach123' }),
    });
    const smithData = await smithLoginRes.json();
    const smithToken = smithData.token;
    logStep('Coach Smith Login', smithLoginRes.ok, `Token issued for Coach Smith (${smithData.user.collegeId})`);

    // STEP 4: Coach Smith searches for student Alex Rivera (STU-2026-001)
    const smithSearchRes = await fetch(`${BASE_URL}/coach/search-student?query=STU-2026-001`, {
      headers: { Authorization: `Bearer ${smithToken}` },
    });
    const smithSearchData = await smithSearchRes.json();
    const alexStudent = smithSearchData.students[0];
    logStep(
      'Primary Coach Search',
      smithSearchData.success && alexStudent.isPrimaryCoach === true,
      `Coach Smith recognized as Primary Coach for ${alexStudent.collegeStudentId} (requiresOtp: ${alexStudent.requiresOtp})`
    );

    // STEP 5: Coach Smith records interaction session for Alex Rivera
    const newInteractionPayload = {
      studentId: alexStudent._id,
      interactionType: 'Academic',
      academicProgress: 'Midterm Grade: 98/100. Excellent problem-solving skills.',
      behaviourNotes: 'Punctual, attentive, leads lab project discussions.',
      attendanceNotes: '96% lecture attendance record.',
      topicsDiscussed: 'Undergraduate Research Fellowship & Advanced Data Structures.',
      coachRemarks: 'Recommend Alex for departmental honors program.',
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createInteractionRes = await fetch(`${BASE_URL}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${smithToken}`,
      },
      body: JSON.stringify(newInteractionPayload),
    });
    const createInteractionData = await createInteractionRes.json();
    logStep(
      'Create Session Interaction',
      createInteractionRes.ok && createInteractionData.success,
      `Session interaction saved. Interaction ID: ${createInteractionData.interaction._id}`
    );

    // STEP 6: Confirm Persistence & Retrieval via HTTP Profile Endpoint
    const profileRes = await fetch(`${BASE_URL}/coach/student-profile/${alexStudent._id}`, {
      headers: { Authorization: `Bearer ${smithToken}` },
    });
    const profileData = await profileRes.json();
    const savedInteraction = profileData.interactions.find(
      (i: any) => i._id === createInteractionData.interaction._id
    );
    logStep(
      'Database Persistence Check',
      !!savedInteraction && savedInteraction.academicProgress.includes('Midterm Grade: 98/100'),
      'Confirmed MongoDB document persisted and fetched from interaction history timeline.'
    );

    // STEP 7: Backup Coach (Coach Davis) Scenario
    console.log('\n--- TEST 3: Backup Coach (Coach Davis) & Parent Visit OTP Workflow ---');
    const davisLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'coach.davis@college.edu', password: 'coach123' }),
    });
    const davisData = await davisLoginRes.json();
    const davisToken = davisData.token;
    logStep('Coach Davis Login', davisLoginRes.ok, `Token issued for Backup Coach Davis (${davisData.user.collegeId})`);

    // STEP 8: Coach Davis searches for student Alex Rivera (STU-2026-001)
    const davisSearchRes = await fetch(`${BASE_URL}/coach/search-student?query=STU-2026-001`, {
      headers: { Authorization: `Bearer ${davisToken}` },
    });
    const davisSearchData = await davisSearchRes.json();
    const davisSearchResult = davisSearchData.students[0];
    logStep(
      'Backup Coach Search',
      davisSearchResult.isPrimaryCoach === false && davisSearchResult.requiresOtp === true,
      `Coach Davis identified as Non-Primary Backup Coach. OTP Required: ${davisSearchResult.requiresOtp}`
    );

    // STEP 9: Direct Unauthorized Access Attempt by Coach Davis (No OTP)
    const unauthProfileRes = await fetch(`${BASE_URL}/coach/student-profile/${alexStudent._id}`, {
      headers: { Authorization: `Bearer ${davisToken}` },
    });
    const unauthProfileData = await unauthProfileRes.json();
    logStep(
      'Unauthorized Direct Access Block',
      unauthProfileRes.status === 403 && unauthProfileData.requiresOtp === true,
      `Direct profile access rejected with 403 Forbidden. Message: "${unauthProfileData.message}"`
    );

    // STEP 10: Request Parent Visit OTP
    const requestOtpRes = await fetch(`${BASE_URL}/otp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${davisToken}`,
      },
      body: JSON.stringify({ studentId: alexStudent._id, reason: 'Parent Visit - Coach Smith on Leave' }),
    });
    const requestOtpData = await requestOtpRes.json();
    const generatedOtp = requestOtpData.plainOtp;
    logStep(
      'OTP Generation',
      requestOtpRes.ok && !!generatedOtp,
      `Single-use 6-digit OTP generated: ${generatedOtp} (Expires in 10m)`
    );

    // STEP 11: Invalid OTP Code Verification Test
    const invalidOtpRes = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${davisToken}`,
      },
      body: JSON.stringify({ studentId: alexStudent._id, otpCode: '999999' }),
    });
    const invalidOtpData = await invalidOtpRes.json();
    logStep(
      'Invalid OTP Rejection',
      invalidOtpRes.status === 401,
      `Incorrect OTP code rejected with 401. Message: "${invalidOtpData.message}"`
    );

    // STEP 12: Valid OTP Verification Test
    const validOtpRes = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${davisToken}`,
      },
      body: JSON.stringify({ studentId: alexStudent._id, otpCode: generatedOtp }),
    });
    const validOtpData = await validOtpRes.json();
    const tempToken = validOtpData.tempToken;
    logStep(
      'Valid OTP Verification',
      validOtpRes.ok && !!tempToken,
      `OTP verified! Granted 30-minute temp read-only access token for student ${validOtpData.collegeStudentId}`
    );

    // STEP 13: Single-Use OTP Enforcement Test (Attempting Re-use)
    const reuseOtpRes = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${davisToken}`,
      },
      body: JSON.stringify({ studentId: alexStudent._id, otpCode: generatedOtp }),
    });
    const reuseOtpData = await reuseOtpRes.json();
    logStep(
      'OTP Single-Use Invalidation',
      reuseOtpRes.status === 400 && reuseOtpData.message.includes('already been used'),
      `Attempted OTP re-use rejected with 400. Message: "${reuseOtpData.message}"`
    );

    // STEP 14: Temporary Read-Only Profile View Test
    const tempProfileRes = await fetch(`${BASE_URL}/coach/student-profile/${alexStudent._id}`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    const tempProfileData = await tempProfileRes.json();
    const accessInfo = tempProfileData.accessInfo;
    logStep(
      'Temp Read-Only Profile View',
      tempProfileRes.ok && accessInfo.hasTempAccess && accessInfo.isReadOnly,
      `Profile loaded under temp access. Read-Only Flag: ${accessInfo.isReadOnly}, Can Edit: ${accessInfo.canEdit}`
    );

    // STEP 15: Server-Side Security Enforcement: Attempting Modification under Temp Access
    const blockedEditRes = await fetch(`${BASE_URL}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({
        studentId: alexStudent._id,
        interactionType: 'Academic',
        academicProgress: 'Malicious modification attempt under temp token',
        behaviourNotes: 'Notes',
        attendanceNotes: 'Notes',
        topicsDiscussed: 'Topics',
        coachRemarks: 'Remarks',
      }),
    });
    const blockedEditData = await blockedEditRes.json();
    logStep(
      'Server-Side Read-Only Security Guard',
      blockedEditRes.status === 403,
      `Modification blocked on backend with 403 Forbidden: "${blockedEditData.message}"`
    );

    // STEP 16: Check Audit Logs Persistence via Admin API
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    const otpVerifyAudit = auditData.logs.find((l: any) => l.action === 'OTP_VERIFY_SUCCESS');
    logStep(
      'Audit Trail Persistence',
      !!otpVerifyAudit && otpVerifyAudit.status === 'SUCCESS',
      `Found OTP_VERIFY_SUCCESS entry in database audit logs: "${otpVerifyAudit?.details}"`
    );

    // STEP 17: Invalid Student ID Search Test
    const invalidStudentRes = await fetch(`${BASE_URL}/coach/student-profile/666666666666666666666666`, {
      headers: { Authorization: `Bearer ${smithToken}` },
    });
    logStep(
      'Invalid Student ID Handling',
      invalidStudentRes.status === 404,
      'Non-existent student ID returns proper 404 Not Found error.'
    );

    console.log('\n===============================================================');
    console.log(`TOTAL TESTS EXECUTED: ${results.length}`);
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`PASSED: ${passedCount} / ${results.length}`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Error during E2E test execution:', err);
  }
};

if (require.main === module) {
  runFullE2ETest();
}
