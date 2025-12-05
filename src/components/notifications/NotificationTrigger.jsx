import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrowserNotification, NotificationTypes, createNotification } from './useBrowserNotification';
import { createPageUrl } from '@/utils';

/**
 * Component that polls for new notifications and triggers browser notifications
 * Mount this once in Layout or a top-level component
 */
export default function NotificationTrigger({ user, enabled = true }) {
  const { isGranted, showNotification } = useBrowserNotification();
  const lastNotificationIdRef = useRef(null);
  const hasShownInitialRef = useRef(false);

  // Poll for new notifications every 30 seconds
  const { data: notifications } = useQuery({
    queryKey: ['browserNotifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.entities.Notification.filter(
        { to_email: user.email, is_read: false },
        '-created_date',
        5
      );
      return result || [];
    },
    enabled: enabled && isGranted && !!user?.email,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!isGranted || !notifications?.length) return;

    // Skip on initial load to avoid spamming
    if (!hasShownInitialRef.current) {
      hasShownInitialRef.current = true;
      if (notifications.length > 0) {
        lastNotificationIdRef.current = notifications[0].id;
      }
      return;
    }

    // Check for new notifications
    const latestNotification = notifications[0];
    if (!latestNotification || latestNotification.id === lastNotificationIdRef.current) {
      return;
    }

    // Show browser notification for the new one
    const notifType = getNotificationType(latestNotification.notification_type);
    const url = getNotificationUrl(latestNotification);

    createNotification(
      showNotification,
      notifType,
      latestNotification.title,
      latestNotification.message,
      url
    );

    lastNotificationIdRef.current = latestNotification.id;
  }, [notifications, isGranted, showNotification]);

  return null;
}

/**
 * Map notification types to browser notification types
 */
function getNotificationType(type) {
  const typeMap = {
    'shift_application_received': 'SHIFT_APPLICATION',
    'shift_application_accepted': 'SHIFT_ACCEPTED',
    'shift_application_rejected': 'SHIFT_ACCEPTED',
    'shift_invitation_received': 'NEW_INVITATION',
    'shift_reminder': 'SHIFT_REMINDER',
    'shift_posted': 'GENERAL',
    'review_received': 'GENERAL',
  };
  return typeMap[type] || 'GENERAL';
}

/**
 * Get the URL to navigate to when notification is clicked
 */
function getNotificationUrl(notification) {
  const baseUrl = window.location.origin;
  
  if (notification.action_url) {
    return notification.action_url.startsWith('http') 
      ? notification.action_url 
      : `${baseUrl}${notification.action_url}`;
  }

  // Default URLs based on type
  const typeUrls = {
    'shift_application_received': createPageUrl('ManageApplications'),
    'shift_application_accepted': createPageUrl('MySchedule'),
    'shift_application_rejected': createPageUrl('MyApplications'),
    'shift_invitation_received': createPageUrl('PharmacistInvitations'),
    'shift_reminder': createPageUrl('MySchedule'),
    'shift_posted': createPageUrl('BrowseShifts'),
    'review_received': createPageUrl('PharmacistReviews'),
  };

  const path = typeUrls[notification.notification_type] || createPageUrl('Notifications');
  return `${baseUrl}${path}`;
}

/**
 * Hook to manually trigger a notification
 */
export function useTriggerNotification() {
  const { isGranted, showNotification } = useBrowserNotification();

  const trigger = (title, body, options = {}) => {
    if (!isGranted) {
      console.log('Notifications not granted, skipping');
      return null;
    }
    return showNotification(title, { body, ...options });
  };

  return { trigger, isEnabled: isGranted };
}