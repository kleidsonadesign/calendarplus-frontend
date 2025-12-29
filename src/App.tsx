import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './App.css'; // Importando o design

// === CONFIGURAÇÃO DO SERVIDOR ===
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("ERRO CRÍTICO: VITE_API_URL não encontrada!");
}

const socket = io(API_URL || '', {
  transports: ['websocket', 'polling'] 
});

function App() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
   
  // 1. Verifica login do Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
    }
  }, []);

  // 2. Ouve eventos do WebSocket
  useEffect(() => {
    socket.on('qr', (qr: string) => { 
        setQrCode(qr); 
        setStatus('Escaneie o QR Code abaixo:'); 
    });
     
    socket.on('status', (msg: string) => { 
      if (msg === 'connected') { 
        setStatus('✅ Conectado com Sucesso!'); 
        setQrCode(''); 
      } 
    });

    return () => { 
        socket.off('qr'); 
        socket.off('status');
    };
  }, []);

  const iniciarSistema = async (emailId: string) => {
      if (!API_URL) return;
      setStatus('Conectando ao servidor...');
      socket.emit('join', emailId);
      try {
        await axios.post(`${API_URL}/session/start`, { clientId: emailId });
      } catch (error) {
        console.error("Erro ao conectar:", error);
        setStatus('Erro ao conectar com a API.');
      }
  };

  const loginComGoogle = () => {
      if (!API_URL) {
          alert("Erro de configuração: URL da API não definida.");
          return;
      }
      window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    if (!clientId || !API_URL) return;
    if (confirm("Deseja realmente desconectar e sair?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar desconectar.");
        }
    }
  };

  // --- RENDERIZAÇÃO ---

  return (
    <div className="app-container">
      
      {/* TELA DE LOGIN */}
      {!clientId ? (
        <div className="card login-card">
          <div className="card-header">
            <img src="/Calendar.png" alt="Logo" className="app-logo" />
            <h1 className="title">Calendario +</h1>
            <p className="subtitle">Automação de agendamentos com IA</p>
          </div>

          <button onClick={loginComGoogle} className="google-btn">
            {/* Ícone do Google SVG */}
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            <span>Entrar com Google Agenda</span>
          </button>

          {!API_URL && (
            <div className="error-box">
               ⚠️ ERRO: VITE_API_URL não configurada!
            </div>
          )}
        </div>

      ) : (

        /* TELA DE DASHBOARD / QR CODE */
        <div className="card dashboard-card">
          <div className="card-header">
            <h1 className="title">Painel de Controle</h1>
            <div className="user-badge">
              <span className="user-label">Usuário:</span>
              <span className="user-email">{clientId}</span>
            </div>
          </div>

          <div className="status-area">
            {status.includes('✅') ? (
              <div className="status-success">
                <div className="icon-success">✔</div>
                <h2>Conectado!</h2>
                <p>O robô está ativo e respondendo.</p>
              </div>
            ) : (
              <div className="qr-section">
                <p className="status-text">{status}</p>
                
                <div className="qr-frame">
                  {qrCode ? (
                    <QRCodeSVG value={qrCode} size={220} />
                  ) : (
                    <div className="loading-spinner"></div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Sair / Desconectar
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
