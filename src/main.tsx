import React from 'react';
import ReactDOM from 'react-dom/client';
import RevivazPreview from './RevivazPreview';
import './index.css';
import { AvisoCookies } from './legal/AvisoCookies';
import { armarRecuperacao } from './lib/recuperaAtualizacao';

armarRecuperacao();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RevivazPreview />
    <AvisoCookies />
  </React.StrictMode>
);
