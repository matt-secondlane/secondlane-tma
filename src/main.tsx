import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);

const render = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

render();

// Hot Module Replacement (HMR)
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    console.log('🔄 HMR Update');
    render();
  });
}
