import React, { useState } from 'react';
import { useNotifications } from '../context/Notifications';
import NotificationDropdown from './NotificationDropdown';
import styles from './Auth.module.css';

function HeaderBar({ user, onLogout }) {
  const { unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div style={{
      width: '100%', boxSizing: 'border-box', backgroundColor: '#1a1a1a', 
      borderBottom: '1px solid #333', padding: '12px 24px', display: 'flex', 
      justifyContent: 'space-between', alignItems: 'center', position: 'relative'
    }}>
      
      {/* BRANDING LOGO */}
      <h1 className={styles.logo} style={{ margin: 0, fontSize: '22px', cursor: 'default' }}>
        FinMark
      </h1>

      {/* USER OPTIONS & NOTIFICATION TRIGGER SYSTEM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* BELL NOTIFICATION ACTION CONTAINER */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              background: 'none', border: 'none', fontSize: '20px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'
            }}
            title="Toggle Alerts"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#f0a500',
                color: '#000', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%',
                width: '16px', height: '16px', display: 'flex', justifyContent: 'center', 
                alignItems: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* FLOATING DROPDOWN LIST CARD COMPONENT */}
          <NotificationDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
        </div>

        {/* METADATA IDENTIFIER STRINGS */}
        <div style={{ textAlign: 'right', fontSize: '13px', color: '#aaa' }}>
          <span style={{ display: 'block', color: '#fff', fontWeight: 'bold' }}>{user?.name}</span>
          <span>{user?.role === 'admin' ? 'Administrator' : 'Client Profile'}</span>
        </div>

        {/* COMPACT LOGOUT TERMINATION CONTROL */}
        <button 
          onClick={onLogout} 
          style={{
            padding: '6px 12px', background: '#dc3545', color: '#fff', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default HeaderBar;