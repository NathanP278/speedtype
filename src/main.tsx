import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black text-terminal-lime">
      <div className="text-center font-mono">
        <h1 className="text-4xl font-bold tracking-wider">SPEEDTYPE // INITIALIZED</h1>
        <p className="mt-2 text-sm opacity-70">Terminal Combat Subsystem Online</p>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
