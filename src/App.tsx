import './App.css'; // Importa o estilo específico deste componente

function App() {
  return (
    <div className="app-wrapper">
      
      {/* --- Header / Barra de Navegação --- */}
      <header className="navbar">
        <div className="logo-container">
          {/* Imagem puxando direto da pasta public */}
          <img src="/Calendar.png" alt="Logo Calendar" className="logo-icon" />
          <span className="logo-text">Calendario +</span>
        </div>
        
        <nav className="nav-menu">
          <a href="#home">Início</a>
          <a href="#recursos">Recursos</a>
          <button className="btn-outline">Login</button>
        </nav>
      </header>

      {/* --- Conteúdo Principal (Hero Section) --- */}
      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Organize seu tempo <br />
            <span className="gradient-text">sem complicações.</span>
          </h1>
          
          <p className="hero-description">
            A ferramenta perfeita para conectar seu WhatsApp ao Google Calendar.
            Agendamentos automáticos, simples e rápidos.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">Começar Agora</button>
            <button className="btn-secondary">Saber mais</button>
          </div>
        </div>
      </main>

    </div>
  );
}

export default App;
