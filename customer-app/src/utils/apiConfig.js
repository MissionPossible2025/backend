// Utility to get the correct API URL based on the environment
export const getApiUrl = () => {
    // If VITE_API_URL is explicitly set, use it (highest priority)
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  
    // Check if we're running in Capacitor (Android/iOS)
    // Use try-catch to handle cases where Capacitor might not be loaded yet
    try {
      const isCapacitor = typeof window !== 'undefined' && 
                         (window.Capacitor !== undefined || 
                          window.Android !== undefined ||
                          navigator.userAgent.includes('Capacitor'));
      
      if (isCapacitor) {
        // Try to get platform from Capacitor
        let platform = 'unknown';
        try {
          if (window.Capacitor && window.Capacitor.getPlatform) {
            platform = window.Capacitor.getPlatform();
          } else if (window.Android) {
            platform = 'android';
          } else if (navigator.userAgent.includes('Android')) {
            platform = 'android';
          } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
            platform = 'ios';
          }
        } catch (e) {
          // Fallback detection
          if (navigator.userAgent.includes('Android')) {
            platform = 'android';
          }
        }
        
        if (platform === 'android') {
          // Use 10.0.2.2 for emulator, or replace with your local network IP for physical device
          return 'http://10.0.2.2:5001/api';
        } else if (platform === 'ios') {
          // For iOS simulator, localhost should work
          return 'http://localhost:5001/api';
        }
      }
    } catch (e) {
      // If detection fails, fall through to default
      console.warn('Could not detect platform, using default API URL');
    }
  
    // Default fallback for browser development
    return 'http://localhost:5001/api';
  };