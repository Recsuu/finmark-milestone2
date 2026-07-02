import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NotificationDropdown from '../components/NotificationDropdown';
import { useNotifications } from '../context/Notifications';
import styles from './DashboardPage.module.css';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [userData] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeTab, setActiveTab] = useState('overview');
  const [dataRecords, setDataRecords] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 5, 1));
  const [statusInput, setStatusInput] = useState('');
  const { refreshNotifications } = useNotifications();
  const [submitting, setSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'submissionDate', direction: 'desc' });
  const recordsPerPage = 10;
  
  const adminBtnStyle = {
    background: '#475569',
    color: '#ffffff',
    border: '1px solid #334155',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.85rem'
  };

  useEffect(() => { 
    fetchAppointments(); 
  }, []);
  
  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setDataRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const handleStatusUpdate = async (id) => {
    if (submitting) return; 
    
    const targetAppointment = dataRecords.find(r => r.id === id);
    if (!targetAppointment) return;

    setSubmitting(true);
    try {
      // 1. Update DB
      await api.put(`appointments/${id}`, { status: statusInput });
      
      // 2. Notify ONLY the client, using a unified message format to prevent duplicates
      await api.post('/notifications', {
        userId: targetAppointment.userId,
        message: `Appointment ${id} (${targetAppointment.title}) status updated to: ${statusInput}`,
        appointmentId: id,
        targetRole: 'client' 
      });
      
      // 3. Update local state immediately
      setDataRecords(prev => prev.map(r => r.id === id ? { ...r, status: statusInput } : r));
      setSelectedAppointment(null);
      
      // 4. Single refresh trigger
      await refreshNotifications();
    } catch (err) { 
      console.error("Update failed:", err);
      alert("Failed to update status."); 
    } finally {
      setSubmitting(false); 
    }
  };

  // Memoized filtering and sorting to prevent re-calc bugs
  const filteredRecords = useMemo(() => {
    return dataRecords.filter(r => 
      String(r.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(r.title).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dataRecords, searchTerm]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      if (sortConfig.key === 'submissionDate' || sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(aVal) - new Date(bVal) 
          : new Date(bVal) - new Date(aVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortConfig]);

  // 3. PAGINATION
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const currentRecords = sortedRecords.slice(
    (currentPage - 1) * recordsPerPage, 
    currentPage * recordsPerPage
  );

  // Calendar Logic
  const handlePrevMonth = () => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const totalDaysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
  const startDayOfWeekOffset = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();

  return (
    <div className={styles.appContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>FinMark Admin</div>
        <nav className={styles.navLinks}>
          <button onClick={() => setActiveTab('overview')} className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}>Overview</button>
          <button onClick={() => setActiveTab('appointments')} className={`${styles.navItem} ${activeTab === 'appointments' ? styles.navItemActive : ''}`}>Appointments</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className={styles.logoutBtn}>Sign Out</button>
      </aside>

      <main className={styles.mainWorkspace}>
        <header className={styles.header}>
          <div><strong>Administrative Console</strong></div>
          <div className={styles.profileZone}>
            <NotificationDropdown />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{userData?.name || 'User'}</span>
              <span className={styles.userBadge}>{userData?.role || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'overview' && (
            <>
              <div className={styles.metricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className={styles.card}><div className={styles.cardTitle}>Total Requests</div><div className={styles.cardValue}>{dataRecords.length}</div></div>
                <div className={styles.card}><div className={styles.cardTitle}>Pending</div><div className={styles.cardValue}>{dataRecords.filter(r => r.status === 'Pending').length}</div></div>
                <div className={styles.card}><div className={styles.cardTitle}>Completed</div><div className={styles.cardValue}>{dataRecords.filter(r => r.status === 'Completed').length}</div></div>
              </div>

              <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</h3>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button type="button" onClick={handlePrevMonth} style={adminBtnStyle}>&larr;</button>
                    <button type="button" onClick={handleNextMonth} style={adminBtnStyle}>&rarr;</button>
                  </div>
                </div>
                <div className={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className={styles.weekdayLabel}>{d}</div>)}
                  {Array.from({ length: startDayOfWeekOffset }).map((_, i) => <div key={`s-${i}`} />)}
                  {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map(day => {
                    const dateStr = `${currentCalendarDate.getFullYear()}-${(currentCalendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const hasAppt = dataRecords.some(r => r.date === dateStr);
                    return (
                      <div key={day} className={styles.calendarDay} onClick={() => { const match = dataRecords.find(r => r.date === dateStr); if (match) setSelectedAppointment(match); }} style={{ cursor: hasAppt ? 'pointer' : 'default' }}>
                        {day}
                        {hasAppt && <div className={styles.appointmentDot} style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '50%', margin: '0 auto' }}></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'appointments' && (
            <div className={styles.tableContainer}>
              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Search by ID or Title..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px', width: '300px' }}
                />
              </div>

              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'id', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Reference ID</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'title', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Title Handle</th>
                    <th>Service Type</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.id}</strong></td>
                      <td>{r.title}</td>
                      <td>{r.service}</td>
                      <td>{r.date}</td>
                      <td><span className={styles.badge}>{r.status}</span></td>
                      <td>
                        <button onClick={() => { setSelectedAppointment(r); setStatusInput(r.status); }} style={adminBtnStyle}>Inspect</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ ...adminBtnStyle, opacity: currentPage === 1 ? 0.5 : 1 }}>Previous</button>
                <span style={{ fontSize: '0.875rem' }}>Page {currentPage} of {totalPages || 1}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ ...adminBtnStyle, opacity: currentPage >= totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedAppointment && (
  <div className={styles.modalOverlay} onClick={() => setSelectedAppointment(null)}>
    <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
      <h3>Appointment Information</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label>Reference Handle</label>
          <input type="text" readOnly value={selectedAppointment.id} />
        </div>
        <div className={styles.formGroup}>
          <label>Pipeline Status</label>
          <select value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
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
        <textarea readOnly value={selectedAppointment.details || 'No details provided.'} rows="3" style={{ width: '100%' }} />
      </div>

      <button onClick={() => handleStatusUpdate(selectedAppointment.id)} className={styles.actionBtn}>Save Status</button>
    </div>
  </div>
  )};
</div>
  )
}

export default AdminDashboardPage;