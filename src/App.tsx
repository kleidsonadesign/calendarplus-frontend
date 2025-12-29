import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { LogOut, Loader2, CheckCircle, Smartphone, Calendar, Bot, AlertTriangle } from 'lucide-react';

// === CONFIGURAÇÃO DO SERVIDOR ===
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    console.error("ERRO CRÍTICO: VITE_API_URL não encontrada!");
}

const socket = io(API_URL || '', {
    transports: ['websocket', 'polling'] 
});

function App() {
  // CORREÇÃO DE TYPE: Define que clientId pode ser string ou nulo
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
   
  // 1. Verifica login ao carregar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
      // Limpa a URL visualmente
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 2. Ouve eventos do Socket
  useEffect(() => {
    // CORREÇÃO DE TYPE: Adicionado (qr: string)
    socket.on('qr', (qr: string) => { 
        setQrCode(qr); 
        setStatus('Escaneie o QR Code abaixo'); 
    });
    
    // CORREÇÃO DE TYPE: Adicionado (msg: string)
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

  // CORREÇÃO DE TYPE: Adicionado (emailId: string)
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
            // Força recarregamento para limpar estados
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar desconectar.");
        }
    }
  };

  // Ícone do Google (SVG Inline)
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  // ==========================================================================
  // TELA 1: LOGIN (LANDING PAGE INTEGRADA)
  // ==========================================================================
  if (!clientId) {
      return (
          <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-purple-500/30 overflow-hidden relative">
              
              {/* Efeitos de Fundo */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] opacity-40"></div>
              </div>

              <div className="w-full max-w-md bg-[#18181B] border border-white/5 p-8 rounded-3xl shadow-2xl text-center z-10">
                  <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">ZapAgendador</h1>
                  <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    Sua secretária virtual com IA.<br/>
                    Atende no WhatsApp e agenda no Google.
                  </p>
                  
                  <button 
                    onClick={loginComGoogle} 
                    className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/10"
                  >
                    <GoogleIcon />
                    Entrar com Google
                  </button>

                  {!API_URL && (
                      <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs text-left">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ERRO: Configure VITE_API_URL na Vercel!</span>
                      </div>
                  )}
              </div>

              <footer className="mt-12 text-slate-600 text-xs">
                &copy; 2025 CalendarPlus • Tecnologia Gemini IA
              </footer>
          </div>
      );
  }

  // ==========================================================================
  // TELA 2: DASHBOARD (ESTILIZADA)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center bg-[#0A0A0B]/90 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="font-bold tracking-tight">Painel de Controle</span>
        </div>
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/10"
        >
            <LogOut size={14} /> Sair
        </button>
      </nav>

      {/* Cartão Principal */}
      <div className="w-full max-w-md bg-[#18181B] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-10">
        
        {/* Header do Cartão */}
        <div className="text-center mb-8 border-b border-white/5 pb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Usuário Logado</p>
            <p className="text-sm font-medium text-slate-300 truncate px-4">{clientId}</p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[300px]">
            {/* CENÁRIO: CONECTADO ✅ */}
            {status.includes('✅') ? (
                 <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center">
                     <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
                         <CheckCircle className="w-12 h-12 text-green-500" />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">Sistema Ativo!</h2>
                     <p className="text-slate-400 mb-6 max-w-[250px] text-sm">O robô está conectado ao WhatsApp e pronto para agendar.</p>
                     <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-mono border border-green-500/20">
                         <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                         </span>
                         Online
                     </div>
                 </div>
            ) : (
                /* CENÁRIO: QR CODE OU CARREGANDO */
                <div className="flex flex-col items-center text-center w-full">
                    
                    {qrCode ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-6 text-white">Conecte seu WhatsApp</h2>
                            <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
                                <QRCodeSVG value={qrCode} size={220} />
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <Smartphone className="w-4 h-4" />
                                <span>Menu {'>'} Aparelhos Conectados</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 py-10">
                            <Loader2 size={48} className="animate-spin text-purple-500 mb-6" />
                            <h3 className="text-white font-medium text-lg mb-2">{status}</h3>
                            <p className="text-xs text-slate-500">Aguardando resposta do servidor...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      <p className="mt-8 text-slate-600 text-xs text-center">
          &copy; 2025 CalendarPlus System
      </p>
    </div>
  );
}

export default App;
