import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublishingProvider } from './context/PublishingContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorProvider } from './context/ErrorContext';
import { FeedbackProvider } from './context/FeedbackContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PublishingProvider>
          <ToastProvider>
            <ErrorProvider>
              <FeedbackProvider>
                <App />
              </FeedbackProvider>
            </ErrorProvider>
          </ToastProvider>
        </PublishingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
