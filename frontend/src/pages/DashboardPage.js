import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../components/Auth.module.css';

function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>FinMark</h1>
        <h2 className={styles.title}>Welcome, {user?.name}!</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '8px' }}>
          You are logged in as <strong>{user?.role}</strong>
        </p>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '24px' }}>
          {user?.email}
        </p>
        {user?.role === 'admin' && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
            <strong>Admin Tools</strong>
            <p style={{ color: '#555', fontSize: '14px', margin: '4px 0 0' }}>
              Manage Users (coming soon)
            </p>
          </div>
        )}
        <button onClick={handleLogout} className={styles.btn}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
