import type { CreditCardBill, EMI, MonthlyResponse, Receivable } from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Monthly
export const getMonthly = (month: string) =>
  request<MonthlyResponse>(`/monthly?month=${month}`);

export const updateClosingBalance = (id: number, closing_balance: number) =>
  request<{ id: number; closing_balance: number }>(`/monthly/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ closing_balance }),
  });

// Cards
export const addCard = (data: Omit<CreditCardBill, 'id'>) =>
  request<CreditCardBill>('/cards', { method: 'POST', body: JSON.stringify(data) });

export const updateCard = (id: number, data: Partial<CreditCardBill>) =>
  request<CreditCardBill>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCard = (id: number) =>
  request<{ success: boolean }>(`/cards/${id}`, { method: 'DELETE' });

// EMIs
export const getEmis = () => request<EMI[]>('/emis');

export const addEmi = (data: Omit<EMI, 'id' | 'status'>) =>
  request<EMI>('/emis', { method: 'POST', body: JSON.stringify(data) });

export const updateEmi = (id: number, data: Partial<EMI>) =>
  request<EMI>(`/emis/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const payEmi = (id: number) =>
  request<EMI>(`/emis/${id}/pay`, { method: 'POST' });

// Receivables
export const getReceivables = () => request<Receivable[]>('/receivables');

export const addReceivable = (data: Omit<Receivable, 'id' | 'status' | 'received_date'>) =>
  request<Receivable>('/receivables', { method: 'POST', body: JSON.stringify(data) });

export const updateReceivable = (id: number, data: Partial<Receivable>) =>
  request<Receivable>(`/receivables/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const markReceived = (id: number, received_date?: string) =>
  request<Receivable>(`/receivables/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ received_date }),
  });

// CSV Export utility
export function exportCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Indian currency formatting
export const inr = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
