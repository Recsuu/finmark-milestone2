const express = require('express');
const router = express.Router();
const { 
    getAppointments, 
    createAppointment, 
    updateAppointmentStatus, 
    deleteAppointment,       
    getAppointmentById  
} = require('../controllers/appointmentController');

const { verifyToken } = require('../middleware/authMiddleware'); 

// Fetch all or user-specific records
router.get('/', verifyToken, getAppointments);

// Fetch a single record by ID
router.get('/:id', verifyToken, getAppointmentById);

// Create a new record
router.post('/', verifyToken, createAppointment);

// Update status (This fixes your 404 error)
router.put('/:id', verifyToken, updateAppointmentStatus);

// Delete a record
router.delete('/:id', verifyToken, deleteAppointment);

module.exports = router;