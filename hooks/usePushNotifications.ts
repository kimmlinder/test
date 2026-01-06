import { useEffect, useCallback } from 'react';

export const usePushNotifications = () => {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  const notifyOrderStatusChange = useCallback((orderId: string, newStatus: string) => {
    const statusMessages: Record<string, string> = {
      accepted: 'Your order has been accepted! We\'ll start working on it soon.',
      in_progress: 'Great news! We\'re now working on your order.',
      preview_sent: 'Your preview is ready! Please review and provide feedback.',
      shipped: 'Your order is on its way!',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'Your order has been cancelled.',
    };
    
    const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;
    
    showNotification(`Order #${orderId.slice(0, 8)} Update`, {
      body: message,
      tag: `order-${orderId}`,
    });
  }, [showNotification]);

  return {
    requestPermission,
    showNotification,
    notifyOrderStatusChange,
    isSupported: 'Notification' in window,
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied',
  };
};