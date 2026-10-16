export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

export const getMonthName = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const generateInstallments = (
  baseTransaction: any,
  totalInstallments: number,
  startDateStr: string
) => {
  const transactions = [];
  const groupId = generateId();
  const [year, month, day] = startDateStr.split('-').map(Number);

  // Limpa propriedades temporárias
  const { isInstallment, installmentsCount, ...cleanBase } = baseTransaction;

  for (let i = 0; i < totalInstallments; i++) {
    const targetDate = new Date(year, month - 1 + i, day);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    transactions.push({
      ...cleanBase,
      id: generateId(),
      date: dateStr,
      createdAt: Date.now() + i,
      installment: {
        groupId,
        current: i + 1,
        total: totalInstallments
      }
    });
  }
  return transactions;
};