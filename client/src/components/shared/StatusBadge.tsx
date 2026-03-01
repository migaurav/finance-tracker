interface Props {
  status: string;
}

const palette: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNPAID: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${palette[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
