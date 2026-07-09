export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  const getClasses = () => {
    switch (normalized) {
      case 'posted':
      case 'active':
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
      case 'written_off':
      case 'closed':
      case 'failed':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getClasses()}`}>
      {status}
    </span>
  );
}
