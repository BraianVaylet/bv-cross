import { ThemeProvider } from '@medano-ui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './lib/pwaInstall'; // captura beforeinstallprompt desde el arranque
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider storageKeys={{ theme: 'bv-theme', accent: 'bv-accent' }}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
