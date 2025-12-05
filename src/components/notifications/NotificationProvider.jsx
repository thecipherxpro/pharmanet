import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const NotificationContext = createContext(null);

// Smart polling with adaptive intervals
const MIN_POLL_INTERVAL = 30000;  // 30 seconds when active
const MAX_POLL_INTERVAL = 120000; // 2 minutes when idle
const ACTIVE_THRESHOLD = 60000;   // Consider user active if interacted within 1 minute

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pollIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const currentUserRef = useRef(null);
  const previousUnreadRef = useRef(0);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Calculate adaptive poll interval based on user activity
  const getAdaptivePollInterval = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    if (timeSinceActivity < ACTIVE_THRESHOLD) {
      return MIN_POLL_INTERVAL;
    }
    // Gradually increase interval when idle
    const idleMultiplier = Math.min(4, 1 + Math.floor(timeSinceActivity / ACTIVE_THRESHOLD));
    return Math.min(MAX_POLL_INTERVAL, MIN_POLL_INTERVAL * idleMultiplier);
  }, []);

  // Fetch notifications efficiently
  const fetchNotifications = useCallback(async (showToastForNew = true) => {
    if (!currentUserRef.current) {
      try {
        currentUserRef.current = await base44.auth.me();
      } catch {
        return;
      }
    }
    
    if (!currentUserRef.current) return;

    try {
      // Fetch only recent notifications to reduce payload
      const data = await base44.entities.Notification.filter(
        { to_email: currentUserRef.current.email },
        '-created_date',
        50
      );
      
      const newUnreadCount = (data || []).filter(n => !n.is_read).length;
      
      // Check for new notifications
      if (showToastForNew && newUnreadCount > previousUnreadRef.current && previousUnreadRef.current > 0) {
        const newestNotification = data.find(n => !n.is_read);
        if (newestNotification) {
          toast({
            title: newestNotification.title,
            description: newestNotification.message?.substring(0, 100),
            duration: 5000,
          });
        }
      }
      
      previousUnreadRef.current = newUnreadCount;
      setUnreadCount(newUnreadCount);
      setNotifications(data);
      setLastFetch(Date.now());
      setIsConnected(true);
      
      // Invalidate react-query cache
      queryClient.setQueryData(['notifications'], data);
      queryClient.setQueryData(['unreadCount'], { count: newUnreadCount });
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setIsConnected(false);
    }
  }, [queryClient, toast]);

  // Start adaptive polling
  useEffect(() => {
    let isActive = true;
    
    const poll = async () => {
      if (!isActive) return;
      
      await fetchNotifications();
      
      if (isActive) {
        const nextInterval = getAdaptivePollInterval();
        pollIntervalRef.current = setTimeout(poll, nextInterval);
      }
    };
    
    // Initial fetch
    poll();
    
    return () => {
      isActive = false;
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, [fetchNotifications, getAdaptivePollInterval]);

  // Listen for visibility changes to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediate fetch when tab becomes visible
        fetchNotifications();
        lastActivityRef.current = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchNotifications]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await base44.functions.invoke('markNotificationRead', {
        notification_id: notificationId
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [queryClient]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await base44.functions.invoke('markNotificationRead', {
        mark_all: true
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [queryClient]);

  const value = {
    unreadCount,
    notifications,
    isConnected,
    lastFetch,
    refresh,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
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

export default NotificationProvider;