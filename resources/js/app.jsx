import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './SchoolPanel/App';

const container = document.getElementById('school-panel');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
