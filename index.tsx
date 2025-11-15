
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Define the callback function that the Google Maps script will call.
// It must be on the window object to be globally accessible.
(window as any).initMap = () => {
  renderApp();
};

// Create and append the script tag to load the Google Maps API.
// The `callback=initMap` parameter executes the function above once the script is loaded.
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);