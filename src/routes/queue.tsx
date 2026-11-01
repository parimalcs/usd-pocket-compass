import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, ConfirmButton, PageHeader, Stat, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cancel, DEMO_PATIENT, doctorById, queueInfo, today, useStore } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Queue Tracking – QueueWise" },
      { name: "description", content: "Track your token, position and estimated waiting time." },
      { property: "og:title", content: "Queue Tracking – QueueWise" },
      { property: "og:description", content: "Track your token, position and estimated waiting time." },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const s = useStore();
  const mine = s.appointments.filter((a) => a.patientId === DEMO_PATIENT.id && a.token && a.date === today());
  // Prefer the active token; otherwise show the most recent finished one today.
  const appt = mine.find((a) => a.status === "waiting" || a.status === "serving") ?? mine.at(-1);

  if (!appt) {
    return (
      <>
        <PageHeader title="Queue tracking" />
        <Card className="text-center">
          <p className="font-medium">You don't have a queue token yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check in for today's appointment to receive a token.</p>
          <Button asChild className="mt-4"><Link to="/appointments">Go to my appointments</Link></Button>
        </Card>
      </>
    );
  }

  const d = doctorById(appt.doctorId);
  const info = queueInfo(s, appt);
  const stepIndex = { waiting: 0, serving: 1, completed: 2, cancelled: -1, booked: -1 }[appt.status];
  const nearTurn = appt.status === "waiting" && info.ahead <= 1;

  return (
    <>
      <PageHeader title="Queue tracking" subtitle={`${d.name} · ${d.department} · ${d.room}`} />

      {appt.status === "serving" && (
        <div role="status" className="mb-6 rounded-xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm font-bold uppercase tracking-widest">Your turn</p>
          <p className="mt-1 font-serif text-3xl font-semibold">Please proceed to {d.room}.</p>
        </div>
      )}
      {nearTurn && (
        <div role="status" className="mb-6 rounded-xl border border-warning bg-warning-soft p-4 font-medium text-warning">
          Almost your turn — please stay near {d.room}.
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Your token</p>
            <p className="font-serif text-6xl font-semibold text-primary md:text-7xl">{appt.token}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={appt.status} />
          </div>
        </div>

        {(appt.status === "waiting" || appt.status === "serving") && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Now serving" value={info.serving?.token ?? "—"} />
            <Stat label="People ahead" value={info.ahead} />
            <Stat label="Your position" value={`${info.position} of ${info.total}`} />
            <Stat label="Estimated wait" value={appt.status === "serving" ? "Now" : `~${info.waitMinutes} min`} />
          </div>
        )}

        <ol className="mt-6 grid grid-cols-3 gap-2 text-center text-sm" aria-label="Token progress">
          {["Waiting", "Your turn", "Completed"].map((l, i) => (
            <li key={l} aria-current={i === stepIndex ? "step" : undefined}>
              <div className={cn("h-2 rounded-full", i <= stepIndex ? "bg-primary" : "bg-secondary")} />
              <span className={cn("mt-1 block", i === stepIndex ? "font-semibold text-primary" : "text-muted-foreground")}>{l}{i < stepIndex ? " ✓" : ""}</span>
            </li>
          ))}
        </ol>
        {appt.status === "cancelled" && <p className="mt-3 font-medium text-destructive">This token was cancelled.</p>}

        <p className="mt-6 text-sm text-muted-foreground">
          People ahead includes the patient being served and those who checked in before you. Waiting time is an estimate: people ahead × 5 minutes (simulated queue). This screen updates when staff change the queue.
        </p>

        {appt.status === "waiting" && (
          <ConfirmButton className="mt-4" label="Cancel my token" title="Cancel your queue token?"
            description={`Token ${appt.token} will leave the queue. You would need to book again.`}
            onConfirm={() => { cancel(appt.id); toast.success("Token cancelled"); }} />
        )}
      </Card>
    </>
  );
}
