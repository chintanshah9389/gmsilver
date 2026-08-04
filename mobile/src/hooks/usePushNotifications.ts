import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  initPushListeners,
  registerDeviceForPush,
  teardownPushListeners,
} from '@/services/pushNotifications';

/**
 * Registers FCM listeners and syncs the device token whenever the user is authenticated.
 */
export function usePushNotifications() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    initPushListeners();
    return () => {
      teardownPushListeners();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    void registerDeviceForPush(userId);
  }, [isAuthenticated, userId]);
}
