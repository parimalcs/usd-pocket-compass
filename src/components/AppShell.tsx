import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { hydrateStore, useStore, type Status, STATUS_LABEL } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

const patientNav = [
  { to: "/", label: "Dashboard" },
  { to: "/book", label: "Book Appointment" },
  { to: "/appointments", label: "My Appointments" },
  { to: "/queue", label: "Queue Tracking" },
] as const;
const adminNav = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/queue", label: "Queue Management" },
] as const;

let hydrated = false;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdmin = pathname.startsWith("/admin");
  const nav = isAdmin ? adminNav : patientNav;
  const { updatedAt } = useStore();

  // Saved data lives in the browser, so page content renders after loading it.
  const [ready, setReady] = useState(hydrated);
  useEffect(() => {
    if (!hydrated) { hydrated = true; hydrateStore(); }
    setReady(true);
  }, []);

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 p-4 md:block md:p-6">
          <Link to="/" className="font-serif text-2xl font-semibold text-primary">QueueWise</Link>
          <div role="group" aria-label="Interface mode" className="flex rounded-lg border border-border bg-secondary p-1 text-sm md:mt-5">
            {(["patient", "admin"] as const).map((r) => {
              const active = (r === "admin") === isAdmin;
              return (
                <Button variant="ghost"
                  key={r}
                  aria-pressed={active}
                  onClick={() => navigate({ to: r === "admin" ? "/admin" : "/" })}
                  className={cn("min-h-9 flex-1 rounded-md px-3 font-medium", active ? "bg-primary text-primary-foreground" : "text-secondary-foreground")}
                >
                  {r === "admin" ? "Staff" : "Patient"}
                </Button>
              );
            })}
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4 pb-3 md:block md:space-y-1 md:px-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="block min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-primary", "aria-current": "page" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="hidden px-6 pt-6 text-xs leading-relaxed text-muted-foreground md:block">
          Demo prototype. All appointments, tokens and queue updates are simulated and stored in this browser. Other open tabs update automatically.
        </p>
      </aside>
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 p-4 md:p-8">
        {ready ? children : <p className="text-muted-foreground">Loading…</p>}
        <p className="mt-8 text-xs text-muted-foreground" aria-live="polite">
          {updatedAt > 0 && <>Last updated: {new Date(updatedAt).toLocaleTimeString()}</>}
        </p>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </header>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5", className)}>{children}</section>;
}

const statusStyle: Record<Status, string> = {
  booked: "bg-secondary text-secondary-foreground",
  waiting: "bg-warning-soft text-warning",
  serving: "bg-primary text-primary-foreground",
  completed: "bg-secondary text-primary",
  cancelled: "bg-destructive-soft text-destructive",
};
export function StatusBadge({ status, admin }: { status: Status; admin?: boolean }) {
  const label = status === "serving" ? (admin ? "Serving" : "Your Turn") : STATUS_LABEL[status];
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyle[status])}>{label}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ConfirmButton({ label, title, description, onConfirm, className, confirmLabel = "Yes, cancel" }: {
  label: string; title: string; description: string; onConfirm: () => void; className?: string; confirmLabel?: string;
}) {
  return <ConfirmDialogImpl {...{ label, title, description, onConfirm, className, confirmLabel }} />;
}

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function ConfirmDialogImpl({ label, title, description, onConfirm, className, confirmLabel }: {
  label: string; title: string; description: string; onConfirm: () => void; className?: string | undefined; confirmLabel: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={cn("text-destructive", className)}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
