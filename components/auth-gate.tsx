'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUiStore } from '@/lib/ui-store';
import { calculateStartingRank, onboardingPlatforms, type OnboardingPlatform } from '@/lib/creator-onboarding';
import { cn } from '@/lib/utils';

type SignInRole = 'admin' | 'creator';

export function AuthGate({ children }: { children: ReactNode }) {
  const { authHydrated, hydrateAuth, isAuthenticated, activeRole, creatorProfile } = useUiStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (authHydrated && isAuthenticated && pathname === '/signup' && !(activeRole === 'creator' && !creatorProfile?.onboardingCompleted)) {
      router.replace('/');
    }
  }, [activeRole, authHydrated, creatorProfile?.onboardingCompleted, isAuthenticated, pathname, router]);

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
    if (pathname === '/signup') return <SignUpScreen />;
    return <SignInScreen />;
  }

  if (activeRole === 'creator' && !creatorProfile?.onboardingCompleted) {
    return <CreatorOnboardingScreen />;
  }

  if (pathname === '/signup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm font-semibold text-muted-foreground shadow-sm">
          Opening your workspace
        </div>
      </div>
    );
  }

  return children;
}

function SignInScreen() {
  const { authError, signInWithPassword, sendPasswordReset } = useUiStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password to continue.');
      return;
    }
    setSubmitting(true);
    await signInWithPassword(email.trim(), password);
    setSubmitting(false);
  };

  const forgotPassword = async () => {
    setLocalError('');
    setResetSent(false);
    if (!email.trim()) {
      setLocalError('Enter your email first, then request a password reset.');
      return;
    }
    await sendPasswordReset(email.trim());
    setResetSent(true);
  };

  return (
    <AuthShell>
      <div className="flex min-h-full flex-col justify-center px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-[370px]">
          <AuthFormBrand />
          <div className="mt-9">
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">Welcome Back!</h1>
            <p className="mt-2 text-xs font-medium text-muted-foreground">Enter your details below</p>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5">
            <AuthField label="Email" value={email} onChange={setEmail} placeholder="you@company.edu" type="email" />
            <AuthField label="Password" value={password} onChange={setPassword} placeholder="Enter password" type="password" />

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-2 font-medium">
                <input type="checkbox" className="size-3.5 rounded border-border accent-primary" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-muted-foreground hover:text-foreground" onClick={() => void forgotPassword()}>
                Forgot password?
              </button>
            </div>

            {(localError || authError) && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {localError || authError}
              </p>
            )}
            {resetSent && !authError && (
              <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                If an account exists for this email, Supabase will send a reset link.
              </p>
            )}

            <Button type="submit" className="mt-1 h-12 rounded-full bg-primary text-white hover:bg-primary/90" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log in'}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-foreground hover:text-primary">Sign Up</Link>
            </div>
            <Link href="/" className="text-center text-xs font-semibold text-muted-foreground hover:text-foreground">Back to Home</Link>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}

function SignUpScreen() {
  const { authError, signUpWithPassword } = useUiStore();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'creator' as SignInRole,
  });
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setSuccess('');
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setLocalError('Complete your name, email, and password.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    await signUpWithPassword({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
    setSubmitting(false);
    setSuccess('Account created. If email confirmation is enabled, check your inbox before signing in.');
  };

  return (
    <AuthShell>
      <div className="flex min-h-full flex-col justify-center px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-[390px]">
          <AuthFormBrand />
          <div className="mt-8">
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">Create Account</h1>
            <p className="mt-2 text-xs font-medium text-muted-foreground">Choose your workspace and create your login</p>
          </div>

          <form onSubmit={submit} className="mt-7 grid gap-4">
            <AuthField label="Full Name" value={form.fullName} onChange={(fullName) => setForm(current => ({ ...current, fullName }))} placeholder="Yoonie" />
            <AuthField label="Email" value={form.email} onChange={(email) => setForm(current => ({ ...current, email }))} placeholder="you@company.edu" type="email" />
            <AuthField label="Password" value={form.password} onChange={(password) => setForm(current => ({ ...current, password }))} placeholder="Create password" type="password" />
            <AuthField label="Confirm Password" value={form.confirmPassword} onChange={(confirmPassword) => setForm(current => ({ ...current, confirmPassword }))} placeholder="Confirm password" type="password" />
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Account Type</span>
              <Select value={form.role} onValueChange={(role) => setForm(current => ({ ...current, role: role as SignInRole }))}>
                <SelectTrigger className="h-11 rounded-none border-x-0 border-t-0 border-border bg-white px-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Creator Side</SelectItem>
                  <SelectItem value="admin">Brand Side</SelectItem>
                </SelectContent>
              </Select>
            </label>

            {(localError || authError) && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {localError || authError}
              </p>
            )}
            {success && !authError && (
              <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {success}
              </p>
            )}

            <Button type="submit" className="mt-1 h-12 rounded-full bg-primary text-white hover:bg-primary/90" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/" className="font-semibold text-foreground hover:text-primary">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-y-auto bg-[#e5e5e3] px-3 py-5 sm:px-6 sm:py-8">
      <section className="mx-auto grid w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-white p-3 shadow-sm sm:rounded-[34px] lg:min-h-[620px] lg:grid-cols-[1.04fr_0.96fr]">
        <AuthVisualPanel />
        {children}
      </section>
    </main>
  );
}

function AuthVisualPanel() {
  return (
    <div className="flex min-h-[250px] items-center justify-center overflow-hidden rounded-[24px] bg-white sm:min-h-[330px] lg:min-h-full">
      <img
        src="/auth-social-stack.svg"
        alt="Social creator platform icons"
        className="h-auto w-[78%] max-w-[360px] object-contain sm:w-[70%] lg:w-[76%]"
      />
    </div>
  );
}

function AuthFormBrand() {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] text-white">RK</span>
      RollerKluster
    </div>
  );
}

function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'email' | 'password';
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-none border-x-0 border-t-0 border-border bg-white px-0 shadow-none focus-visible:ring-0"
      />
    </label>
  );
}

function CreatorOnboardingScreen() {
  const { saveCreatorOnboarding, signOut } = useUiStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    platform: 'Instagram' as OnboardingPlatform,
    socialHandle: '',
    socialProfileUrl: '',
    followerCount: '',
    engagementRate: '',
    creatorName: '',
    university: 'Assumption University',
    faculty: '',
    bio: '',
    categories: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const suggestedRank = useMemo(() => calculateStartingRank(Number(form.followerCount) || 0), [form.followerCount]);
  const totalSteps = 3;
  const progress = Math.round((step / totalSteps) * 100);

  const validateStep = () => {
    setError('');
    if (step === 2) {
      if (!form.followerCount.trim() || Number.isNaN(Number(form.followerCount))) return 'Add your follower count so we can estimate your starting rank.';
    }
    if (step === 3 && (!form.creatorName.trim() || !form.faculty.trim() || !form.bio.trim())) return 'Add your creator name, faculty, and short bio.';
    return '';
  };

  const goNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(current => Math.min(totalSteps, current + 1));
  };

  const submit = async () => {
    setError('');
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    const followerCount = Number(form.followerCount);
    const engagementRate = form.engagementRate ? Number(form.engagementRate) : undefined;
    if (Number.isNaN(followerCount)) return;

    setSaving(true);
    try {
      await saveCreatorOnboarding({
        platform: form.platform,
        socialHandle: form.socialHandle.trim(),
        socialProfileUrl: form.socialProfileUrl.trim(),
        followerCount,
        engagementRate: typeof engagementRate === 'number' && !Number.isNaN(engagementRate) ? engagementRate : undefined,
      });
    } catch (onboardingError) {
      console.error('CREATOR ONBOARDING FORM SUBMIT FAILED', onboardingError);
      setError(onboardingError instanceof Error ? onboardingError.message : 'Could not save creator onboarding. Check Supabase table, storage bucket, and RLS setup.');
    } finally {
      setSaving(false);
    }
  };

  const stepContent = {
    1: (
      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div className="min-w-0">
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-blue-50">AU Creator Campus</Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Join the creator ecosystem built for student opportunities.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">RollerKluster helps student creators receive campaign invitations, submit content, grow rank, build a portfolio, and earn scholarship-hour contributions through real participation.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Benefit icon={<Sparkles className="size-4" />} title="Get discovered" detail="Brands can review your creator profile." />
            <Benefit icon={<Trophy className="size-4" />} title="Rank up" detail="Progress through AU Creator Campus layers." />
            <Benefit icon={<GraduationCap className="size-4" />} title="Earn hours" detail="Hours come from approved activity." />
          </div>
        </div>
        <div className="min-w-0 rounded-[16px] border border-blue-100 bg-blue-50 p-4 sm:p-6">
          <p className="text-sm font-semibold text-blue-900">What happens next</p>
          <div className="mt-4 space-y-3">
            {['Preview your starting rank', 'Complete your creator profile', 'Enter your creator dashboard'].map(item => (
              <div key={item} className="flex min-w-0 items-center gap-3 rounded-[12px] bg-white p-3 text-sm font-semibold text-blue-950">
                <CheckCircle2 className="size-4 text-primary" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    2: (
      <div className="grid min-w-0 gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <div className="min-w-0 rounded-[18px] border border-blue-100 bg-blue-50 p-5 text-center sm:p-6">
          <div className="mx-auto flex size-20 items-center justify-center rounded-[18px] bg-white text-primary shadow-sm sm:size-24">
            <Trophy className="size-10 sm:size-12" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase text-primary">Rank preview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-blue-950 sm:text-4xl">{suggestedRank}</h2>
          <p className="mt-2 text-sm text-blue-800">{Number(form.followerCount || 0).toLocaleString()} followers entered</p>
        </div>
        <div className="min-w-0 space-y-5">
          <div>
            <h2 className="text-xl font-semibold tracking-normal sm:text-2xl">Preview your starting rank</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Follower count estimates your entry rank only. After joining, you rank up through AU Creator Campus activity.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-foreground">Primary platform</span>
              <Select value={form.platform} onValueChange={(platform) => setForm(current => ({ ...current, platform: platform as OnboardingPlatform }))}>
                <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Choose platform" /></SelectTrigger>
                <SelectContent>{onboardingPlatforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <OnboardingField label="Estimated follower count" value={form.followerCount} onChange={(followerCount) => setForm(current => ({ ...current, followerCount }))} placeholder="15000" inputMode="numeric" />
            <OnboardingField label="Username / handle" value={form.socialHandle} onChange={(socialHandle) => setForm(current => ({ ...current, socialHandle }))} placeholder="@yourhandle" />
            <OnboardingField label="Profile URL" value={form.socialProfileUrl} onChange={(socialProfileUrl) => setForm(current => ({ ...current, socialProfileUrl }))} placeholder="https://instagram.com/yourhandle" />
          </div>
          <div className="rounded-[14px] border border-border bg-white p-4">
            <p className="text-sm font-semibold">What this rank unlocks</p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>Brand-side visibility with your starting status.</p>
              <p>A creator profile brands can review for fit.</p>
              <p>A clear path toward the next AU Creator Campus milestone.</p>
            </div>
          </div>
        </div>
      </div>
    ),
    3: (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-normal sm:text-2xl">Complete your creator profile</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Help brands understand who you are, what you make, and where you fit in the AU ecosystem.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <OnboardingField label="Creator name" value={form.creatorName} onChange={(creatorName) => setForm(current => ({ ...current, creatorName }))} placeholder="Yoonie" />
          <OnboardingField label="University" value={form.university} onChange={(university) => setForm(current => ({ ...current, university }))} placeholder="Assumption University" />
          <OnboardingField label="Faculty" value={form.faculty} onChange={(faculty) => setForm(current => ({ ...current, faculty }))} placeholder="Communication Arts" />
          <OnboardingField label="Content categories" value={form.categories} onChange={(categories) => setForm(current => ({ ...current, categories }))} placeholder="Campus life, fashion, events" />
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">Short bio</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm(current => ({ ...current, bio: event.target.value }))}
            placeholder="Tell brands what kind of content you create and what student communities you connect with."
            className="min-h-28 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
      </div>
    ),
  }[step];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1180px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Creator onboarding</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl lg:text-4xl">Complete Your Creator Profile</h1>
            <p className="page-description mt-2">A guided setup for your creator identity, starting rank, and verification.</p>
          </div>
          <Button type="button" variant="outline" className="w-fit border-border bg-white" onClick={() => void signOut()}>Sign out</Button>
        </div>

        <div className="mb-5 rounded-[14px] border border-border bg-white p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
            {[1, 2, 3].map(item => (
              <div key={item} className="flex shrink-0 items-center gap-2">
                <div className={cn('flex size-8 items-center justify-center rounded-full text-xs font-semibold', item <= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>{item}</div>
                <span className={cn('text-xs font-semibold sm:text-sm', item === step ? 'text-foreground' : 'text-muted-foreground')}>{['Welcome', 'Rank', 'Profile'][item - 1]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
          <form className="panel min-w-0 p-4 sm:p-6" onSubmit={(event) => event.preventDefault()}>
            {stepContent}
            {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="w-full border-border bg-white sm:w-auto" disabled={step === 1 || saving} onClick={() => setStep(current => Math.max(1, current - 1))}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              {step < totalSteps ? (
                <Button type="button" className="w-full bg-primary text-white sm:w-auto" onClick={goNext}>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" className="w-full bg-primary text-white sm:w-auto" disabled={saving} onClick={() => void submit()}>
                  {saving ? 'Saving profile...' : 'Enter Creator Dashboard'}
                </Button>
              )}
            </div>
          </form>

          <aside className="min-w-0 space-y-4">
            <div className="panel p-5">
              <h2 className="section-heading">Creator checklist</h2>
              <div className="mt-4 space-y-3">
                <ChecklistItem done={step > 1} label="Welcome reviewed" />
                <ChecklistItem done={Boolean(form.followerCount)} label="Starting rank previewed" />
                <ChecklistItem done={Boolean(form.creatorName && form.faculty && form.bio)} label="Profile details ready" />
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="section-heading">Rank benefits</h2>
              <p className="section-subtitle">Your starting rank helps brands understand your creator reach. Future rank growth comes from AU Creator Campus activity.</p>
            </div>
            <div className="panel p-5">
              <h2 className="section-heading">Scholarship hours</h2>
              <p className="section-subtitle">Scholarship hours are earned later through approved content, consistency, campaign participation, and leadership contribution.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function OnboardingField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="h-11 bg-white" />
    </label>
  );
}

function Benefit({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-white p-4">
      <div className="mb-3 flex size-9 items-center justify-center rounded-[10px] bg-secondary text-primary">{icon}</div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={cn('flex size-6 items-center justify-center rounded-full border', done ? 'border-primary/20 bg-blue-50 text-primary' : 'border-border bg-white text-muted-foreground')}>
        <CheckCircle2 className="size-3.5" />
      </div>
      <span className={cn('font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
  );
}
