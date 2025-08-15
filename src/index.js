import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Frontend build tag to trigger redeploys
const APP_BUILD_TAG = 'iaf-frontend-redeploy-002';
console.log('Frontend build tag:', APP_BUILD_TAG);
window.APP_BUILD_TAG = APP_BUILD_TAG;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();