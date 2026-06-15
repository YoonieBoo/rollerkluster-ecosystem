import { Crown, Medal, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RankBadgeIcon } from '@/components/rank-badge';

export function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString();
}

export function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2);
}

export function tierLabel(tier?: string) {
  if (!tier) return 'Bronze';
  if (tier === 'TopPerformer') return 'Platinum';
  if (tier === 'Gold') return 'Gold';
  if (tier === 'Silver2') return 'Silver';
  if (tier === 'Silver1') return 'Silver';
  if (tier === 'Bronze3') return 'Bronze III';
  if (tier === 'Bronze2') return 'Bronze II';
  if (tier === 'Bronze1') return 'Bronze';
  return tier;
}

export function brandRankLabel(rank?: string) {
  return tierLabel(rank);
}

export function tierClass(tier?: string) {
  const label = tierLabel(tier);

  if (label === 'Platinum' || label.startsWith('Platinum')) return 'border-primary/20 bg-blue-50 text-blue-800';
  if (label.startsWith('Gold')) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (label.startsWith('Silver')) return 'border-slate-200 bg-slate-100 text-slate-700';
  return 'border-orange-200 bg-orange-50 text-orange-800';
}

export function TierBadge({ tier, verified = false, className, brandView = false }: { tier?: string; verified?: boolean; className?: string; brandView?: boolean }) {
  const label = verified && !tier ? 'Verified Creator' : brandView ? brandRankLabel(tier) : tierLabel(tier);
  const Icon = label === 'Gold' || label === 'Platinum' ? Crown : verified ? ShieldCheck : Medal;

  return (
    <span className={cn('rank-chip border', tierClass(label), className)}>
      {tier ? <RankBadgeIcon rank={label} className="size-4" /> : <Icon className="size-3" />}
      {label}
    </span>
  );
}

export function statusTone(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'active':
    case 'accepted':
    case 'in_progress':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'in_discussion':
    case 'open':
    case 'pending':
    case 'pending_review':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'needs_changes':
    case 'changes_requested':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'matched':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'rejected':
    case 'suspended':
    case 'declined':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

export function statusLabel(status: string) {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
