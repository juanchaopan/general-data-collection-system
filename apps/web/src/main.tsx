import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@gdcs/tokens/tokens.css';
import './app/global.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('找不到 #root 节点');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
