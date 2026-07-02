const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  createNotification, 
  markAllRead, 
  clearNotifications 
} = require('../controllers/notificationController');

const { verifyToken } = require('../middleware/authMiddleware'); 

router.get('/', verifyToken, getNotifications);
router.post('/', verifyToken, createNotification);
router.put('/mark-all-read', verifyToken, markAllRead);
router.delete('/', verifyToken, clearNotifications);  

module.exports = router;