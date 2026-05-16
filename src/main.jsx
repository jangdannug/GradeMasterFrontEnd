import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global shims for browser compatibility with libraries using Node.js built-ins
// This resolves the "Module stream has been externalized" error in Vite.
if (typeof window !== 'undefined') {
  window.global = window;
  window.process = { env: {} };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
