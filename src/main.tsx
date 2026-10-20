import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/700.css';
import './ui/focus.css';
import './ui/parity.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
