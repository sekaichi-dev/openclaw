"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface PollingOptions {
  enabled?: boolean;
  retryCount?: number;
  adaptiveInterval?: boolean;
  priority?: "low" | "normal" | "high" | "critical";
}

export function usePolling<T>(
  url: string,
  intervalMs: number = 30000,
  initialData?: T,
  options: PollingOptions = {}
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);
  
  const {
    enabled = true,
    retryCount = 3,
    adaptiveInterval = true,
    priority = "normal"
  } = options;

  // Smart interval calculation based on time and priority
  const getAdaptiveInterval = useCallback(() => {
    if (!adaptiveInterval) return intervalMs;
    
    const now = new Date();
    const hour = now.getHours();
    const isNightTime = hour >= 2 && hour <= 6;
    const isBusinessHours = hour >= 9 && hour <= 18;
    
    let multiplier = 1;
    
    // Adjust for time of day
    if (isNightTime) {
      // Slower polling at night except for critical systems
      multiplier = priority === "critical" ? 0.8 : 1.5;
    } else if (isBusinessHours) {
      // Faster polling during business hours
      multiplier = 0.7;
    }
    
    // Adjust for priority
    switch (priority) {
      case "critical":
        multiplier *= 0.5; // 2x faster
        break;
      case "high":
        multiplier *= 0.75; // 1.33x faster
        break;
      case "low":
        multiplier *= 1.5; // 1.5x slower
        break;
      default: // normal
        break;
    }
    
    return Math.max(30000, Math.floor(intervalMs * multiplier)); // Min 30 seconds
  }, [intervalMs, adaptiveInterval, priority]);

  // Enhanced fetch with retry logic
  const fetchData = useCallback(async (isRetry = false, isBackground = false) => {
    if (!enabled) return;
    
    try {
      // Prevent too frequent requests
      const now = Date.now();
      if (now - lastFetchTime.current < 2000 && !isRetry) {
        return;
      }
      
      // Only show loading for initial fetch or manual refetch, not background polling
      if (!isRetry && !isBackground && !data) setLoading(true);
      
      const res = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      setData(json);
      setError(null);
      setRetryAttempts(0);
      lastFetchTime.current = now;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Fetch failed";
      console.warn(`Polling error for ${url}:`, errorMessage);
      
      setError(errorMessage);
      
      // Retry logic with exponential backoff
      if (retryAttempts < retryCount && enabled) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryAttempts), 10000);
        setRetryAttempts(prev => prev + 1);
        
        setTimeout(() => {
          if (enabled) {
            fetchData(true, isBackground);
          }
        }, backoffDelay);
      }
    } finally {
      if (!isRetry && !isBackground) setLoading(false);
    }
  }, [url, enabled, retryAttempts, retryCount, data]);

  // Smart polling setup
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchData();
    
    const setupNextInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      const currentInterval = getAdaptiveInterval();
      intervalRef.current = setInterval(() => {
        fetchData(false, true); // isRetry=false, isBackground=true
        setupNextInterval(); // Recalculate interval for next cycle
      }, currentInterval);
    };
    
    setupNextInterval();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, getAdaptiveInterval, enabled]);

  // Document visibility optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        // Fetch immediately when tab becomes visible
        const timeSinceLastFetch = Date.now() - lastFetchTime.current;
        if (timeSinceLastFetch > getAdaptiveInterval() * 0.5) {
          fetchData(false, false); // Not a retry, not background (user initiated)
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchData, enabled, getAdaptiveInterval]);

  return {
    data,
    loading,
    error,
    retryAttempts,
    refetch: () => fetchData(false, false), // Manual refetch, show loading
    nextInterval: getAdaptiveInterval(),
    pause: () => enabled && setError("Polling paused"),
    resume: () => enabled && fetchData(false, false)
  };
}
