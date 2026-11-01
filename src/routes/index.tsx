import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, Stat, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DEMO_PATIENT, doctorById, formatDate, queueInfo, today, useStore } from "@/lib/queue-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard – QueueWise" },
      { name: "description", content: "See your upcoming appointment, queue token and estimated waiting time." },
      { property: "og:title", content: "Patient Dashboard – QueueWise" },
      { property: "og:description", content: "See your upcoming appointment, queue token and estimated waiting time." },
    ],
  }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const s = useStore();
  const mine = s.appointments.filter((a) => a.patientId === DEMO_PATIENT.id);
  const active = mine.find((a) => a.date === today() && (a.status === "waiting" || a.status === "serving"));
  const upcoming = mine.filter((a) => a.status === "booked").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const info = active ? queueInfo(s, active) : null;
  const doc = active ? doctorById(active.doctorId) : null;

  return (
    <>
      <PageHeader title={`Welcome, ${DEMO_PATIENT.name.split(" ")[0]}`} subtitle="Your appointments and queue status at a glance." />

      {active && info && doc ? (
        active.status === "serving" ? (
          <Card className="mb-6 border-primary bg-primary text-primary-foreground">
            <p className="text-sm font-semibold uppercase tracking-wide">Status: Your turn</p>
            <h2 className="mt-1 text-3xl font-semibold">Please proceed to {doc.room}</h2>
            <p className="mt-1">Token {active.token} · {doc.name}</p>
          </Card>
        ) : (
          <Card className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your active token</p>
                <p className="font-serif text-5xl font-semibold text-primary">{active.token}</p>
                <p className="mt-1 text-sm text-muted-foreground">{doc.name} · {doc.department} · {doc.room}</p>
              </div>
              <StatusBadge status={active.status} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Estimated wait" value={`~${info.waitMinutes} min`} />
              <Stat label="People ahead" value={info.ahead} />
              <Stat label="Queue position" value={`${info.position} of ${info.total}`} />
              <Stat label="Now serving" value={info.serving?.token ?? "—"} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              "People ahead" includes the patient currently being served and everyone who checked in before you. The wait is an estimate ({info.ahead} × 5 minutes).
            </p>
          </Card>
        )
      ) : (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold">No active queue token</h2>
          <p className="mt-1 text-muted-foreground">Check in from My Appointments when you arrive at the hospital to get your token.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Upcoming appointment</h2>
          {upcoming ? (
            <div className="mt-3 space-y-1">
              <p className="font-medium">{doctorById(upcoming.doctorId).name}</p>
              <p className="text-sm text-muted-foreground">{doctorById(upcoming.doctorId).department}</p>
              <p className="text-sm">{formatDate(upcoming.date)} at {upcoming.time}</p>
              <StatusBadge status={upcoming.status} />
            </div>
          ) : (
            <p className="mt-2 text-muted-foreground">You have no upcoming appointments.</p>
          )}
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild><Link to="/book">Book an appointment</Link></Button>
            <Button asChild variant="outline"><Link to="/queue">Track my queue</Link></Button>
            <Button asChild variant="outline"><Link to="/appointments">My appointments</Link></Button>
          </div>
        </Card>
      </div>
    </>
  );
}
