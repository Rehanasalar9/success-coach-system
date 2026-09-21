import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Student from '../models/Student';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, collegeId, phone, department } = req.body;

    if (!name || !email || !password || !collegeId) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and collegeId'
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { collegeId: collegeId.toUpperCase().trim() }
      ]
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email or collegeId already exists'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'student',
      collegeId: collegeId.toUpperCase().trim(),
      phone: phone?.trim(),
      department: department?.trim()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        phone: user.phone,
        department: user.department
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      res.status(400).json({ success: false, message: 'Please provide email or College ID and password' });
      return;
    }

    // Search user by email or collegeId
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase().trim() },
        { collegeId: loginIdentifier.toUpperCase().trim() },
      ],
    });

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for identifier '${loginIdentifier}' - User not found`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for '${user.email}' - Invalid password`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_success_coach_jwt_key_2026_safe';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    // Fetch linked student doc if role is student
    let studentId: string | undefined;
    if (user.role === 'student') {
      const studentDoc = await Student.findOne({ user: user._id });
      if (studentDoc) studentId = studentDoc._id.toString();
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
        collegeId: user.collegeId,
        studentId,
      },
      secret as jwt.Secret,
      { expiresIn: '24h' }
    );

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      details: `User '${user.name}' (${user.role.toUpperCase()}) logged in successfully`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        department: user.department,
        studentId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ user: user._id })
        .populate('class')
        .populate('primaryCoach', 'name email collegeId phone department');
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        department: user.department,
        phone: user.phone,
        studentProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching user profile', error: error.message });
  }
};
