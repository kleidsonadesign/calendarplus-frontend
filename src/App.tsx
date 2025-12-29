import React from 'react';
import './App.css';

function App() {
  
  // Função de exemplo para o botão
  const handleStart = () => {
    console.log("Iniciando agendamento...");
    // Aqui você poderá redirecionar para o login ou para o dashboard futuramente
  };

  return (
    <div className="app-container">
      
      {/* --- Cabeçalho --- */}
      <header className="header">
        <div className="logo-area">
          {/* O caminho "/Calendar.png" pega a imagem direto da pasta public */}
          <img 
            src="/Calendar.png" 
            alt="Logo Calendário" 
            className="logo-img" 
          />
          <span>Calendario +</span>
        </div>
        
        <nav className="nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#login">Entrar</a>
        </nav>
      </header>

      {/* --- Conteúdo Principal (Hero) --- */}
      <main className="main-content">
        <h1 className="title">
          Agendamento inteligente <br />
          para quem valoriza tempo.
        </h1>
        
        <p className="subtitle">
          Automatize seus agendamentos via WhatsApp e mantenha seu Google Calendar
          sempre sincronizado. Simples, rápido e eficiente.
        </p>

        <button className="cta-button" onClick={handleStart}>
          Começar Gratuitamente
        </button>
      </main>

      {/* --- (Opcional) Rodapé simples para fechar o layout --- */}
      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        © 2025 Calendar Plus . Todos os direitos reservados.
      </footer>

    </div>
  );
}

export default App;
