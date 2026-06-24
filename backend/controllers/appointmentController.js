const { getPool, sql } = require('../config/db');
const crypto = require('crypto');

// 1. GET ALL OR USER-SPECIFIC APPOINTMENTS
exports.getAppointments = async (req, res) => {
  try {
    const rawUserId = req.user?.id || req.user?.userId;
    const userId = parseInt(rawUserId, 10);
    const userRole = req.user?.role ? String(req.user.role).trim().toLowerCase() : ''; 
    
    const pool = getPool();
    if (!pool) return res.status(500).json({ message: 'Database pool not initialized.' });

    let result;
    if (userRole === 'admin') {
      result = await pool.request().query('SELECT * FROM Appointments ORDER BY date ASC');
    } else {
      result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM Appointments WHERE userId = @userId ORDER BY date ASC');
    }

    const records = result.recordset.map(row => ({
      ...row,
      attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : (row.attachments || [])
    }));

    return res.status(200).json(records);
  } catch (error) {
    console.error('SQL Fetch Failure:', error);
    return res.status(500).json({ message: 'Database error.', error: error.message });
  }
};

// 2. GET SINGLE APPOINTMENT BY ID
exports.getAppointmentById = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.VarChar, req.params.id)
      .query('SELECT * FROM Appointments WHERE id = @id');
    
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. CREATE NEW APPOINTMENT (Fixed with System User ID)
exports.createAppointment = async (req, res) => {
  console.log('--- DEBUG: Received Request Body ---');
  console.log(JSON.stringify(req.body, null, 2)); // This will print your full object
  try {
    const userId = parseInt(req.user?.id || req.user?.userId, 10);
    const { title, service, submissionDate, date, details, attachments } = req.body;

    if (!service) return res.status(400).json({ message: 'Service is required.' });

    const pool = getPool();
    const appointmentId = crypto.randomBytes(6).toString('hex');

    // 1. Fetch an admin ID dynamically so we don't have to hardcode it
    const adminResult = await pool.request()
      .query('SELECT TOP 1 id FROM Users WHERE role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(500).json({ message: 'No administrator account found to receive notifications.' });
    }

    const adminId = adminResult.recordset[0].id;

    // 2. Insert Appointment
    await pool.request()
      .input('id', sql.VarChar, appointmentId)
      .input('userId', sql.Int, userId)
      .input('title', sql.VarChar, title || 'Untitled')
      .input('service', sql.VarChar, service)
      .input('submissionDate', sql.VarChar, submissionDate)
      .input('date', sql.VarChar, date)
      .input('details', sql.VarChar, details || '')
      .input('attachments', sql.VarChar, JSON.stringify(attachments || []))
      .input('status', sql.VarChar, 'Pending')
      .query(`
        INSERT INTO Appointments (id, userId, title, service, submissionDate, date, details, attachments, status)
        VALUES (@id, @userId, @title, @service, @submissionDate, @date, @details, @attachments, @status)
      `);

    // 3. Insert Notification using the dynamic adminId
    await pool.request()
      .input('adminId', sql.Int, adminId)
      .input('msg', sql.VarChar, `New request: ${title}`)
      .input('isRead', sql.Bit, 0)
      .query('INSERT INTO Notifications (userId, message, isRead, createdAt) VALUES (@adminId, @msg, @isRead, GETDATE())');

    return res.status(201).json({ id: appointmentId, status: 'Pending' });
  } catch (error) {
    console.error('SQL Save Failure:', error);
    return res.status(500).json({ message: 'Database error.', error: error.message });
  }
};

// 4. UPDATE APPOINTMENT STATUS
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pool = getPool();

    // 1. Get User ID for notification
    const appt = await pool.request()
      .input('id', sql.VarChar, id)
      .query('SELECT userId FROM Appointments WHERE id = @id');

    const targetUserId = appt.recordset[0]?.userId;
    
    // 2. Update Status
    await pool.request()
      .input('id', sql.VarChar, id)
      .input('status', sql.VarChar, status)
      .query('UPDATE Appointments SET status = @status WHERE id = @id');

    // 3. Insert Notification for the User (This is correct)
    if (targetUserId) {
      await pool.request()
        .input('userId', sql.Int, targetUserId)
        .input('msg', sql.NVarChar, `Your appointment ${id} status changed to: ${status}`)
        .input('isRead', sql.Bit, 0)
        .query('INSERT INTO Notifications (userId, message, isRead, createdAt) VALUES (@userId, @msg, @isRead, GETDATE())');
    }

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('SQL Update Failure:', error);
    res.status(500).json({ message: 'Database update failed', error: error.message });
  }
};

// 5. DELETE APPOINTMENT
exports.deleteAppointment = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.VarChar, req.params.id)
      .query('DELETE FROM Appointments WHERE id = @id');
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};