import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000; // Show warning 1 minute before logout

interface UseInactivityTimeoutReturn {
  showWarning: boolean;
  remainingSeconds: number;
  resetTimer: () => void;
}

export const useInactivityTimeout = (): UseInactivityTimeoutReturn => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await signOut();
  }, [signOut, clearAllTimers]);

  const startCountdown = useCallback(() => {
    setRemainingSeconds(60);
    setShowWarning(true);

    countdownRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setRemainingSeconds(60);

    if (!user) return;

    // Set warning timeout (14 minutes)
    warningTimeoutRef.current = window.setTimeout(() => {
      startCountdown();
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);

    // Set logout timeout (15 minutes)
    timeoutRef.current = window.setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, handleLogout, clearAllTimers, startCountdown]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      return;
    }

    // Events that count as activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    // Throttle activity detection to avoid too many resets
    let lastActivity = Date.now();
    const THROTTLE_MS = 1000; // Only reset timer once per second max

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > THROTTLE_MS) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [user, resetTimer, clearAllTimers]);

  return {
    showWarning,
    remainingSeconds,
    resetTimer,
  };
};
