const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Protected route (example - requires valid JWT)
router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: 'Token valid. User authenticated.',
    user: req.user,
  });
});

module.exports = router;
