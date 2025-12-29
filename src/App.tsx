import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
// As bibliotecas visuais
import { LogOut, Loader2, CheckCircle, Smartphone, Calendar, Bot, AlertTriangle } from 'lucide-react';

// === CONFIGURAÇÃO ===
const API_URL = import.meta.env.VITE_API_URL;

// Conexão Socket
const socket = io(API_URL || '', {
    transports: ['websocket', 'polling'],
    autoConnect: false // Só conecta quando precisar
});

function App() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
   
  // 1. Verifica login ao carregar a página
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      // Limpa a URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 2. Gerencia a conexão com o Socket
  useEffect(() => {
    if (!clientId || !API_URL) return;

    // Conecta e configura eventos
    socket.connect();
    setStatus('Conectando ao servidor...');
    socket.emit('join', clientId);

    socket.on('qr', (qr: string) => { 
        setQrCode(qr); 
        setStatus('Escaneie o QR Code abaixo'); 
    });
    
    socket.on('status', (msg: string) => { 
      if (msg === 'connected') { 
        setStatus('✅ Conectado com Sucesso!'); 
        setQrCode(''); 
      } 
    });

    // Inicia a sessão no backend via HTTP
    axios.post(`${API_URL}/session/start`, { clientId })
        .catch(err => {
            console.error("Erro ao iniciar sessão:", err);
            setStatus('Erro ao conectar com a API.');
        });

    // Limpeza ao desmontar
    return () => { 
        socket.off('qr'); 
        socket.off('status');
        socket.disconnect();
    };
  }, [clientId]);

  // Funções de Ação
  const loginComGoogle = () => {
      if (!API_URL) {
          alert("Erro: API_URL não definida.");
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

  // Ícone do Google Inline
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  // ==========================================================================
  // RENDERIZAÇÃO (COM ESTILOS TAILWIND AGORA!)
  // ==========================================================================

  // TELA 1: LANDING PAGE (Não Logado)
  if (!clientId) {
      return (
          // Fundo escuro, centralizado, com seleção roxa
          <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-purple-500/30 relative overflow-hidden">
              
              {/* Efeitos de Fundo (Luzes desfocadas) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] opacity-40"></div>
              </div>

              {/* Cartão Central de Login */}
              <div className="w-full max-w-md bg-[#18181B] border border-white/5 p-8 rounded-3xl shadow-2xl text-center z-10 relative backdrop-blur-sm">
                  
                  {/* Ícone do Robô no topo */}
                  <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  {/* Título e Subtítulo */}
                  <h1 className="text-3xl font-bold mb-3 tracking-tight">ZapAgendador</h1>
                  <p className="text-slate-400 mb-8 text-sm leading-relaxed px-4">
                    Sua secretária virtual com IA.<br/>
                    Atende no WhatsApp e agenda no Google.
                  </p>
                  
                  {/* Botão de Login do Google Bonito */}
                  <button 
                    onClick={loginComGoogle} 
                    className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/10 active:scale-95"
                  >
                    <GoogleIcon />
                    Entrar com Google
                  </button>

                  {/* Aviso de Erro se faltar API_URL */}
                  {!API_URL && (
                      <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs text-left animate-pulse">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ERRO: VITE_API_URL não configurada!</span>
                      </div>
                  )}
              </div>

              {/* Rodapé */}
              <footer className="absolute bottom-6 w-full text-center text-slate-600 text-xs">
                &copy; 2025 CalendarPlus • Tecnologia Gemini IA
              </footer>
          </div>
      );
  }

  // TELA 2: DASHBOARD (Logado)
  return (
    // Fundo escuro
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Navbar Superior */}
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

      {/* Cartão Principal do Dashboard */}
      <div className="w-full max-w-md bg-[#18181B] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-12">
        
        {/* Identificação do Usuário */}
        <div className="text-center mb-8 border-b border-white/5 pb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Usuário Logado</p>
            <p className="text-sm font-medium text-slate-300 truncate px-4 bg-white/5 py-1 rounded-full inline-block max-w-full">{clientId}</p>
        </div>

        {/* Área Central (Status/QR) */}
        <div className="flex flex-col items-center justify-center min-h-[300px]">
            
            {/* ESTADO: CONECTADO ✅ */}
            {status.includes('✅') ? (
                 <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center">
                     {/* Círculo Verde */}
                     <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30 shadow-lg shadow-green-500/20">
                         <CheckCircle className="w-12 h-12 text-green-500" />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">Sistema Ativo!</h2>
                     <p className="text-slate-400 mb-6 max-w-[250px] text-sm">O robô está conectado ao WhatsApp e pronto para agendar.</p>
                     {/* Badge Online */}
                     <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-mono border border-green-500/20">
                         <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                         </span>
                         Online
                     </div>
                 </div>
            ) : (
                /* ESTADO: AGUARDANDO QR CODE OU CARREGANDO ⏳ */
                <div className="flex flex-col items-center text-center w-full">
                    
                    {qrCode ? (
                        // Mostra QR Code
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col items-center">
                            <h2 className="text-xl font-bold mb-6 text-white">Conecte seu WhatsApp</h2>
                            <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 ring-4 ring-white/10">
                                <QRCodeSVG value={qrCode} size={220} />
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <Smartphone className="w-4 h-4" />
                                <span>Menu {'>'} Aparelhos Conectados</span>
                            </div>
                        </div>
                    ) : (
                        // Mostra Carregando
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
