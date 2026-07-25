import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt.tsx';
import { registerPwaUpdates } from './lib/pwaUpdate.ts';
import './index.css';

registerPwaUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaUpdatePrompt />
  </StrictMode>
);
