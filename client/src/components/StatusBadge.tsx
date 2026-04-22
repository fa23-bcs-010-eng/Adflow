const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft:             { label: 'Draft',            className: 'badge-draft' },
  submitted:         { label: 'Submitted',        className: 'badge-submitted' },
  under_review:      { label: 'Under Review',     className: 'badge-review' },
  payment_pending:   { label: 'Payment Pending',  className: 'badge-payment' },
  payment_submitted: { label: 'Payment Sent',     className: 'badge-payment' },
  payment_verified:  { label: 'Payment Verified', className: 'badge-verified' },
  scheduled:         { label: 'Scheduled',        className: 'badge-submitted' },
  published:         { label: 'Published',        className: 'badge-published' },
  expired:           { label: 'Expired',          className: 'badge-expired' },
  archived:          { label: 'Archived',         className: 'badge-draft' },
  open:              { label: 'Open',             className: 'badge-payment' },
  resolved:          { label: 'Resolved',         className: 'badge-verified' },
  dismissed:         { label: 'Dismissed',        className: 'badge-expired' },
  confirmed:         { label: 'Confirmed',        className: 'badge-verified' },
  processing:        { label: 'Processing',       className: 'badge-review' },
  shipped:           { label: 'Shipped',          className: 'badge-submitted' },
  delivered:         { label: 'Delivered',        className: 'badge-published' },
  cancelled:         { label: 'Cancelled',        className: 'badge-expired' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: 'badge-draft' };
  return <span className={s.className}>{s.label}</span>;
}
