import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

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
  const [status, setStatus] = useState('A carregar...');
   
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
        setStatus('A aguardar leitura do QR Code...'); 
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
      setStatus('A conectar ao servidor e a gerar QR Code...');
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

  // FUNÇÃO: Sair apenas do WhatsApp
  const handleLogoutWhatsApp = async () => {
    if (!clientId || !API_URL) return;
    if (confirm("Deseja desconectar o seu telemóvel? Terá de ler o QR Code novamente para reativar o robô.")) {
        try {
            // Atualiza a interface imediatamente para informar o utilizador
            setStatus('A desconectar e a gerar novo QR Code...');
            setQrCode('');
            
            await axios.post(`${API_URL}/session/whatsapp/logout`, { clientId });
        } catch (error) {
            alert("Erro ao tentar desconectar o WhatsApp.");
        }
    }
  };

  // FUNÇÃO: Sair da conta Google (Logout total)
  const handleLogoutGoogle = async () => {
    if (!clientId || !API_URL) return;
    if (confirm("Aviso: Isto irá remover a sua Conta Google do sistema e desativar o robô. Deseja continuar?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            // Redireciona para o início e limpa o painel
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar sair da conta Google.");
        }
    }
  };

  // --- ESTILOS CSS INJETADOS ---
  const styles = `
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; }
    .app-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .card { background: white; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); width: 100%; max-width: 450px; padding: 40px 30px; text-align: center; box-sizing: border-box; }
    .title { margin: 0 0 10px 0; font-size: 24px; color: #111b21; }
    .subtitle { margin: 0 0 30px 0; color: #54656f; font-size: 15px; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 12px; border: 1px solid #dadce0; border-radius: 8px; background: white; color: #3c4043; font-size: 16px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
    .google-btn:hover { background-color: #f8f9fa; }
    .error-box { margin-top: 20px; padding: 15px; background-color: #fce8e6; color: #d93025; border-radius: 8px; font-size: 14px; }
    .user-badge { display: inline-block; background-color: #e8f0fe; padding: 8px 16px; border-radius: 20px; margin-bottom: 25px; font-size: 14px; }
    .user-label { color: #5f6368; }
    .user-email { color: #1a73e8; font-weight: 600; margin-left: 5px; }
    .button-group { display: flex; gap: 10px; margin-top: 25px; width: 100%; }
    .logout-wa-btn { flex: 1; background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
    .logout-wa-btn:hover { background-color: #ffe8a1; }
    .logout-google-btn { flex: 1; background-color: #fce8e6; color: #d93025; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
    .logout-google-btn:hover { background-color: #fad2cf; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        {!clientId ? (
          <div className="card login-card">
            <div className="card-header">
              <div style={{ fontSize: '64px', marginBottom: '10px' }}>📅</div>
              <h1 className="title">Calendario +</h1>
              <p className="subtitle">Automação de agendamentos com IA</p>
            </div>

            <button onClick={loginComGoogle} className="google-btn">
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
          <div className="card dashboard-card">
            <div className="card-header">
              <h1 className="title">Painel de Controlo</h1>
              <div className="user-badge">
                <span className="user-label">Utilizador:</span>
                <span className="user-email">{clientId}</span>
              </div>
            </div>

            <div className="status-area">
              {status.includes('✅') ? (
                <div className="status-success">
                  <div className="icon-success" style={{ fontSize: '56px', color: '#25D366', marginBottom: '15px' }}>✔</div>
                  <h2 style={{ color: '#111b21', margin: '0 0 10px 0' }}>Conectado!</h2>
                  <p style={{ color: '#54656f', fontSize: '15px' }}>O robô está ativo e pronto para agendar automaticamente.</p>
                </div>
              ) : (
                <div className="qr-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                  <div className="instructions-box" style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #25D366', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                    <h3 style={{ marginTop: 0, color: '#111b21', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                      📱 Como ligar o seu WhatsApp
                    </h3>
                    <ol style={{ paddingLeft: '24px', margin: '15px 0 0 0', color: '#3b4a54', lineHeight: '1.8', fontSize: '14px' }}>
                      <li>Abra o WhatsApp no seu telemóvel</li>
                      <li>Toque em <strong>Mais opções (⋮)</strong> ou <strong>Configurações (⚙️)</strong></li>
                      <li>Selecione <strong>Aparelhos conectados</strong></li>
                      <li>Toque no botão verde <strong>Ligar um aparelho</strong></li>
                      <li>Aponte a câmara do telemóvel para o código abaixo</li>
                    </ol>
                  </div>
                  
                  <p className="status-text" style={{ fontWeight: '600', color: '#54656f', fontSize: '16px', margin: '10px 0' }}>
                    {status}
                  </p>
                  
                  <div className="qr-frame" style={{ padding: '15px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px', minWidth: '220px', border: '1px solid #e9edef' }}>
                    {qrCode ? (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`} alt="QR Code WhatsApp" style={{ width: '220px', height: '220px', display: 'block' }} />
                    ) : (
                      <div className="loading-spinner" style={{ color: '#888', fontWeight: '500', fontSize: '14px' }}>
                        A gerar código de acesso...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="button-group">
              <button onClick={handleLogoutWhatsApp} className="logout-wa-btn" title="Desconecta apenas o telemóvel para poder ler um novo QR Code">
                Sair do WhatsApp
              </button>
              <button onClick={handleLogoutGoogle} className="logout-google-btn" title="Remove a conta do sistema na íntegra">
                Sair do Google
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
