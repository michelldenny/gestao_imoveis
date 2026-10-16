import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Edit2, Trash2, User } from 'lucide-react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onToggleStatus: (t: Transaction) => void;
}

const SwipeableTransactionItem = ({ 
  t, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: { 
  t: Transaction, 
  onEdit: (t: Transaction) => void, 
  onDelete: (t: Transaction, skipConfirmation?: boolean) => void, 
  onToggleStatus: (t: Transaction) => void 
}) => {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // If swiped left enough (e.g. -50px), snap to open state (-80px)
    if (info.offset.x < -50) {
      setIsOpen(true);
      controls.start({ x: -80 });
    } else {
      setIsOpen(false);
      controls.start({ x: 0 });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Pass true to skip confirmation dialog
    onDelete(t, true);
    setIsOpen(false);
    controls.start({ x: 0 });
  };

  return (
    <div className="relative overflow-hidden mb-2 rounded-xl">
      {/* Background Layer (Delete Action) */}
      <div 
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl cursor-pointer"
        onClick={handleDeleteClick}
      >
        <Trash2 className="text-white" size={24} />
      </div>

      {/* Foreground Layer (Card) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center z-10"
        style={{ touchAction: 'pan-y' }} // Allow vertical scrolling
        onClick={() => {
          if (!isDragging) {
            if (isOpen) {
              // If open, close it
              setIsOpen(false);
              controls.start({ x: 0 });
            } else {
              // If closed, edit
              onEdit(t);
            }
          }
        }}
      >
        {/* Left Side: Description and Date */}
        <div className="flex flex-col justify-center space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 text-[15px]">
              {t.description}
            </span>
            {t.installment && (
              <span className="text-gray-500 font-medium text-[15px]">
                ({t.installment.current}/{t.installment.total})
              </span>
            )}
          </div>
          <span className="text-gray-400 text-sm font-medium">
            {formatDate(t.date)}
          </span>
        </div>

        {/* Right Side: Amount, Payer, Status, Actions */}
        <div className="flex flex-col items-end justify-center space-y-1.5">
          <span className={`text-[15px] font-bold ${t.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-400">
              <User size={12} strokeWidth={2.5} />
              <span className="text-xs font-medium text-gray-500">{t.payer}</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(t);
              }}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
                t.status === 'paid' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
            </button>

            {/* Desktop Delete Button (Visible on larger screens, hidden on mobile where swipe is used) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t, false); // Desktop still uses confirmation
              }}
              className="hidden md:flex p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onEdit, 
  onDelete,
  onToggleStatus
}) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 pb-24 md:pb-0">
      {transactions.map((t) => (
        <SwipeableTransactionItem
          key={t.id}
          t={t}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
};