const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authorization header.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freelance_marketplace_super_secret_jwt_token_key_2026!');

    // Check if user still exists and is active in database
    const result = await query(
      'SELECT UserId, FullName, Email, Role, IsActive FROM dbo.Users WHERE UserId = @userId',
      { userId: decoded.userId }
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Session is invalid.'
      });
    }

    const user = result.recordset[0];

    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact platform administrator.'
      });
    }

    req.user = {
      userId: user.UserId,
      fullName: user.FullName,
      email: user.Email,
      role: user.Role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
}

// Optional auth helper: populates req.user if token is present, but doesn't block if missing
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freelance_marketplace_super_secret_jwt_token_key_2026!');
      const result = await query(
        'SELECT UserId, FullName, Email, Role, IsActive FROM dbo.Users WHERE UserId = @userId',
        { userId: decoded.userId }
      );
      if (result.recordset.length > 0 && result.recordset[0].IsActive) {
        const user = result.recordset[0];
        req.user = {
          userId: user.UserId,
          fullName: user.FullName,
          email: user.Email,
          role: user.Role
        };
      }
    }
  } catch (err) {
    // ignore token errors for optional auth
  }
  next();
}

module.exports = {
  verifyToken,
  optionalAuth
};

