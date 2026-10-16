import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { PayersView } from './components/PayersView';
import { CalendarView } from './components/CalendarView';
import { ProfitCalculator } from './components/ProfitCalculator';
import { StorageService } from './services/storage';
import { Transaction, ViewName, Property, CATEGORY_LABELS } from './types';
import { Plus, Filter, X, Calendar, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { generateInstallments, formatCurrency, formatDate } from './utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string>('');
  
  // Filter/Sort State
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalTitle, setDetailsModalTitle] = useState('');
  const [detailsTransactions, setDetailsTransactions] = useState<Transaction[]>([]);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const txs = await StorageService.getTransactions();
      const props = await StorageService.getProperties();
      // Sort by date desc
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setProperties(props);
      if (props.length > 0) {
        setCurrentPropertyId(props[0].id);
      }
    };
    loadData();
  }, []);

  // CRUD Operations
  const handleCreateTransaction = async (data: any) => {
    try {
      if (data.isInstallment) {
        const installments = generateInstallments(data, data.installmentsCount, data.date);
        await StorageService.addTransactionsBatch(installments);
        const newTxs = await StorageService.getTransactions();
        setTransactions(newTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        await StorageService.addTransaction(data);
        setTransactions(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      if (data.propertyId && data.propertyId !== currentPropertyId) {
        setCurrentPropertyId(data.propertyId);
      }
    } catch (error) {
      console.error('Erro ao gravar transação:', error);
      throw error;
    }
  };

  const handleUpdateTransaction = async (data: any) => {
    try {
      await StorageService.updateTransaction(data);
      setTransactions(prev => prev.map(t => t.id === data.id ? data : t));
      setEditingTransaction(null);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (t: Transaction, skipConfirmation = false) => {
    const confirmMsg = t.installment 
      ? `Esta transação faz parte de um grupo de ${t.installment.total} parcelas. Deseja excluir TODAS as parcelas?`
      : "Tem certeza que deseja excluir esta transação?";
    
    if (skipConfirmation || window.confirm(confirmMsg)) {
      if (t.installment) {
        await StorageService.deleteBatchByGroupId(t.installment.groupId);
        setTransactions(prev => prev.filter(tx => tx.installment?.groupId !== t.installment?.groupId));
      } else {
        await StorageService.deleteTransaction(t.id);
        setTransactions(prev => prev.filter(tx => tx.id !== t.id));
      }
    }
  };

  const handleToggleStatus = async (t: Transaction) => {
    const newStatus = t.status === 'paid' ? 'pending' : 'paid';
    const updated = { ...t, status: newStatus };
    await handleUpdateTransaction(updated);
    
    // Also update in details modal if open
    if (detailsModalOpen) {
      setDetailsTransactions(prev => prev.map(pt => pt.id === t.id ? updated : pt));
    }
  };

  const handleAddProperty = async () => {
    const name = window.prompt("Nome do novo imóvel:");
    if (name) {
      const newProp = await StorageService.addProperty(name);
      setProperties(prev => [...prev, newProp]);
      setCurrentPropertyId(newProp.id);
    }
  };

  const handlePropertyChange = (value: string) => {
    if (value === 'new_property_action') {
      handleAddProperty();
    } else {
      setCurrentPropertyId(value);
    }
  };

  const handleEditProperty = async () => {
    const currentProp = properties.find(p => p.id === currentPropertyId);
    if (!currentProp) return;

    const newName = window.prompt("Editar nome do imóvel:", currentProp.name);
    if (newName && newName !== currentProp.name) {
      await StorageService.updateProperty(currentProp.id, newName);
      setProperties(prev => prev.map(p => p.id === currentProp.id ? { ...p, name: newName } : p));
    }
  };

  const handleDeleteProperty = async () => {
    const currentProp = properties.find(p => p.id === currentPropertyId);
    if (!currentProp) return;

    const confirmMsg = `ATENÇÃO: Tem certeza que deseja excluir o imóvel "${currentProp.name}"?\nEsta ação é irreversível e excluirá PERMANENTEMENTE todas as transações associadas a este imóvel.`;
    if (window.confirm(confirmMsg)) {
      await StorageService.deleteProperty(currentPropertyId);
      
      const updatedProperties = properties.filter(p => p.id !== currentPropertyId);
      setProperties(updatedProperties);
      setTransactions(prev => prev.filter(t => t.propertyId !== currentPropertyId));
      
      if (updatedProperties.length > 0) {
        setCurrentPropertyId(updatedProperties[0].id);
      } else {
        setCurrentPropertyId('');
      }
    }
  };

  const handleExportJSONBackup = () => {
    const backupData = {
      properties,
      transactions,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gestao_apes_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSVBackup = () => {
    const headers = ['ID Imovel', 'Nome Imovel', 'Data', 'Descricao', 'Categoria', 'Pagador', 'Tipo', 'Status', 'Valor (R$)'];
    const propertyMap = new Map(properties.map(p => [p.id, p.name]));
    
    const csvRows = transactions.map(t => {
      const propName = propertyMap.get(t.propertyId) || 'Imovel Desconhecido';
      return [
        t.propertyId,
        `"${propName.replace(/"/g, '""')}"`,
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        CATEGORY_LABELS[t.category] || t.category,
        t.payer,
        t.type === 'revenue' ? 'Receita' : 'Despesa',
        t.status === 'paid' ? 'Pago' : 'Pendente',
        t.amount
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `gestao_apes_backup_transacoes_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportPDF = () => {
    const currentProp = properties.find(p => p.id === currentPropertyId);
    if (!currentProp) return;

    const doc = new jsPDF();
    const propName = currentProp.name;
    const dateStr = new Date().toLocaleDateString('pt-BR');

    // Filter transactions for this property
    const reportData = transactions
      .filter(t => t.propertyId === currentPropertyId)
      .map(t => [
        formatDate(t.date),
        t.description + (t.installment ? ` (${t.installment.current}/${t.installment.total})` : ''),
        CATEGORY_LABELS[t.category],
        t.payer,
        t.status === 'paid' ? 'Pago' : 'Pendente',
        t.type === 'expense' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`
      ]);

    doc.setFontSize(18);
    doc.text(`Relatório Financeiro - ${propName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${dateStr}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Descrição', 'Categoria', 'Pagador', 'Status', 'Valor']],
      body: reportData,
      headStyles: { fillColor: [0, 156, 107] }, // Brand green
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio_${propName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`);
  };

  const handleOpenPaidDetails = (category: string | 'total') => {
    let filtered = transactions.filter(t => t.propertyId === currentPropertyId && t.status === 'paid');
    
    if (category === 'total') {
      setDetailsModalTitle('Extrato Realizado (Geral)');
    } else {
      filtered = filtered.filter(t => t.category === category);
      setDetailsModalTitle(`Detalhes: ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}`);
    }

    setDetailsTransactions(filtered);
    setDetailsModalOpen(true);
  };

  // View Filtering Logic
  const getDisplayedTransactions = () => {
    let filtered = transactions;
    
    // Always filter by property for transaction lists (unless looking at aggregations which do it internally)
    // But for the main list view, we should probably stick to current property
    if (currentPropertyId) {
      filtered = filtered.filter(t => t.propertyId === currentPropertyId);
    }

    if (activeView === 'transactions_revenue') filtered = filtered.filter(t => t.type === 'revenue');
    else if (activeView === 'transactions_acquisition') filtered = filtered.filter(t => t.category === 'acquisition');
    else if (activeView === 'transactions_renovation') filtered = filtered.filter(t => t.category === 'renovation');
    else if (activeView === 'transactions_monthly') filtered = filtered.filter(t => t.category === 'monthly');
    else if (activeView === 'transactions_other') filtered = filtered.filter(t => t.category === 'other');
    
    // Apply Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'transactions_revenue': return 'Receitas';
      case 'transactions_acquisition': return 'Despesas de Aquisição';
      case 'transactions_renovation': return 'Despesas de Reforma';
      case 'transactions_monthly': return 'Despesas Mensais';
      case 'transactions_other': return 'Outras Despesas';
      default: return 'Todas as Transações';
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView} isOffline={true}>
      
      {/* Main Views */}
      {activeView === 'dashboard' && (
        <Dashboard 
          transactions={transactions} 
          properties={properties}
          currentPropertyId={currentPropertyId}
          onPropertyChange={handlePropertyChange}
          onAddProperty={handleAddProperty}
          onEditProperty={handleEditProperty}
          onDeleteProperty={handleDeleteProperty}
          onExportPDF={handleExportPDF}
          onAddTransaction={() => setIsFormOpen(true)}
          onOpenPaidDetails={handleOpenPaidDetails}
          onExportJSONBackup={handleExportJSONBackup}
          onExportCSVBackup={handleExportCSVBackup}
        />
      )}

      {activeView.startsWith('transactions') && (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {properties.find(p => p.id === currentPropertyId)?.name}
              </p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
               <button
                 onClick={() => {
                   if (sortBy === 'date') {
                     setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                   } else {
                     setSortBy('date');
                     setSortOrder('desc');
                   }
                 }}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                   sortBy === 'date' 
                     ? 'bg-white text-gray-900 shadow-sm' 
                     : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 <Calendar size={14} />
                 Data
                 {sortBy === 'date' && (
                   sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                 )}
               </button>
               
               <button
                 onClick={() => {
                   if (sortBy === 'amount') {
                     setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                   } else {
                     setSortBy('amount');
                     setSortOrder('desc');
                   }
                 }}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                   sortBy === 'amount' 
                     ? 'bg-white text-gray-900 shadow-sm' 
                     : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 <DollarSign size={14} />
                 Valor
                 {sortBy === 'amount' && (
                   sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                 )}
               </button>
             </div>
          </div>
          <button
            onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 flex items-center justify-center gap-2 mb-4 md:hidden"
          >
            <Plus size={20} />
            Nova Transação
          </button>
          <TransactionList 
            transactions={getDisplayedTransactions()} 
            onEdit={(t) => { setEditingTransaction(t); setIsFormOpen(true); }}
            onDelete={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      )}

      {activeView === 'calendar' && (
        <CalendarView 
          transactions={transactions.filter(t => t.propertyId === currentPropertyId)}
          onDayClick={(date, txs) => {
            setDetailsModalTitle(`Transações do dia ${date.split('-').reverse().join('/')}`);
            setDetailsTransactions(txs);
            setDetailsModalOpen(true);
          }}
        />
      )}

      {activeView === 'payers' && (
        <PayersView transactions={transactions.filter(t => t.propertyId === currentPropertyId)} />
      )}

      {activeView === 'calculator' && (
        <ProfitCalculator 
          transactions={transactions}
          properties={properties}
          currentPropertyId={currentPropertyId}
          onPropertyChange={handlePropertyChange}
        />
      )}

      {/* Transaction Modal */}
      <TransactionForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        editingTransaction={editingTransaction}
        properties={properties}
        currentPropertyId={currentPropertyId}
      />

      {/* Details Modal (Reusable for Day Click and Dashboard Cards) */}
      {detailsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50">
              <h3 className="font-bold text-xl text-gray-800">{detailsModalTitle}</h3>
              <button 
                onClick={() => setDetailsModalOpen(false)} 
                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-2 bg-white">
              <TransactionList 
                transactions={detailsTransactions}
                onEdit={(t) => { setDetailsModalOpen(false); setEditingTransaction(t); setIsFormOpen(true); }}
                onDelete={(t) => { setDetailsModalOpen(false); handleDeleteTransaction(t); }}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;