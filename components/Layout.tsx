import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  TrendingUp, 
  Home, 
  Hammer, 
  CalendarRange, 
  MoreHorizontal,
  Calculator
} from 'lucide-react';
import { ViewName } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  isOffline: boolean;
}

const NavItem = ({ 
  icon: Icon, 
  active, 
  onClick,
  title
}: { 
  icon: any, 
  active: boolean, 
  onClick: () => void,
  title: string
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group relative mb-3 ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
        : 'text-gray-400 hover:text-brand-600 hover:bg-gray-50'
    }`}
  >
    <Icon size={20} strokeWidth={2} />
  </button>
);

const MobileNavItem = ({ 
  icon: Icon, 
  active, 
  onClick,
  title
}: { 
  icon: any, 
  active: boolean, 
  onClick: () => void,
  title: string
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center min-w-[70px] p-2 space-y-1 ${
      active ? 'text-brand-600' : 'text-gray-400'
    }`}
  >
    <div className={`p-1.5 rounded-lg ${active ? 'bg-brand-50' : 'bg-transparent'}`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className="text-[10px] font-medium truncate max-w-full">{title}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isOffline }) => {
  return (
    // Use 100dvh for better mobile browser support (dynamic viewport height)
    <div className="flex h-[100dvh] bg-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 bg-white border-r border-gray-100 h-full items-center py-8 z-20">
        
        {/* Navigation Centered Vertically */}
        <nav className="flex-1 flex flex-col justify-center w-full items-center">
          <NavItem 
            icon={LayoutDashboard} 
            active={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard')}
            title="Dashboard"
          />
          <NavItem 
            icon={Calendar} 
            active={activeView === 'calendar'} 
            onClick={() => onNavigate('calendar')}
            title="Calendário"
          />
          <NavItem 
            icon={Users} 
            active={activeView === 'payers'} 
            onClick={() => onNavigate('payers')}
            title="Pagadores"
          />
          <NavItem 
            icon={Calculator} 
            active={activeView === 'calculator'} 
            onClick={() => onNavigate('calculator')}
            title="Calculadora"
          />
          
          <div className="w-8 h-px bg-gray-100 my-4"></div>

          <NavItem 
            icon={TrendingUp} 
            active={activeView === 'transactions_revenue'} 
            onClick={() => onNavigate('transactions_revenue')}
            title="Receitas"
          />
          <NavItem 
            icon={Home} 
            active={activeView === 'transactions_acquisition'} 
            onClick={() => onNavigate('transactions_acquisition')}
            title="Aquisição"
          />
          <NavItem 
            icon={Hammer} 
            active={activeView === 'transactions_renovation'} 
            onClick={() => onNavigate('transactions_renovation')}
            title="Reforma"
          />
          <NavItem 
            icon={CalendarRange} 
            active={activeView === 'transactions_monthly'} 
            onClick={() => onNavigate('transactions_monthly')}
            title="Mensais"
          />
          <NavItem 
            icon={MoreHorizontal} 
            active={activeView === 'transactions_other'} 
            onClick={() => onNavigate('transactions_other')}
            title="Outros"
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-[80px] md:pb-0 relative bg-white">
        {children}
      </main>

      {/* Mobile Bottom Nav - Scrollable & Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center overflow-x-auto hide-scrollbar px-2 py-1 gap-1">
          <MobileNavItem 
            icon={LayoutDashboard} 
            active={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard')}
            title="Geral"
          />
          <MobileNavItem 
            icon={Calendar} 
            active={activeView === 'calendar'} 
            onClick={() => onNavigate('calendar')}
            title="Calendário"
          />
          <MobileNavItem 
            icon={TrendingUp} 
            active={activeView === 'transactions_revenue'} 
            onClick={() => onNavigate('transactions_revenue')}
            title="Receitas"
          />
          <MobileNavItem 
            icon={CalendarRange} 
            active={activeView === 'transactions_monthly'} 
            onClick={() => onNavigate('transactions_monthly')}
            title="Mensais"
          />
          <MobileNavItem 
            icon={Home} 
            active={activeView === 'transactions_acquisition'} 
            onClick={() => onNavigate('transactions_acquisition')}
            title="Aquisição"
          />
          <MobileNavItem 
            icon={Hammer} 
            active={activeView === 'transactions_renovation'} 
            onClick={() => onNavigate('transactions_renovation')}
            title="Reforma"
          />
           <MobileNavItem 
            icon={MoreHorizontal} 
            active={activeView === 'transactions_other'} 
            onClick={() => onNavigate('transactions_other')}
            title="Outros"
          />
          <MobileNavItem 
            icon={Users} 
            active={activeView === 'payers'} 
            onClick={() => onNavigate('payers')}
            title="Pagadores"
          />
          <MobileNavItem 
            icon={Calculator} 
            active={activeView === 'calculator'} 
            onClick={() => onNavigate('calculator')}
            title="Calculadora"
          />
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};