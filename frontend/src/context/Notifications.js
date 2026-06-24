import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios'; 

const NotificationContext = createContext(undefined);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Computed State metrics
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ==========================================
  // DATABASE INTEGRATION FETCH HANDLERS
  // ==========================================
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading cloud alerts:', err);
      setError('Failed to sync incoming notification indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ==========================================
  // ACTION HANDLERS WITH BLUEPRINT DATABASE LINKS
  // ==========================================
  const addNotification = async (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newNotification = {
      id: Date.now(),
      message,
      isRead: false,
      createdAt: timestamp
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.put('/notifications/mark-all-read');
    } catch (err) {
      console.error('Failed to batch push reading updates to database backend:', err);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      await api.delete('/notifications');
    } catch (err) {
      console.error('Failed to flush log entries from server space:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading,
      error,
      addNotification, 
      markAllAsRead, 
      clearNotifications,
      refreshNotifications: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}