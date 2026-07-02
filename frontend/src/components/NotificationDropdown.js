import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/Notifications';
import styles from '../pages/DashboardPage.module.css';

function NotificationDropdown({ count }) {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if user clicks outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={styles.bellIcon}
        style={{
          background: 'none', border: 'none', fontSize: '1.25rem',
          cursor: 'pointer', position: 'relative', padding: '4px 8px',
          display: 'flex', alignItems: 'center', color: '#475569'
        }}
        title="View Notifications"
      >
        <img 
          src="https://res.cloudinary.com/diy4eop6o/image/upload/v1782309428/magnific_a-sleek-dark-blue-notific_mCTIfGdhJQ-removebg-preview_f72arg.png" 
          alt="Notifications" 
          style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
        />
        
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '2px',
            width: '10px',
            height: '10px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid white',
            zIndex: 10
          }}></span>
        )}
      </button>

      {/* THE EXPANDABLE PANEL DROPDOWN */}
      {isOpen && (
        <div className={styles.dropdownPanel} style={{
          position: 'absolute', top: '40px', right: '0px', width: '320px',
          backgroundColor: '#1a1a1a', border: '1px solid #334155', borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', zIndex: 10000, overflow: 'hidden'
        }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #333', background: '#222' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
              Notifications {unreadCount > 0 && <span style={{ background: '#f0a500', color: '#000', borderRadius: '10px', padding: '2px 6px', fontSize: '11px', marginLeft: '6px' }}>{unreadCount}</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                Mark all as read
              </button>
            )}
          </div>

          {/* STREAM */}
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No recent updates.
              </div>
            ) : (
              notifications.map(item => (
                <div key={item.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid #222', fontSize: '13px',
                  backgroundColor: item.isRead ? 'transparent' : 'rgba(240, 165, 0, 0.05)',
                  borderLeft: item.isRead ? 'none' : '3px solid #f0a500'
                }}>
                  <p style={{ margin: 0, color: item.isRead ? '#ccc' : '#fff', lineHeight: '1.4' }}>{item.message}</p>
                  <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px' }}>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          {notifications.length > 0 && (
            <div style={{ padding: '8px 16px', textAlign: 'center', borderTop: '1px solid #333', background: '#222' }}>
              <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: '#dc3545', fontSize: '12px', cursor: 'pointer' }}>
                Clear All History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;