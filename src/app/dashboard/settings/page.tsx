import { Settings, Sparkles, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
        <h2 className="text-3xl font-serif text-white mb-8 flex items-center gap-3">
          <Settings className="text-amber-400" /> Ajustes do Studio • Noah Ferreira
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h3 className="text-xl font-medium text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#DFBA73]"/> Serviços & Regras da Equipe</h3>
             <p className="text-gray-300 text-sm">Serviços e combos oficiais do Noah Barber Studio com tabela de preços atualizada e repasse oficial (55% Noah Ferreira Dono · 45% Adrian Santos Funcionário).</p>
             <button className="px-6 py-3 bg-white/10 text-white rounded-lg opacity-50 cursor-not-allowed font-mono text-xs uppercase tracking-wider">Tabela & Comissões 100% Ativas</button>
          </div>
          <div className="space-y-4">
             <h3 className="text-xl font-medium text-white flex items-center gap-2"><Bell className="w-5 h-5 text-amber-400"/> Notificações e Horários</h3>
             <p className="text-gray-300 text-sm">Horário oficial: Segunda a Sábado das 09:00 às 20:00 (Fechado aos Domingos). Localização: Av. Paulo Pereira Gomes, 281 - Loja 9, Morada de Laranjeiras, Serra - ES.</p>
             <button className="px-6 py-3 bg-white/10 text-white rounded-lg opacity-50 cursor-not-allowed font-mono text-xs uppercase tracking-wider">09:00 às 20:00 Configurado</button>
          </div>
        </div>
      </div>
    </div>
  );
}
