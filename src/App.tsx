import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { LogOut, Loader2, CheckCircle, Smartphone, Calendar } from 'lucide-react';
import LandingPage from './components/LandingPage'; // <--- IMPORTANTE: O componente bonito

// === CONFIGURAÇÃO ===
// Tenta pegar do .env, se não tiver, usa a string direta (segurança para não quebrar)
const API_URL = import.meta.env.VITE_API_URL || "https://calendarplus-backend.onrender.com";

const socket = io(API_URL, {
  transports: ['websocket', 'polling'] 
});

function App() {
  const [clientId, setClientId] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('conectando'); // conectando, aguardando_qr, conectado
  const [statusText, setStatusText] = useState('Iniciando sistema...');

  // 1. Verifica se voltou do login do Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('clientId');

    if (idFromUrl) {
      setClientId(idFromUrl);
      iniciarSistema(idFromUrl);
      // Limpa a URL para ficar bonita
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 2. Ouve eventos do Socket
  useEffect(() => {
    socket.on('qr', (qr) => { 
        setQrCode(qr); 
        setStatus('aguardando_qr');
        setStatusText('Escaneie o QR Code abaixo'); 
    });
    
    socket.on('status', (msg) => { 
      if (msg === 'connected') { 
        setStatus('conectado'); 
        setStatusText('WhatsApp Conectado!'); 
        setQrCode(''); 
      } 
    });

    return () => { 
        socket.off('qr'); 
        socket.off('status');
    };
  }, []);

  const iniciarSistema = async (emailId) => {
      setStatusText('Acordando o servidor...');
      socket.emit('join', emailId);

      try {
        await axios.post(`${API_URL}/session/start`, { clientId: emailId });
      } catch (error) {
        console.error("Erro ao conectar:", error);
        setStatusText('Erro ao conectar com API.');
      }
  };

  const handleLogout = async () => {
    if (!clientId) return;
    
    if (confirm("Tem certeza que deseja desconectar?")) {
        try {
            await axios.post(`${API_URL}/session/logout`, { clientId });
            setClientId(null);
            setQrCode('');
            setStatus('conectando');
        } catch (error) {
            alert("Erro ao sair.");
        }
    }
  };

  // =================================================================
  // LÓGICA DE EXIBIÇÃO
  // =================================================================

  // CENÁRIO 1: NÃO LOGADO -> MOSTRA A LANDING PAGE BONITA
  if (!clientId) {
      return <LandingPage />;
  }

  // CENÁRIO 2: LOGADO -> MOSTRA O DASHBOARD (Agora estilizado com Tailwind)
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* Navbar simplificada do Dashboard */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center bg-[#0A0A0B]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 opacity-80">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="font-bold">CalendarPlus</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">{clientId}</span>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
            >
                <LogOut size={16} /> Sair
            </button>
        </div>
      </nav>

      {/* Cartão Central */}
      <div className="w-full max-w-md bg-[#18181B] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Efeito de fundo no card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col items-center text-center min-h-[350px] justify-center">
            
            {/* ESTADO: CONECTADO ✅ */}
            {status === 'conectado' && (
                <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Sistema Ativo</h2>
                    <p className="text-slate-400 mb-6">Sua secretária virtual está respondendo mensagens.</p>
                    <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-mono border border-green-500/20">
                        Status: Online
                    </div>
                </div>
            )}

            {/* ESTADO: MOSTRANDO QR CODE 📷 */}
            {status === 'aguardando_qr' && qrCode && (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold mb-6 text-white">Conecte seu WhatsApp</h2>
                    <div className="bg-white p-3 rounded-xl shadow-lg mb-6">
                        <QRCodeSVG value={qrCode} size={220} />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Smartphone className="w-4 h-4" />
                        <span>Abra o WhatsApp {'>'} Aparelhos Conectados</span>
                    </div>
                </div>
            )}

            {/* ESTADO: CARREGANDO / CONECTANDO ⏳ */}
            {(status === 'conectando' || (status === 'aguardando_qr' && !qrCode)) && (
                <div className="flex flex-col items-center text-slate-400">
                    <Loader2 size={48} className="animate-spin text-purple-500 mb-6" />
                    <h3 className="text-white font-medium text-lg mb-2">{statusText}</h3>
                    <p className="text-sm">Isso pode levar até 1 minuto...</p>
                </div>
            )}
        </div>
      </div>

      <footer className="mt-8 text-slate-600 text-xs">
        &copy; 2025 CalendarPlus • Painel de Controle
      </footer>
    </div>
  );
}

export default App;
