// Silence Fast Refresh console logs in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Store original console.log
  const originalConsoleLog = console.log;
  
  // Replace console.log with filtered version
  console.log = (...args) => {
    // Filter out Fast Refresh logs
    if (typeof args[0] === 'string' && 
        (args[0].includes('[Fast Refresh]') || 
         args[0].includes('Fast Refresh initialized'))) {
      return;
    }
    
    // Pass other logs through to original console.log
    originalConsoleLog(...args);
  };
}