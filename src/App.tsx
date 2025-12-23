import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

// === CONFIGURAÇÃO DO SERVIDOR ===
// Pega a URL definida no painel da Vercel (Environment Variables)
const API_URL = import.meta.env.VITE_API_URL;

// Segurança: Avisa no console se esquecer de configurar
if (!API_URL) {
    console.error("ERRO CRÍTICO: VITE_API_URL não encontrada! O Frontend não conseguirá falar com o Backend.");
}

// Inicia o Socket apontando para o Render
// O 'transports' força o uso de WebSocket para evitar erros de CORS em alguns casos
const socket = io(API_URL || '', {
    transports: ['websocket', 'polling'] 
});

function App() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
  
  // 1. Verifica se o usuário voltou do login do Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
    }
  }, []);

  // 2. Ouve os eventos do WebSocket (CORREÇÃO DE TYPESCRIPT AQUI)
  useEffect(() => {
    // Adicionamos ": string" para o TypeScript parar de reclamar
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

  // Função para acordar o backend
  const iniciarSistema = async (emailId: string) => {
      if (!API_URL) return;

      setStatus('Conectando ao servidor...');
      socket.emit('join', emailId);

      try {
        await axios.post(`${API_URL}/session/start`, { clientId: emailId });
      } catch (error) {
        console.error("Erro ao conectar:", error);
        setStatus('Erro ao conectar com a API. Verifique se o Backend está rodando.');
      }
  };

  // Redireciona para o Google
  const loginComGoogle = () => {
      if (!API_URL) {
          alert("Erro de configuração: URL da API não definida.");
          return;
      }
      window.location.href = `${API_URL}/auth/google`;
  };

  // Botão de Sair
  const handleLogout = async () => {
    if (!clientId || !API_URL) return;
    
    if (confirm("Deseja realmente desconectar e sair?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            // Limpa a URL e recarrega
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar desconectar.");
        }
    }
  };

  // --- TELA 1: LOGIN ---
  if (!clientId) {
      return (
          <div style={styles.container}>
              <h1 style={styles.title}>🤖 ZapAgendador</h1>
              <p>Automação de agendamentos com IA</p>
              
              <button onClick={loginComGoogle} style={styles.googleButton}>
                <span style={{fontWeight: 'bold'}}>G</span> Entrar com Google Agenda
              </button>

              {!API_URL && (
                  <p style={{color: 'red', marginTop: '20px'}}>
                      ⚠️ ERRO: Configure a variável VITE_API_URL na Vercel!
                  </p>
              )}
          </div>
      );
  }

  // --- TELA 2: DASHBOARD ---
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Painel de Controle</h1>
      <p style={{marginBottom: '20px', color: '#666'}}>Usuário: <strong>{clientId}</strong></p>

      <div style={styles.card}>
        {status.includes('✅') ? (
             <div style={{ color: 'green', textAlign: 'center' }}>
                 <h2 style={{fontSize: '24px'}}>{status}</h2>
                 <p>O robô está ativo e respondendo mensagens.</p>
             </div>
        ) : (
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>{status}</p>
                
                {qrCode ? (
                    <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                        <QRCodeSVG value={qrCode} size={250} />
                    </div>
                ) : (
                    <div style={{marginTop: '20px'}}>⏳ Aguardando QR Code...</div>
                )}
            </div>
        )}

        <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button onClick={handleLogout} style={styles.logoutButton}>
                Desconectar / Sair
            </button>
        </div>
      </div>
    </div>
  );
}

// Estilos rápidos (CSS-in-JS)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f2f5',
        color: '#333'
    },
    title: {
        marginBottom: '10px',
        color: '#1a1a1a'
    },
    googleButton: {
        marginTop: '20px',
        backgroundColor: '#4285F4', 
        color: 'white', 
        padding: '12px 24px', 
        fontSize: '16px', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    card: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '450px',
        textAlign: 'center'
    },
    logoutButton: {
        backgroundColor: 'transparent',
        color: '#d32f2f',
        border: '1px solid #d32f2f',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    }
};

export default App;