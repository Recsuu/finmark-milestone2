const { getPool, sql } = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role ? String(req.user.role).trim().toLowerCase() : '';
    const pool = getPool();

    if (userRole === 'admin') {
  const result = await pool.request().query(`
    SELECT * FROM Notifications 
    WHERE userId IN (SELECT id FROM Users WHERE role = 'admin') 
    OR message LIKE '%New appointment%' 
    ORDER BY createdAt DESC
  `);
  return res.status(200).json(result.recordset);
    } else {
      const rawUserId = req.user?.id || req.user?._id || req.user?.userId;
      const result = await pool.request()
        .input('userId', sql.Int, parseInt(rawUserId, 10))
        .query('SELECT * FROM Notifications WHERE userId = @userId ORDER BY createdAt DESC');
      return res.status(200).json(result.recordset);
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error', error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { targetRole, userId, message, appointmentId } = req.body;
    const pool = getPool();

    // 1. Check for duplicates BEFORE inserting (Idempotency)
    // This prevents "tripling" if the function is called multiple times
    const checkDuplicate = await pool.request()
      .input('uId', sql.Int, userId)
      .input('aId', sql.VarChar, appointmentId || null)
      .input('msg', sql.NVarChar, message)
      .query(`SELECT id FROM Notifications 
              WHERE userId = @uId AND appointmentId = @aId AND message = @msg`);

    if (checkDuplicate.recordset.length > 0) {
      return res.status(200).json({ message: 'Notification already exists' });
    }

    // 2. PATH A: Notify Admins
    if (targetRole === 'admin') {
      const admins = await pool.request().query("SELECT id FROM Users WHERE role = 'admin'");
      
      for (const admin of admins.recordset) {
        // Only notify if they aren't the user who triggered the action
        if (admin.id !== parseInt(userId)) {
          await pool.request()
            .input('uId', sql.Int, admin.id)
            .input('msg', sql.NVarChar, message)
            .input('aId', sql.VarChar, appointmentId || null)
            .query('INSERT INTO Notifications (userId, message, appointmentId, isRead) VALUES (@uId, @msg, @aId, 0)');
        }
      }
    } 
    // 3. PATH B: Notify the Client/User
    else if (userId) {
      await pool.request()
        .input('uId', sql.Int, userId)
        .input('msg', sql.NVarChar, message)
        .input('aId', sql.VarChar, appointmentId || null)
        .query('INSERT INTO Notifications (userId, message, appointmentId, isRead) VALUES (@uId, @msg, @aId, 0)');
    }
    
    return res.status(201).json({ message: 'Notifications processed' });
  } catch (error) {
    console.error("Notification Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const pool = getPool();
    await pool.request()
      .input('uId', sql.Int, userId)
      .query('UPDATE Notifications SET isRead = 1 WHERE userId = @uId');
    
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const pool = getPool();
    await pool.request()
      .input('uId', sql.Int, userId)
      .query('DELETE FROM Notifications WHERE userId = @uId');
      
    return res.status(200).json({ message: 'Notifications cleared' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};