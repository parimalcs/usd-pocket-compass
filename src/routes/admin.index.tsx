import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, ConfirmButton, PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DOCTORS, doctorQueue, resetDemo, today, useStore } from "@/lib/queue-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard – QueueWise" },
      { name: "description", content: "Today's appointments and live queue overview for hospital staff." },
      { property: "og:title", content: "Staff Dashboard – QueueWise" },
      { property: "og:description", content: "Today's appointments and live queue overview for hospital staff." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const s = useStore();
  const todays = s.appointments.filter((a) => a.date === today());
  const count = (st: string) => todays.filter((a) => a.status === st).length;

  return (
    <>
      <PageHeader title="Staff dashboard" subtitle="Statistics below are for today, across all departments combined." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Appointments today" value={todays.filter((a) => a.status !== "cancelled").length} />
        <Stat label="Patients waiting" value={count("waiting")} />
        <Stat label="Currently serving" value={count("serving")} />
        <Stat label="Completed" value={count("completed")} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Active queues</h2>
          <Button asChild><Link to="/admin/queue">Manage queues</Link></Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground"><tr><th className="py-2 pr-4 font-medium">Doctor</th><th className="pr-4 font-medium">Room</th><th className="pr-4 font-medium">Serving</th><th className="font-medium">Waiting</th></tr></thead>
            <tbody>
              {DOCTORS.map((d) => {
                const q = doctorQueue(s, d.id);
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="py-2 pr-4"><span className="font-medium">{d.name}</span><br /><span className="text-muted-foreground">{d.department}</span></td>
                    <td className="pr-4">{d.room}</td>
                    <td className="pr-4">{q.find((a) => a.status === "serving")?.token ?? "—"}</td>
                    <td>{q.filter((a) => a.status === "waiting").length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-semibold">Demo data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Restore the original sample patients and queues.</p>
        <ConfirmButton className="mt-3" label="Reset demo data" confirmLabel="Yes, reset" title="Reset all demo data?"
          description="All bookings, tokens and queue changes will be replaced with the original sample data."
          onConfirm={() => { resetDemo(); toast.success("Demo data reset"); }} />
      </Card>
    </>
  );
}
