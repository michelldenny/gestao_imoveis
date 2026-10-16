import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Property } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Calculator, Sparkles, RefreshCw, Info, TrendingUp, DollarSign, Percent, ShieldAlert } from 'lucide-react';

interface ProfitCalculatorProps {
  transactions: Transaction[];
  properties: Property[];
  currentPropertyId: string;
  onPropertyChange: (id: string) => void;
}

export const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({
  transactions,
  properties,
  currentPropertyId,
  onPropertyChange
}) => {
  const currentProperty = properties.find(p => p.id === currentPropertyId);

  // Input states (as strings to allow easy typing/clearing)
  const [vendaInput, setVendaInput] = useState<string>('');
  const [custoInput, setCustoInput] = useState<string>('');
  const [impostoInput, setImpostoInput] = useState<string>('15'); // default to 15% (IR standard for Capital Gain in Brazil)
  const [corretagemInput, setCorretagemInput] = useState<string>('');
  const [outrasDespesasInput, setOutrasDespesasInput] = useState<string>('');

  // Auto-calculated database values for reference
  const dbStats = useMemo(() => {
    if (!currentPropertyId) return { acquisition: 0, other: 0, hasData: false };
    
    const propTxs = transactions.filter(t => t.propertyId === currentPropertyId && t.status === 'paid');
    
    const acquisition = propTxs
      .filter(t => t.category === 'acquisition')
      .reduce((acc, t) => acc + t.amount, 0);

    const other = propTxs
      .filter(t => t.category !== 'acquisition' && t.category !== 'revenue')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      acquisition,
      other,
      hasData: acquisition > 0 || other > 0
    };
  }, [transactions, currentPropertyId]);

  // Load from database helper
  const handleLoadFromDB = () => {
    setCustoInput(dbStats.acquisition.toString());
    setOutrasDespesasInput(dbStats.other.toString());
  };

  // Convert inputs to numbers
  const venda = parseFloat(vendaInput) || 0;
  const custoAquisicao = parseFloat(custoInput) || 0;
  const impostoAliquota = parseFloat(impostoInput) || 0;
  const corretagem = parseFloat(corretagemInput) || 0;
  const outrasDespesas = parseFloat(outrasDespesasInput) || 0;

  // Real-time calculations
  const lucroBruto = venda - custoAquisicao - corretagem - outrasDespesas;
  
  // Tax is calculated over the capital gain (Lucro Bruto), if positive.
  const impostoValor = lucroBruto > 0 ? lucroBruto * (impostoAliquota / 100) : 0;
  const lucroLiquido = lucroBruto - impostoValor;

  // Percentage breakdown of sale price
  const percents = useMemo(() => {
    if (venda <= 0) return { custo: 0, corretagem: 0, outras: 0, imposto: 0, liquido: 0 };
    return {
      custo: (custoAquisicao / venda) * 100,
      corretagem: (corretagem / venda) * 100,
      outras: (outrasDespesas / venda) * 100,
      imposto: (impostoValor / venda) * 100,
      liquido: (lucroLiquido / venda) * 100
    };
  }, [venda, custoAquisicao, corretagem, outrasDespesas, impostoValor, lucroLiquido]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 text-left flex items-center gap-2">
            <Calculator className="text-brand-600" size={24} />
            Calculadora de Lucro Imobiliário
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-left">
            Simule o Ganho de Capital e o Lucro Líquido Final da venda do seu imóvel.
          </p>
        </div>

        {/* Property Selector */}
        {properties.length > 0 && (
          <div className="relative group w-full md:w-[240px]">
            <select 
              value={currentPropertyId}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm transition-shadow"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="absolute left-3.5 top-3 text-gray-400">🏠</span>
            <span className="text-gray-400 absolute right-3.5 top-3 pointer-events-none text-xs">▼</span>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form Controls */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              Dados da Simulação
            </h3>
            {dbStats.hasData && (
              <button
                onClick={handleLoadFromDB}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-all"
              >
                <Sparkles size={14} />
                Preencher com dados do Imóvel
              </button>
            )}
          </div>

          {/* Quick Stats Banner from active property */}
          {dbStats.hasData && (
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-blue-800">
              <div>
                <p className="font-semibold flex items-center gap-1.5">
                  <Info size={16} className="text-blue-500" />
                  Valores reais registrados para "{currentProperty?.name}":
                </p>
                <ul className="list-disc pl-5 mt-1 text-xs text-blue-700 space-y-0.5">
                  <li>Custo de Aquisição pago: <strong>{formatCurrency(dbStats.acquisition)}</strong></li>
                  <li>Outras despesas/reformas pagas: <strong>{formatCurrency(dbStats.other)}</strong></li>
                </ul>
              </div>
              <button 
                onClick={handleLoadFromDB}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline shrink-0 self-end md:self-center"
              >
                Aplicar valores
              </button>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sale Value */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Valor de Venda (R$)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">R$</span>
                </div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={vendaInput}
                  onChange={(e) => setVendaInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium text-gray-800"
                />
              </div>
              <p className="text-[11px] text-gray-400">Valor bruto estimado da venda.</p>
            </div>

            {/* Acquisition Cost */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Custo de Aquisição (R$)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">R$</span>
                </div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={custoInput}
                  onChange={(e) => setCustoInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium text-gray-800"
                />
              </div>
              <p className="text-[11px] text-gray-400">Valor pago na compra original do imóvel.</p>
            </div>

            {/* Brokerage Fee */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Comissão de Corretagem (R$)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">R$</span>
                </div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={corretagemInput}
                  onChange={(e) => setCorretagemInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium text-gray-800"
                />
              </div>
              {venda > 0 && (
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setCorretagemInput((venda * 0.05).toFixed(0))}
                    className="text-[10px] text-brand-600 hover:underline bg-brand-50 px-1.5 py-0.5 rounded"
                  >
                    Sugerir 5% ({formatCurrency(venda * 0.05)})
                  </button>
                  <button 
                    onClick={() => setCorretagemInput((venda * 0.06).toFixed(0))}
                    className="text-[10px] text-brand-600 hover:underline bg-brand-50 px-1.5 py-0.5 rounded"
                  >
                    Sugerir 6% ({formatCurrency(venda * 0.06)})
                  </button>
                </div>
              )}
              <p className="text-[11px] text-gray-400">Geralmente entre 5% e 6% do valor de venda.</p>
            </div>

            {/* Other Expenses */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Outras Despesas / Reformas (R$)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">R$</span>
                </div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={outrasDespesasInput}
                  onChange={(e) => setOutrasDespesasInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium text-gray-800"
                />
              </div>
              <p className="text-[11px] text-gray-400">Reformas, escrituração, cartório, etc.</p>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Alíquota de Imposto sobre Ganho de Capital (%)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Percent size={14} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="15"
                  value={impostoInput}
                  onChange={(e) => setImpostoInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium text-gray-800"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-gray-400">Padrões de Ganho de Capital PF:</span>
                <button 
                  onClick={() => setImpostoInput('15')}
                  className="text-[10px] text-brand-600 hover:underline bg-brand-50 px-1.5 py-0.5 rounded"
                >
                  15% (Até R$ 5M)
                </button>
                <button 
                  onClick={() => setImpostoInput('17.5')}
                  className="text-[10px] text-brand-600 hover:underline bg-brand-50 px-1.5 py-0.5 rounded"
                >
                  17.5% (R$ 5M a 10M)
                </button>
              </div>
            </div>

          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => {
                setVendaInput('');
                setCustoInput('');
                setImpostoInput('15');
                setCorretagemInput('');
                setOutrasDespesasInput('');
              }}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw size={12} />
              Limpar Campos
            </button>
          </div>
        </div>

        {/* Right Side: Results & Breakdown Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Net Profit Summary Panel */}
          <div className="bg-brand-600 text-white rounded-2xl p-6 md:p-8 shadow-xl shadow-brand-100 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="relative z-10 space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                Lucro Líquido Final
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight">
                {formatCurrency(lucroLiquido)}
              </h2>
              <div className="inline-block mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  lucroLiquido > 0 
                    ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' 
                    : lucroLiquido < 0 
                      ? 'bg-rose-500/20 text-rose-100 border border-rose-500/30'
                      : 'bg-white/10 text-white/80'
                }`}>
                  {lucroLiquido > 0 ? '🟢 Lucro Líquido Positivo' : lucroLiquido < 0 ? '🔴 Prejuízo Líquido' : 'Sem saldo'}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown Inline */}
            <div className="relative z-10 mt-6 pt-4 border-t border-brand-500/30 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-brand-100 font-medium">Ganho de Capital:</p>
                <p className="font-bold text-sm">{formatCurrency(lucroBruto)}</p>
              </div>
              <div>
                <p className="text-brand-100 font-medium">Imposto Devido ({impostoAliquota}%):</p>
                <p className="font-bold text-sm text-amber-200">-{formatCurrency(impostoValor)}</p>
              </div>
            </div>

            {/* Watermark Icon */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none transform rotate-12">
              <TrendingUp size={180} />
            </div>
          </div>

          {/* Detailed Deductions Table Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
              Detalhamento da Simulação
            </h4>

            {/* Progress Visual Distribution Bar */}
            {venda > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Distribuição do Valor de Venda</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(venda)}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  {percents.custo > 0 && (
                    <div 
                      style={{ width: `${percents.custo}%` }} 
                      className="bg-purple-500 h-full" 
                      title={`Custo: ${percents.custo.toFixed(1)}%`}
                    />
                  )}
                  {percents.corretagem > 0 && (
                    <div 
                      style={{ width: `${percents.corretagem}%` }} 
                      className="bg-pink-500 h-full" 
                      title={`Corretagem: ${percents.corretagem.toFixed(1)}%`}
                    />
                  )}
                  {percents.outras > 0 && (
                    <div 
                      style={{ width: `${percents.outras}%` }} 
                      className="bg-orange-500 h-full" 
                      title={`Outras Despesas: ${percents.outras.toFixed(1)}%`}
                    />
                  )}
                  {percents.imposto > 0 && (
                    <div 
                      style={{ width: `${percents.imposto}%` }} 
                      className="bg-rose-500 h-full" 
                      title={`Imposto: ${percents.imposto.toFixed(1)}%`}
                    />
                  )}
                  {percents.liquido > 0 && (
                    <div 
                      style={{ width: `${percents.liquido}%` }} 
                      className="bg-emerald-500 h-full" 
                      title={`Lucro Líquido: ${percents.liquido.toFixed(1)}%`}
                    />
                  )}
                </div>
                {/* Visual Legend */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm inline-block shrink-0" />
                    <span>Custo ({percents.custo.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-sm inline-block shrink-0" />
                    <span>Corretagem ({percents.corretagem.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm inline-block shrink-0" />
                    <span>Despesas ({percents.outras.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block shrink-0" />
                    <span>Imposto ({percents.imposto.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block shrink-0" />
                    <span className="font-medium text-emerald-700">Lucro Líquido ({percents.liquido.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Calculations Rows */}
            <div className="space-y-3 pt-2 text-sm text-gray-600">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>(+) Valor de Venda:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(venda)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>(-) Custo de Compra:</span>
                <span className="text-gray-700 font-medium">-{formatCurrency(custoAquisicao)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>(-) Corretagem / Imobiliária:</span>
                <span className="text-gray-700 font-medium">-{formatCurrency(corretagem)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>(-) Reformas / Outras Despesas:</span>
                <span className="text-gray-700 font-medium">-{formatCurrency(outrasDespesas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50 bg-gray-50/55 px-2.5 rounded-lg font-semibold text-gray-800">
                <span>(=) Ganho de Capital bruto:</span>
                <span className={lucroBruto >= 0 ? 'text-gray-900' : 'text-rose-600'}>
                  {formatCurrency(lucroBruto)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>(-) IR s/ Ganho de Capital ({impostoAliquota}%):</span>
                <span className="text-rose-600 font-medium">-{formatCurrency(impostoValor)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-emerald-50/30 px-2.5 rounded-lg font-bold text-gray-900">
                <span className="text-emerald-800">(=) Lucro Líquido Final:</span>
                <span className={lucroLiquido >= 0 ? 'text-emerald-700 text-base' : 'text-rose-600 text-base'}>
                  {formatCurrency(lucroLiquido)}
                </span>
              </div>
            </div>

            {/* Note on deductibles */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-800 mt-2">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Importante:</strong> De acordo com as regras da Receita Federal (GCAP), a comissão de corretagem e as reformas estruturais/benfeitorias realizadas no imóvel são dedutíveis do imposto de renda sobre o ganho de capital, desde que devidamente comprovadas por notas fiscais e recibos.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
