import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

// === CONFIGURAÇÃO DE PRODUÇÃO ===
// Tenta pegar a URL definida na Vercel
const API_URL = import.meta.env.VITE_API_URL;

// Se não tiver configurado na Vercel, lançamos um erro no console para facilitar o debug
if (!API_URL) {
    console.error("ERRO CRÍTICO: VITE_API_URL não está definida! O Frontend não sabe onde está o Backend.");
}

// Conecta ao Socket usando a URL segura
const socket = io(API_URL);

function App() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');
    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
    }
  }, []);

  useEffect(() => {
    socket.on('qr', (qr) => { setQrCode(qr); setStatus('Escaneie o QR Code'); });
    socket.on('status', (msg) => { if (msg === 'connected') { setStatus('✅ Conectado!'); setQrCode(''); } });
    return () => { socket.off('qr'); socket.off('status'); };
  }, []);

  const iniciarSistema = async (emailId: string) => {
      setStatus('Conectando ao servidor...');
      socket.emit('join', emailId);
      try {
        await axios.post(`${API_URL}/session/start`, { clientId: emailId });
      } catch (error) {
        console.error("Erro", error);
        setStatus('Erro ao conectar com a API.');
      }
  };

  const loginComGoogle = () => {
      // Redireciona para o backend na URL de Produção
      window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    if (!clientId) return;
    if (confirm("Desconectar?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            window.location.href = '/';
        } catch (error) { alert("Erro ao desconectar"); }
    }
  };

  // TELA 1: LOGIN
  if (!clientId) {
      return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
              <h1>🤖 ZapAgendador</h1>
              <button onClick={loginComGoogle} style={{ padding: '15px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '5px' }}>
                Entrar com Google
              </button>
          </div>
      );
  }

  // TELA 2: DASHBOARD
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <h1>Painel</h1>
      <p>Usuário: {clientId}</p>
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px', textAlign: 'center' }}>
        {status.includes('✅') ? <h2 style={{color: 'green'}}>{status}</h2> : 
        (<>
            <h3>{status}</h3>
            {qrCode && <QRCodeSVG value={qrCode} size={250} />}
        </>)}
        
        <br/><br/>
        <button onClick={handleLogout} style={{ color: 'red', cursor: 'pointer' }}>Sair</button>
      </div>
    </div>
  );
}

export default App;