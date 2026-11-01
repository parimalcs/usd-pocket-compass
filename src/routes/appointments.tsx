import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, ConfirmButton, PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cancel, checkIn, DEMO_PATIENT, doctorById, formatDate, today, useStore, type Appointment } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments – QueueWise" },
      { name: "description", content: "View, check in or cancel your appointments." },
      { property: "og:title", content: "My Appointments – QueueWise" },
      { property: "og:description", content: "View, check in or cancel your appointments." },
    ],
  }),
  component: AppointmentsPage,
});

const TABS = [
  { key: "upcoming", label: "Upcoming", match: (a: Appointment) => ["booked", "waiting", "serving"].includes(a.status) },
  { key: "completed", label: "Completed", match: (a: Appointment) => a.status === "completed" },
  { key: "cancelled", label: "Cancelled", match: (a: Appointment) => a.status === "cancelled" },
];

function AppointmentsPage() {
  const s = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const current = TABS.find((t) => t.key === tab)!;
  const list = s.appointments
    .filter((a) => a.patientId === DEMO_PATIENT.id && current.match(a))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      <PageHeader title="My appointments" subtitle="Check-in opens on the day of your appointment. Checking in gives you a queue token." />
      <div role="tablist" aria-label="Appointment categories" className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("min-h-10 flex-1 rounded-md px-3 text-sm font-medium", tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="text-center">
          <p className="font-medium">No {current.label.toLowerCase()} appointments.</p>
          {tab === "upcoming" && <Button asChild className="mt-3"><Link to="/book">Book an appointment</Link></Button>}
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const d = doctorById(a.doctorId);
            const isToday = a.date === today();
            return (
              <li key={a.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{a.id}{a.token ? ` · Token ${a.token}` : ""}</p>
                      <h2 className="text-lg font-semibold">{d.name}</h2>
                      <p className="text-sm text-muted-foreground">{d.department} · {d.room}</p>
                      <p className="text-sm">{formatDate(a.date)} at {a.time}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.status === "booked" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button disabled={!isToday} onClick={() => {
                        const r = checkIn(a.id);
                        if (r.ok) { toast.success(`Checked in. Your token is ${r.appt.token}`); navigate({ to: "/queue" }); }
                        else toast.error(r.error);
                      }}>Check in</Button>
                      <ConfirmButton label="Cancel appointment" title="Cancel this appointment?"
                        description={`${d.name} on ${formatDate(a.date)} at ${a.time}. This cannot be undone.`}
                        onConfirm={() => { cancel(a.id); toast.success("Appointment cancelled"); }} />
                      {!isToday && <p className="w-full text-sm text-muted-foreground">Check-in becomes available on {formatDate(a.date)}, when you arrive at the hospital.</p>}
                    </div>
                  )}
                  {(a.status === "waiting" || a.status === "serving") && (
                    <Button asChild variant="outline" className="mt-4"><Link to="/queue">Track queue</Link></Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
