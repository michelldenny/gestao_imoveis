import React, { useMemo } from 'react';
import { Transaction, CATEGORY_LABELS, CATEGORY_COLORS, Property } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { TrendingUp, Home, Hammer, Calendar, MoreHorizontal, Download, SlidersHorizontal, Plus, LayoutDashboard, Trash2, Database } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  properties: Property[];
  currentPropertyId: string;
  onPropertyChange: (id: string) => void;
  onAddProperty: () => void;
  onEditProperty: () => void;
  onDeleteProperty: () => void;
  onExportPDF: () => void;
  onAddTransaction: () => void;
  onOpenPaidDetails: (category: string | 'total') => void;
  onExportJSONBackup: () => void;
  onExportCSVBackup: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  properties, 
  currentPropertyId, 
  onPropertyChange,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onExportPDF,
  onAddTransaction,
  onOpenPaidDetails,
  onExportJSONBackup,
  onExportCSVBackup
}) => {
  const currentProperty = properties.find(p => p.id === currentPropertyId);

  // Filter transactions by current property for stats
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.propertyId === currentPropertyId);
  }, [transactions, currentPropertyId]);

  const stats = useMemo(() => {
    const paidRevenue = filteredTransactions
      .filter(t => t.type === 'revenue' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const paidExpense = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingBalance = filteredTransactions
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + (t.type === 'expense' ? -t.amount : t.amount), 0);

    const totalBalance = paidRevenue - paidExpense;

    return { totalBalance, pendingBalance };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    // Only paid expenses by category for the chart
    const grouped = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped).map(([key, value]) => ({
      name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
      value: value as number,
      key
    })).filter(item => item.value > 0);
  }, [filteredTransactions]);

  const getCategoryStats = (category: string) => {
    const paid = filteredTransactions
      .filter(t => t.category === category && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
    const pending = filteredTransactions
      .filter(t => t.category === category && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);
    return { paid, pending };
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'revenue': return <TrendingUp size={20} />;
      case 'acquisition': return <Home size={20} />;
      case 'renovation': return <Hammer size={20} />;
      case 'monthly': return <Calendar size={20} />;
      default: return <MoreHorizontal size={20} />;
    }
  };

  const categoryList = ['revenue', 'acquisition', 'renovation', 'monthly', 'other'];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-left">
          Visão Geral
        </h1>

        {/* Right Side Group: Property Select + Icons */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          
          {/* Property Selector */}
          <div className="relative group w-full md:w-[220px]">
            <select 
              value={currentPropertyId}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm transition-shadow"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="new_property_action" className="font-bold text-brand-600">+ Adicionar Imóvel</option>
            </select>
            <Home size={16} className="text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <span className="text-gray-400 absolute right-3.5 top-3 pointer-events-none text-xs">▼</span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
             <div className="flex gap-2 flex-1 md:flex-none">
              <button 
                onClick={onEditProperty}
                title="Editar imóvel"
                className="flex-1 md:flex-none flex justify-center items-center h-[42px] w-[42px] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
              >
                <SlidersHorizontal size={18} />
              </button>
              {currentPropertyId && (
                <button 
                  onClick={onDeleteProperty}
                  title="Excluir imóvel"
                  className="flex-1 md:flex-none flex justify-center items-center h-[42px] w-[42px] bg-white border border-gray-200 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={onExportPDF}
                title="Exportar PDF"
                className="flex-1 md:flex-none flex justify-center items-center h-[42px] w-[42px] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
              >
                <Download size={18} />
              </button>
            </div>
            
            <button 
              onClick={onAddTransaction}
              className="h-[42px] w-[42px] bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-md shadow-brand-100 transition-all active:scale-95 flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Card - Green */}
      <button 
        onClick={() => onOpenPaidDetails('total')}
        className="w-full text-left bg-brand-600 rounded-2xl p-8 text-white shadow-xl shadow-brand-100 relative overflow-hidden group transition-transform hover:scale-[1.005] min-h-[160px] flex flex-col justify-center"
      >
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">
            SALDO GERAL (PAGO)
          </p>
          <h2 className="text-5xl font-bold mb-3 tracking-tight">
            {formatCurrency(stats.totalBalance)}
          </h2>
          <div className="inline-flex items-center gap-2 bg-brand-700/30 px-3 py-1.5 rounded-lg border border-brand-500/30">
             <LayoutDashboard size={14} className="text-brand-100" />
             <p className="text-brand-50 text-xs font-medium">
               Pendente: {formatCurrency(stats.pendingBalance)}
             </p>
          </div>
        </div>
        {/* Watermark Icon */}
        <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.15] pointer-events-none transform rotate-0">
           <LayoutDashboard size={200} />
        </div>
      </button>

      {/* Summary Cards Row - Side by Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categoryList.map(cat => {
          const { paid, pending } = getCategoryStats(cat);
          const color = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
          
          return (
            <button 
              key={cat}
              onClick={() => onOpenPaidDetails(cat)}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all text-left group relative overflow-hidden flex flex-col justify-between h-[180px]"
              style={{ borderTop: `4px solid ${color}` }}
            >
              {/* Header: Icon + Title */}
              <div className="flex items-center gap-3 z-10">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${color}15`, color: color }}
                >
                  {getCategoryIcon(cat)}
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate">
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                </span>
              </div>
              
              {/* Main Value */}
              <div className="z-10 mt-2">
                <p className="text-2xl font-bold text-gray-900 tracking-tight truncate">
                  {formatCurrency(paid)}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Valor Pago</p>
              </div>

              {/* Dashed Divider & Pending Value */}
              <div className="z-10 mt-auto border-t border-dashed border-gray-100 pt-3 flex items-center justify-between w-full">
                <span className="text-xs text-gray-400">A pagar:</span>
                <span className={`text-xs font-semibold ${pending > 0 ? 'text-gray-600' : 'text-gray-300'}`}>
                   {formatCurrency(pending)}
                </span>
              </div>

               {/* Watermark Icon */}
              <div 
                className="absolute right-[-20px] top-[20px] opacity-[0.03] pointer-events-none transform -rotate-12 scale-[2.5]"
                style={{ color: color }}
              >
                {getCategoryIcon(cat)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 h-[450px]">
        <div className="flex items-center gap-2 mb-6">
           <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
             <BarChartIcon size={20} />
           </div>
           <h3 className="font-bold text-lg text-gray-800">Despesas Pagas</h3>
        </div>
        <div className="h-[350px] w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #f3f4f6', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                   {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.key as keyof typeof CATEGORY_COLORS]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <div className="p-4 bg-gray-50 rounded-full">
                <TrendingUp size={24} className="text-gray-300" />
              </div>
              <p>Nenhuma despesa paga neste período</p>
            </div>
          )}
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 text-left">Backup da Base de Dados</h3>
              <p className="text-sm text-gray-500 text-left">Exporte todos os imóveis e transações salvos no Firebase.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExportJSONBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-100 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Download size={16} />
              Exportar JSON
            </button>
            <button
              onClick={onExportCSVBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal icon for the chart header
const BarChartIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);