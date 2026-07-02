import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NotificationDropdown from '../components/NotificationDropdown';
import { useNotifications } from '../context/Notifications';
import styles from './DashboardPage.module.css';

// Generates an infinite, collision-resistant reference tracking handle
const generateUniqueRefHandle = (existingRecords = []) => {
  const prefix = 'APT';
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  const generatedId = `${prefix}-${timePart}${randomPart}`;
  
  const isDuplicate = existingRecords.some(record => record.id === generatedId);
  if (isDuplicate) {
    return generateUniqueRefHandle(existingRecords);
  }
  return generatedId;
};

function DashboardPage() {
  const navigate = useNavigate();
  const { refreshNotifications } = useNotifications();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // LIVE RELEASES: Database tracking states
  const [appointments, setAppointments] = useState([]);
  const [dataRecords, setDataRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Calendar Navigation States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 5, 1)); // Default: June 2026

  // Modal Triggers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // LIVE RELEASES: State flags for processing modifications
  const [isEditing, setIsEditing] = useState(false);
  const [editAppointmentId, setEditAppointmentId] = useState(null);

  // Form states
  const [newAppointment, setNewAppointment] = useState({ 
    title: '',
    service: 'Financial Analysis', 
    date: '',
    details: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!cachedUser?.token) {
      navigate('/login', { replace: true });
      return;
    }
    setUserData(cachedUser);
    
    
    // CONNECTED: Triggers automatic retrieval from database on layer mount initialization
    fetchAppointments();
  }, [navigate]);

  // DATABASE FETCHING ENGINE (GET)
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/appointments');
      setDataRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to sync appointment data assets from cloud storage.');
      console.error('Fetch error context:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CALENDAR PAGINATION NAVIGATION MOTORS
  // ==========================================
  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeekOffset = new Date(currentYear, currentMonth, 1).getDay();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(file => file.name);
    setUploadedFiles([...uploadedFiles, ...fileNames]);
  };

  const removeUploadedFile = (indexToRemove) => {
    setUploadedFiles(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

    const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

  setSubmitting(true);
    setError('');
    
    const today = new Date().toISOString().split('T')[0];

    const newRecord = {
      id: generateUniqueRefHandle(dataRecords), 
      title: newAppointment.title || 'Untitled Request',
      service: newAppointment.service,
      submissionDate: today,
      date: newAppointment.date,
      status: 'Pending',
      details: newAppointment.details || 'No additional details provided.',
      attachments: uploadedFiles
    };

    try {
      // 1. SAVE THE APPOINTMENT
      await api.post('/appointments', newRecord);
      
      // 2. TRIGGER NOTIFICATION
      await api.post('/notifications', {
        targetRole: 'admin', 
        message: `New appointment submitted: ${newRecord.title} by ${userData?.name || 'Client'}`,
        appointmentId: newRecord.id
      });

      // 3. FORCE REFRESH: This updates the NotificationDropdown instantly
      await refreshNotifications();

      // 4. UPDATE LOCAL STATE
      setDataRecords(prev => [...prev, newRecord]);

      // 5. CLEAN UP UI
      setShowCreateModal(false);
      setNewAppointment({ title: '', service: 'Financial Analysis', date: '', details: '' });
      setUploadedFiles([]);
      
    } catch (err) {
      console.error("Submission failed", err);
      setError("Failed to save appointment. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // LIVE LINK: DATABASE MODIFICATION ENGINE (PUT)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.put(`/appointments/${editAppointmentId}`, {
        title: newAppointment.title,
        service: newAppointment.service,
        date: newAppointment.date,
        details: newAppointment.details,
        attachments: uploadedFiles
      });

      setDataRecords(prev => prev.map(record => 
        record.id === editAppointmentId ? { ...record, ...res.data } : record
      ));

      setShowCreateModal(false);
      setIsEditing(false);
      setEditAppointmentId(null);
      setNewAppointment({ title: '', service: 'Financial Analysis', date: '', details: '' });
      setUploadedFiles([]);
    } catch (err) {
      console.error("Error editing appointment transaction data:", err);
      alert("Failed to save changes safely to the storage backend system.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAppointmentDetails = (appt) => {
    setSelectedAppointment(appt);
  };

  const openAppointmentEdit = (record) => {
    setIsEditing(true);
    setEditAppointmentId(record.id);
    setNewAppointment({
      title: record.title,
      service: record.service,
      date: record.date,
      details: record.details
    });
    setUploadedFiles(record.attachments || []);
    setShowCreateModal(true);
  };

  const handleDayClick = (dayNum) => {
    const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    const match = dataRecords.find(r => r.date === formattedDate);
    if (match) openAppointmentDetails(match);
  };

  return (
    <div className={styles.appContainer}>
      
      {/* Navigation Sidebar */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>FinMark</div>
          <nav className={styles.navLinks}>
            <button onClick={() => setActiveTab('overview')} className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}>Overview</button>
            <button onClick={() => setActiveTab('appointments')} className={`${styles.navItem} ${activeTab === 'appointments' ? styles.navItemActive : ''}`}>Appointments</button>
          </nav>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
      </aside>

      {/* Main Workspace Frame */}
      <main className={styles.mainWorkspace}>
        <header className={styles.header}>
          <div><strong>Workspace Console</strong></div>
          <div className={styles.profileZone} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationDropdown />
            <span className={styles.userBadge}>{userData?.role || 'Client'}</span>
            <span>{userData?.name || 'User Account'}</span>
          </div>
        </header>

        <div className={styles.contentArea}>
          {error && <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem' }}>{error}</div>}
          
          {/* TAB FRAME 1: OVERVIEW SCREEN */}
          {activeTab === 'overview' && (
            <>
              <section className={styles.welcomeSection}>
                <h1>Welcome back, {userData?.name?.split(' ')[0] || 'User'}!</h1>
                <p>Here is an operational overview of your account status metrics.</p>
              </section>

              {/* TWO-COLUMN METRICS GRID */}
              <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Total Appointments</div>
                  <div className={styles.cardValue}>{loading ? '...' : dataRecords.length}</div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Active Processing</div>
                  <div className={styles.cardValue}>{loading ? '...' : dataRecords.filter(r => r.status === 'Pending').length}</div>
                </div>
              </div>

              {/* Native Grid Calendar with Interactive Arrows */}
              <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{monthNames[currentMonth]} {currentYear}</h3>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button type="button" onClick={handlePrevMonth} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>&larr;</button>
                    <button type="button" onClick={handleNextMonth} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>&rarr;</button>
                  </div>
                </div>
                <div className={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className={styles.weekdayLabel}>{d}</div>
                  ))}
                  
                  {Array.from({ length: startDayOfWeekOffset }).map((_, spacerIdx) => (
                    <div key={`spacer-${spacerIdx}`} className={styles.calendarDay} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'default' }}></div>
                  ))}

                  {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map(day => {
                    const currentString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const hasAppt = dataRecords.some(r => r.date === currentString);
                    return (
                      <div 
                        key={day} 
                        onClick={() => handleDayClick(day)}
                        className={`${styles.calendarDay} ${hasAppt ? styles.hasAppointment : ''}`}
                      >
                        {day}
                        {hasAppt && <div className={styles.appointmentDot}></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB FRAME 2: APPOINTMENTS VIEW SCREEN */}
          {activeTab === 'appointments' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeaderRow}>
                <div>
                  <h3>Scheduled Appointments</h3>
                  <p style={{ color: '#475569', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Review and request management sessions.</p>
                </div>
                <button onClick={() => { setIsEditing(false); setShowCreateModal(true); }} className={styles.actionBtn}>+ Create New Request</button>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Syncing database entries...</div>
              ) : dataRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No appointments found. Click "+ Create New Request" to file your first session tracking item.
                </div>
              ) : (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Reference ID</th>
                      <th>Title Handle</th>
                      <th>Service Type</th>
                      <th>Submission Date</th>
                      <th>Scheduled Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRecords.map((record) => (
                      <tr key={record.id}>
                        <td><strong>{record.id}</strong></td>
                        <td>{record.title}</td>
                        <td>{record.service}</td>
                        <td>{record.submissionDate}</td>
                        <td>{record.date}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            record.status === 'Approved' ? styles.badgeSuccess : 
                            record.status === 'Rejected' ? styles.badgeDanger : styles.badgeWarning
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => openAppointmentDetails(record)} 
                              className={styles.actionBtn}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#475569' }}
                            >
                              View Details
                            </button>
                            
                            {/* CONDITIONAL ASSIGNMENT: Edit button displays exclusively if the status is Pending */}
                            {record.status === 'Pending' && (
                              <button 
                                onClick={() => openAppointmentEdit(record)} 
                                className={styles.actionBtn}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#0284c7' }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL OVERLAY 1: APPOINTMENT REQUEST / EDIT FORM FRAMEWORK */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '520px' }}>
            <h3>{isEditing ? 'Edit Appointment Request' : 'Request New Appointment'}</h3>
            <form onSubmit={isEditing ? handleEditSubmit : handleFormSubmit}>
              <div className={styles.formGroup}>
                <label>Appointment Title / Headline</label>
                <input 
                  type="text" 
                  required 
                  disabled={submitting}
                  placeholder="e.g., Q2 Profit Review, Competitor Matrix Alignment"
                  value={newAppointment.title} 
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Service Type</label>
                <select disabled={submitting} value={newAppointment.service} onChange={(e) => setNewAppointment({...newAppointment, service: e.target.value})}>
                  <option value="Financial Analysis">Financial Analysis</option>
                  <option value="Business Intelligence Services">Business Intelligence Services</option>
                  <option value="Marketing Analytics">Marketing Analytics</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Target Appointment Date</label>
                <input type="date" required disabled={submitting} value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label>Appointment Details / Context Notes</label>
                <textarea 
                  disabled={submitting}
                  placeholder="Describe your goals, targets, or support details for this appointment session..."
                  value={newAppointment.details}
                  onChange={(e) => setNewAppointment({...newAppointment, details: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Upload Supporting Documents</label>
                <div className={styles.fileUploadZone}>
                  <span className={styles.uploadLabel}>📁 Drag & drop files or <strong>browse your computer</strong></span>
                  <input type="file" multiple disabled={submitting} onChange={handleFileChange} />
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className={styles.fileList}>
                    {uploadedFiles.map((name, idx) => (
                      <div key={idx} className={styles.fileBadge}>
                        <span>📄 {name}</span>
                        <button type="button" disabled={submitting} onClick={() => removeUploadedFile(idx)} className={styles.removeFileBtn}>Wipe</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  disabled={submitting} 
                  className={styles.cancelBtn} 
                  onClick={() => { 
                    setShowCreateModal(false); 
                    setIsEditing(false);
                    setEditAppointmentId(null);
                    setUploadedFiles([]); 
                    setNewAppointment({ title: '', service: 'Financial Analysis', date: '', details: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={styles.actionBtn}>
                  {submitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 2: METADATA DETAILS VIEW */}
      {selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => setSelectedAppointment(null)}>
          <div className={styles.modalCard} style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Appointment Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Reference Handle</label>
                <input type="text" readOnly value={selectedAppointment.id} />
              </div>
              <div className={styles.formGroup}>
                <label>Pipeline Status</label>
                <input type="text" readOnly value={selectedAppointment.status} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Appointment Title Handle</label>
              <input type="text" readOnly value={selectedAppointment.title} />
            </div>

            <div className={styles.formGroup}>
              <label>Service Type Classification</label>
              <input type="text" readOnly value={selectedAppointment.service} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Submission Date</label>
                <input type="text" readOnly value={selectedAppointment.submissionDate} />
              </div>
              <div className={styles.formGroup}>
                <label>Target Scheduled Date</label>
                <input type="text" readOnly value={selectedAppointment.date} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Appointment Details & Context Summary</label>
              <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', color: '#334155', lineHeight: '1.4' }}>
                {selectedAppointment.details}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Secure Attached Documents ({selectedAppointment.attachments?.length || 0})</label>
              {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 ? (
                <div className={styles.readOnlyAttachmentList}>
                  {selectedAppointment.attachments.map((fileName, index) => (
                    <div key={index} className={styles.staticFileBadge}>
                      📎 {fileName}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.815rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem' }}>No asset attachments uploaded for this appointment slot.</div>
              )}
            </div>

            <hr className={styles.divider} />

            <div className={styles.modalActions}>
              <button className={styles.actionBtn} onClick={() => setSelectedAppointment(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardPage;