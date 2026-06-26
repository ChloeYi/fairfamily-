import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource/climate-crisis';
import '@flaticon/flaticon-uicons/css/solid/rounded.css';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';

// On the native app the WebView renders everything smaller than on the
// desktop browser. Scale the whole UI up uniformly so text/layout match
// what we see on web. (No effect in a regular browser.)
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.zoom = '1.18';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
