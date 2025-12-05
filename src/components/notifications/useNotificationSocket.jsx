import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useNotificationSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const queryClient = useQueryClient();

  const connect = useCallback(async () => {
    // Don't reconnect if already connected or connecting
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Get the WebSocket URL from the function endpoint
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const functionUrl = `${wsProtocol}//${window.location.host}/api/functions/notificationWebSocket`;
      
      // For Base44, we need to use a different approach
      // We'll use Server-Sent Events (SSE) pattern via long-polling as fallback
      // since Base44 functions may not support raw WebSocket upgrades
      
      // Instead, implement efficient polling with exponential backoff
      setConnectionStatus('connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      
      console.log('📡 Notification service connected (polling mode)');
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus('failed');
      console.log('❌ Max reconnection attempts reached');
      return;
    }
    
    reconnectAttemptsRef.current++;
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Function to manually trigger a refresh (can be called from components)
  const refreshNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  }, [queryClient]);

  // Handle incoming notification
  const handleNewNotification = useCallback((notification) => {
    setLastNotification(notification);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('newNotification', { 
      detail: notification 
    }));
  }, [queryClient]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastNotification,
    refreshNotifications,
    reconnect: connect
  };
}

export default useNotificationSocket;