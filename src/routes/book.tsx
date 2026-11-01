import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, PageHeader, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  bookAppointment, dateKey, DEMO_PATIENT, DEPARTMENTS, DOCTORS, doctorById, formatDate, isSlotTaken, SLOTS, useStore,
  type Appointment,
} from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment – QueueWise" },
      { name: "description", content: "Book a hospital appointment in five simple steps." },
      { property: "og:title", content: "Book Appointment – QueueWise" },
      { property: "og:description", content: "Book a hospital appointment in five simple steps." },
    ],
  }),
  component: BookPage,
});

const STEPS = ["Department", "Doctor", "Date & time", "Your details", "Confirm"];

function choice(selected: boolean) {
  return cn(
    "min-h-11 rounded-lg border-2 px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through",
    selected ? "border-primary bg-secondary font-semibold text-primary" : "border-border bg-card hover:border-sage",
  );
}

function BookPage() {
  const s = useStore();
  const [step, setStep] = useState(0);
  const [dept, setDept] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(dateKey(0));
  const [time, setTime] = useState("");
  const [name, setName] = useState(DEMO_PATIENT.name);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Appointment | null>(null);
  const dates = Array.from({ length: 7 }, (_, i) => dateKey(i));

  const canNext = [!!dept, !!doctorId, !!time && !isSlotTaken(s, doctorId, date, time), name.trim().length >= 2, true][step];

  function next() {
    if (!canNext) {
      setError(["Please select a department.", "Please select a doctor.", "Please select an available time slot.", "Please enter your name (at least 2 characters).", ""][step]);
      return;
    }
    setError("");
    if (step < 4) return setStep(step + 1);
    const r = bookAppointment({ patientName: name, doctorId, date, time });
    if (!r.ok) { setError(r.error); setStep(2); setTime(""); return; }
    setDone(r.appt);
    toast.success("Appointment booked");
  }

  if (done) {
    const d = doctorById(done.doctorId);
    return (
      <>
        <PageHeader title="Appointment confirmed" subtitle="Check in at the hospital on the day to receive your queue token." />
        <Card className="max-w-lg">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Appointment ID</dt><dd className="font-semibold">{done.id}</dd>
            <dt className="text-muted-foreground">Patient</dt><dd>{done.patientName}</dd>
            <dt className="text-muted-foreground">Doctor</dt><dd>{d.name}</dd>
            <dt className="text-muted-foreground">Department</dt><dd>{d.department}</dd>
            <dt className="text-muted-foreground">Date & time</dt><dd>{formatDate(done.date)}, {done.time}</dd>
            <dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={done.status} /></dd>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild><Link to="/appointments">View my appointments</Link></Button>
            <Button variant="outline" onClick={() => { setDone(null); setStep(0); setDept(""); setDoctorId(""); setTime(""); }}>Book another</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Book an appointment" subtitle="Five simple steps. No medical details required." />
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Booking progress">
        {STEPS.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined}
            className={cn("rounded-full px-3 py-1 text-xs font-medium", i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-secondary text-primary" : "bg-card text-muted-foreground border border-border")}>
            Step {i + 1}: {l}{i < step ? " ✓" : ""}
          </li>
        ))}
      </ol>

      <Card>
        {step === 0 && (
          <fieldset><legend className="mb-3 font-serif text-xl font-semibold">Select a department</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DEPARTMENTS.map((d) => (
                <button key={d} aria-pressed={dept === d} className={choice(dept === d)} onClick={() => { setDept(d); setDoctorId(""); setTime(""); }}>{d}</button>
              ))}
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <fieldset><legend className="mb-3 font-serif text-xl font-semibold">Select a doctor</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCTORS.filter((d) => d.department === dept).map((d) => {
                const free = SLOTS.filter((t) => !isSlotTaken(s, d.id, date, t)).length;
                return (
                  <button key={d.id} aria-pressed={doctorId === d.id} className={choice(doctorId === d.id)} onClick={() => { setDoctorId(d.id); setTime(""); }}>
                    <span className="block text-base">{d.name}</span>
                    <span className="block text-muted-foreground">{d.department} · {d.room}</span>
                    <span className="block text-muted-foreground">{free} slots free on {formatDate(date)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <fieldset><legend className="mb-3 font-serif text-xl font-semibold">Select a date</legend>
              <div className="flex flex-wrap gap-2">
                {dates.map((d) => (
                  <button key={d} aria-pressed={date === d} className={choice(date === d)} onClick={() => { setDate(d); setTime(""); }}>{formatDate(d)}</button>
                ))}
              </div>
            </fieldset>
            <fieldset><legend className="mb-1 font-serif text-xl font-semibold">Select a time</legend>
              <p className="mb-3 text-sm text-muted-foreground">Crossed-out slots are already booked or unavailable.</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {SLOTS.map((t) => {
                  const taken = isSlotTaken(s, doctorId, date, t);
                  return (
                    <button key={t} disabled={taken} aria-pressed={time === t} aria-label={`${t}${taken ? " (unavailable)" : ""}`} className={choice(time === t)} onClick={() => setTime(t)}>{t}</button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}
        {step === 3 && (
          <div className="max-w-sm">
            <label htmlFor="pname" className="mb-1 block font-serif text-xl font-semibold">Patient name</label>
            <p className="mb-2 text-sm text-muted-foreground">Enter the name of the person attending.</p>
            <input id="pname" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error}
              className="min-h-11 w-full rounded-lg border border-input bg-card px-3" />
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="mb-3 text-xl font-semibold">Review your booking</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Patient</dt><dd>{name}</dd>
              <dt className="text-muted-foreground">Department</dt><dd>{dept}</dd>
              <dt className="text-muted-foreground">Doctor</dt><dd>{doctorById(doctorId).name} ({doctorById(doctorId).room})</dd>
              <dt className="text-muted-foreground">Date & time</dt><dd>{formatDate(date)}, {time}</dd>
            </dl>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p>}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => { setError(""); setStep(step - 1); }}>Back</Button>
          <Button onClick={next}>{step === 4 ? "Confirm appointment" : "Continue"}</Button>
        </div>
      </Card>
    </>
  );
}
