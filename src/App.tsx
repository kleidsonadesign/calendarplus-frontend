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
  
  // Estados para o horário de funcionamento
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [isSaving, setIsSaving] = useState(false);

  // Estados para o Interruptor da IA
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(true);
  const [isTogglingAi, setIsTogglingAi] = useState<boolean>(false);
   
  // 1. Verifica login do Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
      fetchHours(idFromUrl);
      fetchAiStatus(idFromUrl);
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

  // BUSCAR STATUS DA IA
  const fetchAiStatus = async (id: string) => {
      if (!API_URL) return;
      try {
          const response = await axios.get(`${API_URL}/api/settings/ai-status/${id}`);
          if (response.data && response.data.isAiEnabled !== undefined) {
              setIsAiEnabled(response.data.isAiEnabled);
          }
      } catch (error) {
          console.error("Erro ao buscar status da IA:", error);
      }
  };

  // ALTERAR STATUS DA IA
  const handleToggleAi = async () => {
      if (!clientId || !API_URL) return;
      
      setIsTogglingAi(true);
      const newValue = !isAiEnabled;
      
      setIsAiEnabled(newValue);

      try {
          await axios.post(`${API_URL}/api/settings/ai-status`, {
              clientId,
              isAiEnabled: newValue
          });
      } catch (error) {
          console.error("Erro ao alterar status da IA:", error);
          alert("Erro ao alterar o status da Inteligência Artificial.");
          setIsAiEnabled(!newValue);
      } finally {
          setIsTogglingAi(false);
      }
  };

  // BUSCAR HORÁRIOS SALVOS
  const fetchHours = async (id: string) => {
      if (!API_URL) return;
      try {
          const response = await axios.get(`${API_URL}/session/${id}/hours`);
          if (response.data && response.data.operatingHours) {
              setStartTime(response.data.operatingHours.start || '08:00');
              setEndTime(response.data.operatingHours.end || '18:00');
          }
      } catch (error) {
          console.error("Erro ao buscar horários:", error);
      }
  };

  // SALVAR HORÁRIOS
  const saveHours = async () => {
      if (!clientId || !API_URL) return;
      setIsSaving(true);
      try {
          await axios.post(`${API_URL}/session/hours`, {
              clientId,
              startTime,
              endTime
          });
          alert("Horário guardado com sucesso!");
      } catch (error) {
          console.error("Erro ao guardar horários:", error);
          alert("Erro ao guardar horário.");
      } finally {
          setIsSaving(false);
      }
  };

  // Sair apenas do WhatsApp
  const handleLogoutWhatsApp = async () => {
    if (!clientId || !API_URL) return;

    if (confirm("Deseja desconectar o seu telemóvel? Terá de ler o QR Code novamente para reativar o robô.")) {
        try {
            setStatus('A desconectar e a gerar novo QR Code...');
            setQrCode('');
            await axios.post(`${API_URL}/session/whatsapp/logout`, { clientId });
        } catch (error) {
            alert("Erro ao tentar desconectar o WhatsApp.");
        }
    }
  };

  // Sair da conta Google (Logout total)
  const handleLogoutGoogle = async () => {
    if (!clientId || !API_URL) return;

    if (confirm("Aviso: Isto irá remover a sua Conta Google do sistema e desativar o robô. Deseja continuar?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar sair da conta Google.");
        }
    }
  };

  // --- ESTILOS CSS INJETADOS ---
  const styles = `
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; }
    
    .app-wrapper { display: flex; justify-content: center; min-height: 100vh; padding: 40px 20px; box-sizing: border-box; }
    
    /* Layout Login */
    .login-container { display: flex; justify-content: center; align-items: center; width: 100%; }
    
    /* Layout Dashboard - 3 Colunas */
    .dashboard-layout { display: grid; grid-template-columns: 320px 480px 320px; gap: 30px; justify-content: center; align-items: start; width: 100%; max-width: 1250px; }
    
    /* Responsive Dashboard */
    @media (max-width: 1200px) {
      .dashboard-layout { grid-template-columns: 1fr; max-width: 500px; }
    }

    .card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; box-sizing: border-box; }
    .login-card { width: 100%; max-width: 450px; padding: 40px 30px; }
    .main-card { padding: 40px 30px; min-height: 600px; display: flex; flex-direction: column; }
    
    /* Side Cards (Esquerda e Direita) */
    .side-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); margin-bottom: 20px; text-align: left; border: 1px solid #e9edef; }
    
    /* Imagens de Logo */
    .app-logo { max-width: 200px; height: auto; margin: 0 auto; display: block; }
    .app-logo-login { max-width: 240px; height: auto; margin: 0 auto 10px auto; display: block; }
    .developer-footer { margin-top: auto; padding-top: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .dev-logo { max-width: 110px; height: auto; opacity: 0.6; transition: opacity 0.3s ease; }
    .dev-logo:hover { opacity: 1; }
    .dev-text { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }

    .title { margin: 0 0 10px 0; font-size: 24px; color: #111b21; font-weight: 700; }
    .subtitle { margin: 0 0 30px 0; color: #54656f; font-size: 15px; }
    
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 12px; border: 1px solid #dadce0; border-radius: 8px; background: white; color: #3c4043; font-size: 16px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
    .google-btn:hover { background-color: #f8f9fa; }
    
    .user-badge-card { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 15px; border-radius: 8px; background-color: white; border: 1px solid #e9edef; font-size: 14px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    .user-label { color: #5f6368; font-weight: 500;}
    .user-email { color: #1a73e8; font-weight: 600; }

    /* ESTILOS DA SEÇÃO DO INTERRUPTOR DA IA */
    .toggle-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .toggle-info { flex: 1; padding-right: 15px; }
    .toggle-title { font-size: 14px; font-weight: 600; color: #111b21; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px; }
    .toggle-desc { font-size: 12px; color: #54656f; margin: 0; line-height: 1.4; }
    
    /* CSS DO BOTÃO SWITCH */
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    input:checked + .slider { background-color: #25D366; }
    input:checked + .slider:before { transform: translateX(20px); }
    input:disabled + .slider { opacity: 0.6; cursor: not-allowed; }

    .hours-title { font-size: 14px; font-weight: 600; color: #111b21; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; }
    .hours-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 15px; }
    .hour-input-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .hour-input-group label { font-size: 12px; color: #54656f; }
    .hour-input-group input { padding: 10px; border: 1px solid #dadce0; border-radius: 8px; font-family: inherit; font-size: 13px; color: #111b21; }
    .save-hours-btn { background-color: #1a73e8; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: background-color 0.2s; font-size: 14px; }
    .save-hours-btn:hover { background-color: #1557b0; }
    .save-hours-btn:disabled { background-color: #a8c7fa; cursor: not-allowed; }

    .logout-google-btn { width: 100%; background-color: #fce8e6; color: #d93025; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; margin-bottom: 15px; }
    .logout-google-btn:hover { background-color: #fad2cf; }
    
    .logout-wa-btn { width: 100%; background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
    .logout-wa-btn:hover { background-color: #ffe8a1; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="app-wrapper">
        {!clientId ? (
          <div className="login-container">
            <div className="card login-card">
              <div className="card-header">
                {/* LOGO NA TELA DE LOGIN TAMBÉM */}
                <img src="/calendarplus.png" alt="Calendar Plus" className="app-logo-login" />
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
            </div>
          </div>
        ) : (
          <div className="dashboard-layout">
            
            {/* COLUNA ESQUERDA */}
            <div className="left-column">
              <div className="side-card">
                <div className="toggle-section">
                  <div className="toggle-info">
                    <h3 className="toggle-title"> Atendimento Automático (IA)</h3>
                    <p className="toggle-desc">
                      {isAiEnabled 
                        ? 'A IA está ativada e responderá às mensagens.' 
                        : 'A IA está em pausa e não responderá.'}
                    </p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isAiEnabled} 
                      onChange={handleToggleAi} 
                      disabled={isTogglingAi}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="side-card">
                <h3 className="hours-title"> Horário de Atendimento da IA</h3>
                <div className="hours-controls">
                  <div className="hour-input-group">
                    <label>Das</label>
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                    />
                  </div>
                  <div className="hour-input-group">
                    <label>Até às</label>
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                    />
                  </div>
                </div>
                <button 
                  className="save-hours-btn" 
                  onClick={saveHours}
                  disabled={isSaving}
                >
                  {isSaving ? 'A guardar...' : 'Guardar Horário'}
                </button>
              </div>
            </div>

            {/* COLUNA CENTRAL */}
            <div className="center-column">
              <div className="card main-card">
                <div className="card-header" style={{ marginBottom: '30px' }}>
                  {/* LOGO NO LUGAR DO NOME "PAINEL DE CONTROLO" */}
                  <img src="/calendar.png" alt="Calendar Plus Dashboard" className="app-logo" />
                </div>

                <div className="status-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {status.includes('✅') ? (
                    <div className="status-success" style={{ marginTop: '50px' }}>
                      <div className="icon-success" style={{ fontSize: '64px', color: '#25D366', marginBottom: '20px' }}>✔</div>
                      <h2 style={{ color: '#111b21', margin: '0 0 10px 0' }}>Conectado!</h2>
                      <p style={{ color: '#54656f', fontSize: '15px' }}>O robô está ativo e pronto para agendar automaticamente.</p>
                    </div>
                  ) : (
                    <div className="qr-section" style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center', width: '100%' }}>
                      <div className="instructions-box" style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #25D366', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ marginTop: 0, color: '#111b21', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                          📱 Como ligar o seu WhatsApp
                        </h3>
                        <ol style={{ paddingLeft: '20px', margin: '15px 0 0 0', color: '#3b4a54', lineHeight: '1.8', fontSize: '13px' }}>
                          <li>Abra o WhatsApp no seu telemóvel</li>
                          <li>Toque em <strong>Mais opções (⋮)</strong> ou <strong>Configurações (⚙️)</strong></li>
                          <li>Selecione <strong>Aparelhos conectados</strong></li>
                          <li>Toque no botão verde <strong>Ligar um aparelho</strong></li>
                          <li>Aponte a câmara do telemóvel para o código abaixo</li>
                        </ol>
                      </div>
                      
                      <p className="status-text" style={{ fontWeight: '600', color: '#54656f', fontSize: '15px', margin: '0' }}>
                        {status}
                      </p>
                      
                      <div className="qr-frame" style={{ padding: '15px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '240px', minWidth: '240px', border: '1px solid #e9edef' }}>
                        {qrCode ? (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCode)}`} alt="QR Code WhatsApp" style={{ width: '240px', height: '240px', display: 'block' }} />
                        ) : (
                          <div className="loading-spinner" style={{ color: '#888', fontWeight: '500', fontSize: '14px' }}>
                            A gerar código de acesso...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* LOGO DA DESENVOLVEDORA NO RODAPÉ */}
                <div className="developer-footer">
                  <span className="dev-text">Desenvolvido por</span>
                  <img src="/korven.png" alt="Korven Lab" className="dev-logo" />
                </div>

              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="right-column">
              <div className="user-badge-card">
                <span className="user-label">Utilizador:</span>
                <span className="user-email">{clientId}</span>
              </div>
              
              <button onClick={handleLogoutGoogle} className="logout-google-btn" title="Remove a conta do sistema na íntegra">
                Sair do Google
              </button>

              {status.includes('✅') && (
                <button onClick={handleLogoutWhatsApp} className="logout-wa-btn" title="Desconecta apenas o telemóvel para poder ler um novo QR Code">
                  Sair do WhatsApp
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}

export default App;
