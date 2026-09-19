const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.UserId,
      email: user.Email,
      role: user.Role,
      fullName: user.FullName
    },
    process.env.JWT_SECRET || 'freelance_marketplace_super_secret_jwt_token_key_2026!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, password, role) are required.'
      });
    }

    const trimmedRole = role.trim();
    if (!['Client', 'Freelancer'].includes(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Registration is only open for "Client" or "Freelancer".'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existing = await query(
      'SELECT UserId FROM dbo.Users WHERE LOWER(Email) = @email',
      { email: trimmedEmail }
    );

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertResult = await query(
      `INSERT INTO dbo.Users (FullName, Email, PasswordHash, Role)
       OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role, INSERTED.CreatedAt, INSERTED.IsActive
       VALUES (@fullName, @email, @passwordHash, @role)`,
      {
        fullName: fullName.trim(),
        email: trimmedEmail,
        passwordHash,
        role: trimmedRole
      }
    );

    const newUser = insertResult.recordset[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        userId: newUser.UserId,
        fullName: newUser.FullName,
        email: newUser.Email,
        role: newUser.Role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again later.'
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email
    const result = await query(
      'SELECT UserId, FullName, Email, PasswordHash, Role, IsActive FROM dbo.Users WHERE LOWER(Email) = @email',
      { email: trimmedEmail }
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = result.recordset[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check active status
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated by an administrator.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again later.'
    });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const result = await query(
      'SELECT UserId, FullName, Email, Role, CreatedAt, IsActive FROM dbo.Users WHERE UserId = @userId',
      { userId: req.user.userId }
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const user = result.recordset[0];

    return res.status(200).json({
      success: true,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        createdAt: user.CreatedAt,
        isActive: user.IsActive
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve profile information.'
    });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

module.exports = {
  register,
  login,
  getMe,
  logout
};

