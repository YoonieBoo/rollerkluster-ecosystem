'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronLeft,
  Compass,
  Home,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/ui-store';
import { useApp } from '@/lib/app-context';
import { buildCurrentCreator } from '@/lib/current-creator';

const menuItems = [
  { href: '/creators', label: 'Find creators', icon: Compass, group: 'Operate' },
  { href: '/campaigns', label: 'Campaigns', icon: Briefcase, group: 'Operate' },
  { href: '/admin', label: 'Applications', icon: ShieldCheck, group: 'Operate' },
];

const creatorMenuItems = [
  { href: '/dashboard', label: 'Home', icon: Home, group: 'Creator portal' },
  { href: '/creators/creator-1', label: 'My profile', icon: UserCircle, group: 'Creator portal' },
  { href: '/notifications', label: 'Invites', icon: Bell, group: 'Support' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, activeRole, sessionEmail, sessionUser, creatorProfile, signOut } = useUiStore();
  const { creators, engagements } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const demoCreator = creators.find(creator => creator.id === 'creator-1') ?? creators.find(creator => creator.approvalStatus === 'approved') ?? creators[0];
  const activeCreator = buildCurrentCreator({ demoCreator, creatorProfile, sessionUser, sessionEmail });
  const creatorInviteCount = activeRole === 'creator' && activeCreator
    ? engagements.filter(engagement =>
        engagement.creatorId === activeCreator.id &&
        (engagement.status === 'matched' || engagement.status === 'in_discussion' || engagement.status === 'accepted'),
      ).length
    : 0;
  const resolvedCreatorMenuItems = creatorMenuItems.map(item =>
    item.href === '/creators/creator-1' && activeCreator ? { ...item, href: `/creators/${activeCreator.id}` } : item,
  );
  const visibleItems = activeRole === 'admin' ? menuItems : resolvedCreatorMenuItems;
  const groups = activeRole === 'admin'
    ? Array.from(new Set(visibleItems.map(item => item.group ?? 'Account')))
    : ['Creator portal', 'Support'];
  const roleDescription = activeRole === 'admin' ? 'For brands and campaign owners' : 'For student creators';

  const renderSidebarBody = ({ mobile = false }: { mobile?: boolean } = {}) => {
    const collapsed = mobile ? false : sidebarCollapsed;

    return (
    <>
      <div
        className={cn(
          'flex py-5',
          collapsed ? 'flex-col items-center gap-3 px-3' : 'items-center justify-between px-5',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white shadow-sm">
            <img src="/logo%20pic.PNG" alt="RollerKluster" className="size-full object-cover" />
          </div>
          <div className={cn('min-w-0 transition-opacity', collapsed && 'pointer-events-none opacity-0')}>
            <h1 className="truncate text-[14px] font-semibold leading-tight text-sidebar-foreground">RollerKluster</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={mobile ? () => setMobileOpen(false) : toggleSidebar}
          className="flex size-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={mobile ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {mobile || collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className={cn('min-h-0 flex-1 overflow-y-auto px-4 pb-5', activeRole === 'admin' ? 'space-y-5' : 'space-y-1')}>
        {(activeRole === 'admin' ? groups : ['Creator navigation']).map((group) => (
          <div key={group}>
            {activeRole === 'admin' && (
              <p className={cn('mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground', collapsed && 'sr-only')}>
                {group}
              </p>
            )}
            <div className="space-y-1">
              {(activeRole === 'admin' ? visibleItems.filter((item) => (item.group ?? 'Account') === group) : visibleItems).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'sidebar-item flex items-center gap-2.5 rounded-[10px] px-3 py-2.5',
                      isActive
                        ? 'sidebar-item-active font-semibold'
                        : 'text-sidebar-foreground/68 hover:text-sidebar-primary',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <div className={cn('flex size-6 items-center justify-center rounded-md', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/55')}>
                      <Icon className="size-[17px]" />
                    </div>
                    <span className={cn('flex min-w-0 flex-1 items-center gap-2 transition-opacity', collapsed && 'hidden')}>
                      <span className="truncate text-[13px] leading-none">{item.label}</span>
                      {activeRole === 'creator' && item.href === '/notifications' && creatorInviteCount > 0 && (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                          {creatorInviteCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('mt-auto px-4 pb-4 transition-opacity', collapsed && 'hidden')}>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-white px-3 py-2 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex size-11 items-center justify-center rounded-[11px] border border-border bg-white text-foreground shadow-sm lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="sidebar-modern relative flex h-dvh w-[min(84vw,320px)] flex-col shadow-xl">
            {renderSidebarBody({ mobile: true })}
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'sidebar-modern sticky top-0 hidden h-screen shrink-0 flex-col transition-[width] duration-200 lg:flex',
          sidebarCollapsed ? 'w-[76px]' : 'w-[262px]',
        )}
      >
        {renderSidebarBody()}
      </aside>
    </>
  );
}
