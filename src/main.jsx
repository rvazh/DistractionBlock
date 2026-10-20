import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { EstadoProvider } from './contexto/Estado.jsx';
import { UIProvider } from './contexto/UI.jsx';
import './styles/global.css';
import './styles/estilos.css';
import './dados/instalar.js'; // já fica de olho no convite de instalação do navegador

import { iniciar } from './dados/armazenamento.js';

// HashRouter (URLs com #/) funciona no GitHub Pages e no Vercel sem configuração extra
function mostrar() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HashRouter>
        <EstadoProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </EstadoProvider>
      </HashRouter>
    </React.StrictMode>
  );
}

// Antes de mostrar, confere o login da nuvem (e o link de confirmação do e-mail, se veio de um)
iniciar().catch(() => {}).finally(mostrar);

// Service worker: permite instalar como app e abrir sem internet
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* sem service worker: o site funciona normalmente */
    });
  });
}
