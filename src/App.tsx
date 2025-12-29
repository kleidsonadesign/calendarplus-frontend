import './App.css' // Certifique-se de importar o CSS acima

function App() {
  return (
    <div className="login-card">
      
      {/* Ícone ou Logo Principal */}
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🤖
      </div>

      <h1>ZapAgendador</h1>
      
      <p className="subtitle">
        Sua secretária virtual com IA.<br />
        Atende no WhatsApp e agenda no Google.
      </p>

      {/* Botão Google - Substitua o '#' pela sua rota de login */}
      <a href="/auth/google" className="btn-google">
        <img 
          src="https://www.svgrepo.com/show/475656/google-color.svg" 
          alt="Google Logo" 
          style={{ width: '20px', height: '20px' }} 
        />
        Entrar com Google
      </a>

      <div className="footer">
        © 2025 CalendarPlus • Tecnologia Gemini IA
      </div>

    </div>
  )
}

export default App
