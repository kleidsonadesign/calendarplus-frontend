import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { LogOut, Loader2, CheckCircle, Smartphone, Calendar, Bot, AlertTriangle, Menu, X } from 'lucide-react';

// === CONFIGURAÇÃO DO SERVIDOR ===
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    console.error("ERRO CRÍTICO: VITE_API_URL não encontrada!");
}

const socket = io(API_URL || '', {
    transports: ['websocket', 'polling'] 
});

function App() {
  // Estados
  const [clientId, setClientId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('Carregando...');
   
  // 1. Verifica se voltou do login do Google ao carregar a página
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
      // Limpa a URL para ficar bonita (remove ?clientId=...)
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 2. Ouve eventos do WebSocket (Socket.io)
  useEffect(() => {
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

    return () => { 
        socket.off('qr'); 
        socket.off('status');
    };
  }, []);

  // Função para acordar o backend e iniciar sessão
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

  // Redireciona para o Google
  const loginComGoogle = () => {
      if (!API_URL) {
          alert("Erro de configuração: URL da API não definida.");
          return;
      }
      window.location.href = `${API_URL}/auth/google`;
  };

  // Função de Logout
  const handleLogout = async () => {
    if (!clientId || !API_URL) return;
    
    if (confirm("Deseja realmente desconectar e sair?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            // Recarrega a página para limpar tudo
            window.location.href = '/';
        } catch (error) {
            alert("Erro ao tentar desconectar.");
        }
    }
  };

  // Ícone do Google (SVG Inline para não precisar de arquivo extra)
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  // ==========================================================================
  // RENDERIZAÇÃO
  // ==========================================================================

  // CENÁRIO 1: USUÁRIO NÃO LOGADO (Mostra a Landing Page / Login)
  if (!clientId) {
      return (
          <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
              
              {/* Navbar Transparente */}
              <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-600/20 p-2 rounded-lg backdrop-blur-md border border-purple-500/10">
                        <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">CalendarPlus</span>
                </div>
                <button onClick={loginComGoogle} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Fazer Login
                </button>
              </nav>

              {/* Background Effects */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen"></div>
                <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen"></div>
              </div>

              {/* Hero Section (Login) */}
              <div className="container mx-auto px-4 min-h-screen flex flex-col justify-center items-center relative z-10 pt-20">
                  
                  <div className="text-center max-w-3xl mx-auto space-y-8">
                      
                      {/* Badge IA */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        IA Gemini 1.5 Flash Integrada
                      </div>

                      {/* Título */}
                      <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
                        Sua agenda lotada,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                           sem atender o celular.
                        </span>
                      </h1>

                      {/* Subtítulo */}
                      <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                        A secretária virtual que atende seus clientes no WhatsApp 24h por dia e agenda diretamente no Google Calendar.
                      </p>

                      {/* Botão de Login Grande */}
                      <div className="flex flex-col items-center gap-4 pt-4">
                        <button 
                            onClick={loginComGoogle} 
                            className="group relative bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-3 shadow-xl shadow-purple-500/10 hover:scale-[1.02] active:scale-95"
                        >
                            <GoogleIcon />
                            <span>Continuar com Google</span>
                        </button>
                        <p className="text-xs text-slate-500">Teste grátis. Não requer cartão de crédito.</p>
                      </div>

                      {/* Erro de Configuração (Só aparece se faltar ENV) */}
                      {!API_URL && (
                          <div className="mt-8 mx-auto max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                              <AlertTriangle className="w-5 h-5 shrink-0" />
                              <span>ERRO: Variável <strong>VITE_API_URL</strong> não configurada na Vercel!</span>
                          </div>
                      )}
                  </div>
              </div>

              <footer className="absolute bottom-6 w-full text-center text-slate-600 text-xs">
                &copy; 2025 CalendarPlus • Tecnologia Google AI
              </footer>
          </div>
      );
  }

  // CENÁRIO 2: USUÁRIO LOGADO (Mostra o Dashboard / QR Code)
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Navbar Dashboard */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center bg-[#0A0A0B]/90 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="font-bold tracking-tight">Painel de Controle</span>
        </div>
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium border border-red-500/20 px-4 py-1.5 rounded-full hover:bg-red-500/10"
        >
            <LogOut size={14} /> Sair
        </button>
      </nav>

      {/* Cartão Central */}
      <div className="w-full max-w-md bg-[#18181B] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-12">
        
        {/* Header do Cartão */}
        <div className="text-center mb-8 border-b border-white/5 pb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Usuário Logado</p>
            <p className="text-sm font-medium text-slate-300 truncate px-4">{clientId}</p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[300px]">
            
            {/* ESTADO: CONECTADO ✅ */}
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
                /* ESTADO: AGUARDANDO QR CODE OU CARREGANDO ⏳ */
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
