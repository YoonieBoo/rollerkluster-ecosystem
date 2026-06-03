'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Briefcase, GraduationCap, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUiStore } from '@/lib/ui-store';

type SignInRole = 'admin' | 'creator';

export function AuthGate({ children }: { children: ReactNode }) {
  const { authHydrated, hydrateAuth, isAuthenticated } = useUiStore();

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  if (!authHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm font-semibold text-muted-foreground shadow-sm">
          Loading RollerKluster
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return children;
}

function SignInScreen() {
  const signIn = useUiStore(state => state.signIn);
  const [role, setRole] = useState<SignInRole>('admin');
  const [email, setEmail] = useState('brand@rollerkluster.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    signIn(role, email.trim());
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <section className="w-full max-w-[980px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-border bg-muted/35 p-8 lg:border-b-0 lg:border-r">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white">
              <LockKeyhole className="size-5" />
            </div>
            <p className="section-label mt-8">RollerKluster</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">Sign in to your workspace</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Your account type determines whether you enter the Brand Side or Creator Side. Roles are not switched inside the workspace.
            </p>
            <div className="mt-8 grid gap-3">
              <RoleSummary
                icon={<Briefcase className="size-4" />}
                title="Brand Side"
                detail="For brands and campaign owners managing creator collaborations."
              />
              <RoleSummary
                icon={<GraduationCap className="size-4" />}
                title="Creator Side"
                detail="For student creators managing offers, submissions, rank, and profile."
              />
            </div>
          </div>

          <form onSubmit={submit} className="p-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Account sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose the account type assigned to you.</p>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-foreground">Account type</span>
                <Select value={role} onValueChange={(value) => setRole(value as SignInRole)}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Brand Side</SelectItem>
                    <SelectItem value="creator">Creator Side</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-foreground">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.edu"
                  className="h-11 bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-foreground">Password</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="h-11 bg-white"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" className="mt-2 h-11 bg-primary text-white hover:bg-primary/90">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function RoleSummary({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}
