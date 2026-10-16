import React, { useMemo } from 'react';
import { Transaction, PAYERS } from '../types';
import { formatCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User } from 'lucide-react';

interface PayersViewProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const PayersView: React.FC<PayersViewProps> = ({ transactions }) => {
  const payerStats = useMemo(() => {
    // Logic: "Todos" payer accumulates only transactions explicitly marked as "Todos"
    // Other payers accumulate their specific transactions
    // Only PAID transactions
    return PAYERS.map(payerName => {
      const total = transactions
        .filter(t => t.payer === payerName && t.status === 'paid' && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: payerName, value: total };
    });
  }, [transactions]);

  const chartData = useMemo(() => {
    // Exclude "Todos" from the chart as it might skew the distribution visualization or be a catch-all
    return payerStats.filter(p => p.name !== 'Todos' && p.value > 0);
  }, [payerStats]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Análise por Pagador</h2>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {payerStats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-4">
              <User size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{stat.name}</h3>
            <p className="text-xl font-bold text-brand-600">{formatCurrency(stat.value)}</p>
            <span className="text-xs text-gray-400 mt-1">Total Pago</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Distribuição de Gastos (Exceto "Todos")</h3>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400">
               Sem dados suficientes para o gráfico
             </div>
          )}
        </div>
      </div>
    </div>
  );
};