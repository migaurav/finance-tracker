export interface MonthlyTally {
  id: number;
  month: string;
  closing_balance: number;
}

export interface CreditCardBill {
  id: number;
  month_id: number;
  card_name: string;
  amount: number;
  due_date: string | null;
  status: 'PAID' | 'UNPAID';
}

export interface EMI {
  id: number;
  name: string;
  total_amount: number;
  monthly_amount: number;
  start_date: string;
  tenure_months: number;
  remaining_months: number;
  status: 'ACTIVE' | 'CLOSED';
}

export interface Receivable {
  id: number;
  person_name: string;
  amount: number;
  date_given: string;
  expected_return_date: string | null;
  received_date: string | null;
  status: 'PENDING' | 'RECEIVED';
}

export interface MonthlySummary {
  totalCards: number;
  totalEmiMonthly: number;
  totalReceivables: number;
  netBalance: number;
}

export interface MonthlyResponse {
  tally: MonthlyTally;
  cards: CreditCardBill[];
  receivables: Receivable[];
  emis: EMI[];
  summary: MonthlySummary;
}

export type TabId = 'monthly' | 'emis' | 'investments';
