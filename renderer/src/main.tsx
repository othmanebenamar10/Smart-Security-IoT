import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

declare global {
  interface Window {
    secureAPI: {
      send: (channel: string, payload?: unknown) => Promise<unknown>;
      receive: (channel: string, callback: (data: unknown) => void) => () => void;
    };
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
