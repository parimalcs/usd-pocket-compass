import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, ConfirmButton, PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { callNext, cancel, complete, DOCTORS, doctorById, doctorQueue, useStore } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/queue")({
  head: () => ({
    meta: [
      { title: "Queue Management – QueueWise" },
      { name: "description", content: "Call, complete and cancel patient tokens in FIFO order." },
      { property: "og:title", content: "Queue Management – QueueWise" },
      { property: "og:description", content: "Call, complete and cancel patient tokens in FIFO order." },
    ],
  }),
  component: QueueManagement,
});

function QueueManagement() {
  const s = useStore();
  const [doctorId, setDoctorId] = useState(DOCTORS[0]!.id);
  const d = doctorById(doctorId);
  const q = doctorQueue(s, doctorId); // FIFO order
  const serving = q.find((a) => a.status === "serving");
  const waiting = q.filter((a) => a.status === "waiting");
  const callReason = serving
    ? `Complete ${serving.token}'s consultation before calling the next patient.`
    : waiting.length === 0 ? "No patients are waiting in this queue." : "";

  return (
    <>
      <PageHeader title="Queue management" subtitle="Patients are called in check-in order (first in, first out)." />
      <label htmlFor="doc" className="mb-1 block text-sm font-medium">Doctor queue</label>
      <select id="doc" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
        className="mb-6 min-h-11 w-full max-w-md rounded-lg border border-input bg-card px-3">
        {DOCTORS.map((x) => {
          const n = doctorQueue(s, x.id).length;
          return <option key={x.id} value={x.id}>{x.name} — {x.department} ({n} in queue)</option>;
        })}
      </select>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Now serving in {d.room}</p>
            <p className="font-serif text-4xl font-semibold text-primary">{serving?.token ?? "—"}</p>
            {serving && <p className="text-sm">{serving.patientName}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!!callReason} onClick={() => { const n = callNext(doctorId); if (n) toast.success(`Called ${n.token} – ${n.patientName}`); }}>Call next</Button>
            <Button variant="outline" disabled={!serving} onClick={() => { const c = complete(doctorId); if (c) toast.success(`Consultation completed for ${c.token}`); }}>
              Complete consultation
            </Button>
          </div>
        </div>
        {callReason && <p className="mt-3 text-sm text-muted-foreground" role="note">Call next is unavailable: {callReason}</p>}
      </Card>

      <Card>
        <h2 className="mb-3 text-xl font-semibold">Queue ({q.length})</h2>
        {q.length === 0 ? (
          <p className="text-muted-foreground">This queue is empty.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr><th className="py-2 pr-3 font-medium">#</th><th className="pr-3 font-medium">Token</th><th className="pr-3 font-medium">Patient</th><th className="pr-3 font-medium">Appt. time</th><th className="pr-3 font-medium">Status</th><th className="font-medium"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {q.map((a, i) => (
                  <tr key={a.id} className={cn("border-t border-border", a.status === "serving" && "bg-secondary")}>
                    <td className="py-2 pr-3">{i + 1}</td>
                    <td className="pr-3 font-semibold">{a.token}</td>
                    <td className="pr-3">{a.patientName}</td>
                    <td className="pr-3">{a.time}</td>
                    <td className="pr-3"><StatusBadge status={a.status} admin /></td>
                    <td className="py-2">
                      {a.status === "waiting" && (
                        <ConfirmButton label={`Cancel ${a.token}`} title={`Cancel token ${a.token}?`}
                          description={`${a.patientName} will be removed from the queue.`}
                          onConfirm={() => { cancel(a.id); toast.success(`Token ${a.token} cancelled`); }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
