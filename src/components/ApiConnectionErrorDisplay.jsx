import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { theme } from '../theme';

/**
 * Reusable component to display an API connection error.
 * Provides a retry button that reloads the page.
 */
export function ApiConnectionErrorDisplay() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center rounded-xl border border-rose-100 shadow-sm">
      <div className="size-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6 animate-pulse">
        <WifiOff size={48} />
      </div>
      <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2 italic">API Connection Failed</h1>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        GradeMaster cannot reach the server. Please verify your connection or ensure the API service is active, then try again.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className={`${theme.styles.button} ${theme.styles.buttonPrimary} py-4 px-8`}
        >
          <RefreshCw size={18} />
          Retry Connection
        </button>
      </div>
    </div>
  );
}

export default ApiConnectionErrorDisplay;