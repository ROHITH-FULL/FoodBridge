import React from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'AVAILABLE':
      return <span className="badge badge-available"><CheckCircle2 size={12} /> Available</span>;
    case 'CLAIMED':
      return <span className="badge badge-accepted"><Clock size={12} /> Claimed</span>;
    case 'REQUESTED':
      return <span className="badge badge-requested"><Clock size={12} /> Requested</span>;
    case 'ACCEPTED':
      return <span className="badge badge-accepted"><CheckCircle2 size={12} /> Accepted</span>;
    case 'PICKUP_SCHEDULED':
      return <span className="badge badge-pickup"><Truck size={12} /> Pickup Scheduled</span>;
    case 'COLLECTED':
      return <span className="badge badge-collected"><PackageCheck size={12} /> Collected</span>;
    case 'HANDED_OVER':
    case 'COMPLETED':
      return <span className="badge badge-handed_over"><PackageCheck size={12} /> Handed Over</span>;
    case 'CANCELLED':
      return <span className="badge badge-cancelled"><XCircle size={12} /> Cancelled</span>;
    case 'REJECTED':
      return <span className="badge badge-rejected"><AlertCircle size={12} /> Rejected</span>;
    case 'VERIFIED':
      return <span className="badge badge-verified"><ShieldCheck size={12} /> Verified</span>;
    case 'PENDING':
      return <span className="badge badge-pending"><Clock size={12} /> Pending Review</span>;
    case 'ELIGIBLE':
      return <span className="badge badge-available"><CheckCircle2 size={12} /> Safety Eligible</span>;
    case 'FLAGGED':
      return <span className="badge badge-requested"><AlertCircle size={12} /> Safety Flagged</span>;
    default:
      return <span className="badge badge-cancelled">{status}</span>;
  }
}
