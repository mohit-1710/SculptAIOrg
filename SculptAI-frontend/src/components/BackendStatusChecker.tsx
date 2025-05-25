import { useState, useEffect } from 'react';
import axios from 'axios';

export const BackendStatusChecker = () => {
  const [isBackendUp, setIsBackendUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [checking, setChecking] = useState(false);

  const checkBackendStatus = async () => {
    try {
      setChecking(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'dockerdeploy-production.up.railway.app';
      // We need to ensure we are pinging a valid health check endpoint.
      // VITE_API_URL might be 'https://<...>/api/v1', so we need the base part.
      const healthCheckUrl = baseUrl.includes('/api/v1') 
        ? baseUrl.replace('/api/v1', '/health') 
        : `${baseUrl}/health`;

      await axios.get(healthCheckUrl);
      setIsBackendUp(true);
    } catch (error) {
      console.error('Backend connectivity check failed:', error);
      setIsBackendUp(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Set up an interval to periodically check
    const intervalId = setInterval(() => {
      checkBackendStatus();
      setCheckCount(prev => prev + 1);
    }, 60000); // Check every minute
    
    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRetry = () => {
    checkBackendStatus();
    setCheckCount(prev => prev + 1);
  };

  if (isBackendUp === false) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md">
        <div className="flex flex-col">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
            <div>
              <p className="font-bold">Backend Service Unavailable</p>
              <p className="text-sm">The application backend is not responding. This is necessary for creating animations.</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button 
              onClick={handleRetry}
              disabled={checking}
              className={`px-3 py-1 rounded text-sm font-medium ${checking ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
            >
              {checking ? 'Checking...' : 'Retry Connection'}
            </button>
          </div>
          <div className="mt-1 text-xs text-red-500">
            Backend check attempts: {checkCount}
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 