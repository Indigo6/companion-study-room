import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './scene-art.css';
import './responsive-shell.css';
import './settings.css';
import './settings-extra.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js'));
}
