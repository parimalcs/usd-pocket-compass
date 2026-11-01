/**
 * QueueWise data store.
 * - One entity: Appointment. Doctors/departments are static.
 * - Data is saved in the browser (localStorage) and synced between tabs
 *   of the same browser via the "storage" event. It is a simulation.
 */
import { useSyncExternalStore } from "react";

export type Status = "booked" | "waiting" | "serving" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: Status;
  token?: string;
  checkedInAt?: number; // used for FIFO ordering
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  room: string;
  prefix: string;
}

export const DEPARTMENTS = ["General Medicine", "Cardiology", "Dermatology", "Orthopaedics"];

export const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Meera Iyer", department: "General Medicine", room: "OPD 3", prefix: "GM" },
  { id: "d2", name: "Dr. Rohan Kapoor", department: "General Medicine", room: "OPD 4", prefix: "GK" },
  { id: "d3", name: "Dr. Ananya Rao", department: "Cardiology", room: "OPD 7", prefix: "CA" },
  { id: "d4", name: "Dr. Vikram Shah", department: "Dermatology", room: "OPD 9", prefix: "DE" },
  { id: "d5", name: "Dr. Kavita Nair", department: "Orthopaedics", room: "OPD 12", prefix: "OR" },
];

export const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"];
/** Static unavailable slots per doctor (e.g. doctor on break). */
export const BLOCKED: Record<string, string[]> = { d1: ["11:30"], d2: ["09:00"], d3: ["14:00", "14:30"], d4: ["10:00"], d5: ["15:30"] };

export const AVG_MINUTES = 5;
export const DEMO_PATIENT = { id: "P-DEMO", name: "Aarav Sharma" };

export const doctorById = (id: string) => DOCTORS.find((d) => d.id === id)!;

export function dateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export const today = () => dateKey(0);

interface State {
  appointments: Appointment[];
  tokenCounters: Record<string, number>;
  updatedAt: number;
}

function seed(): State {
  const t = today();
  const base = Date.now() - 60 * 60 * 1000;
  const others = ["Priya Menon", "Karan Gupta", "Sneha Pillai", "Arjun Das", "Fatima Khan", "Rahul Verma"];
  const appts: Appointment[] = [];
  // Doctor d1 queue: 1 serving + 3 waiting
  others.slice(0, 4).forEach((name, i) =>
    appts.push({
      id: `A-${1001 + i}`, patientId: `P-${i}`, patientName: name, doctorId: "d1", date: t,
      time: SLOTS[i], status: i === 0 ? "serving" : "waiting", token: `GM-${101 + i}`, checkedInAt: base + i * 60000,
    }),
  );
  // Doctor d3 queue: 2 waiting
  others.slice(4).forEach((name, i) =>
    appts.push({
      id: `A-${1010 + i}`, patientId: `P-${10 + i}`, patientName: name, doctorId: "d3", date: t,
      time: SLOTS[i], status: "waiting", token: `CA-${101 + i}`, checkedInAt: base + i * 60000,
    }),
  );
  appts.push({ id: "A-1020", patientId: `P-20`, patientName: "Nikhil Joshi", doctorId: "d1", date: t, time: "09:00", status: "completed", token: "GM-100", checkedInAt: base - 60000 });
  // Demo patient appointments
  appts.push(
    { id: "A-2001", patientId: DEMO_PATIENT.id, patientName: DEMO_PATIENT.name, doctorId: "d1", date: t, time: "11:00", status: "booked" },
    { id: "A-2002", patientId: DEMO_PATIENT.id, patientName: DEMO_PATIENT.name, doctorId: "d4", date: dateKey(3), time: "15:00", status: "booked" },
    { id: "A-2003", patientId: DEMO_PATIENT.id, patientName: DEMO_PATIENT.name, doctorId: "d5", date: dateKey(-10), time: "10:30", status: "completed", token: "OR-104" },
    { id: "A-2004", patientId: DEMO_PATIENT.id, patientName: DEMO_PATIENT.name, doctorId: "d3", date: dateKey(-4), time: "14:30", status: "cancelled" },
  );
  return { appointments: appts, tokenCounters: { d1: 104, d2: 100, d3: 102, d4: 100, d5: 104 }, updatedAt: 0 };
}

const KEY = "queuewise-data-v1";
const serverState: State = seed();
let state: State = serverState;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function save(next: State) {
  state = { ...next, updatedAt: Date.now() };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

/** Called once in the browser: load saved data and listen to other tabs. */
export function hydrateStore() {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try { state = JSON.parse(raw); } catch { save(seed()); }
  } else save(seed());
  emit();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); emit(); }
  });
}

export function useStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => serverState, // used during SSR + hydration so markup matches
  );
}

/* ---------------- Queue logic (easy to explain) ---------------- */

/** Active queue for a doctor today: waiting + serving, ordered by check-in time (FIFO). */
export function doctorQueue(s: State, doctorId: string) {
  return s.appointments
    .filter((a) => a.doctorId === doctorId && a.date === today() && (a.status === "waiting" || a.status === "serving"))
    .sort((a, b) => (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0));
}

/** Position info for one token. People ahead = the patient being served + earlier waiting patients. */
export function queueInfo(s: State, appt: Appointment) {
  const q = doctorQueue(s, appt.doctorId);
  const idx = q.findIndex((a) => a.id === appt.id);
  const serving = q.find((a) => a.status === "serving");
  const ahead = idx < 0 ? 0 : idx;
  return { position: idx + 1, ahead, waitMinutes: ahead * AVG_MINUTES, serving, total: q.length };
}

export function isSlotTaken(s: State, doctorId: string, date: string, time: string) {
  return (BLOCKED[doctorId] ?? []).includes(time) ||
    s.appointments.some((a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== "cancelled");
}

/* ---------------- Actions ---------------- */
type Result = { ok: true; appt: Appointment } | { ok: false; error: string };

export function bookAppointment(input: { patientName: string; doctorId: string; date: string; time: string }): Result {
  if (isSlotTaken(state, input.doctorId, input.date, input.time))
    return { ok: false, error: "This slot was just taken. Please choose another time." };
  const appt: Appointment = {
    id: `A-${Math.floor(3000 + Math.random() * 6999)}`,
    patientId: DEMO_PATIENT.id, patientName: input.patientName.trim(),
    doctorId: input.doctorId, date: input.date, time: input.time, status: "booked",
  };
  save({ ...state, appointments: [...state.appointments, appt] });
  return { ok: true, appt };
}

/** Check-in only for today's booked appointments; generates the next token for that doctor. */
export function checkIn(id: string): Result {
  const a = state.appointments.find((x) => x.id === id);
  if (!a || a.status !== "booked") return { ok: false, error: "This appointment cannot be checked in." };
  if (a.date !== today()) return { ok: false, error: "Check-in opens on the day of your appointment." };
  const n = (state.tokenCounters[a.doctorId] ?? 100) + 1;
  const updated = { ...a, status: "waiting" as Status, token: `${doctorById(a.doctorId).prefix}-${n}`, checkedInAt: Date.now() };
  save({
    ...state,
    tokenCounters: { ...state.tokenCounters, [a.doctorId]: n },
    appointments: state.appointments.map((x) => (x.id === id ? updated : x)),
  });
  return { ok: true, appt: updated };
}

/** Cancel a booked appointment or a waiting token. Serving/completed cannot be cancelled. */
export function cancel(id: string) {
  const a = state.appointments.find((x) => x.id === id);
  if (!a || (a.status !== "booked" && a.status !== "waiting")) return false;
  save({ ...state, appointments: state.appointments.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)) });
  return true;
}

/** Call Next: only if nobody is being served; first waiting patient (FIFO) becomes serving. */
export function callNext(doctorId: string): Appointment | null {
  const q = doctorQueue(state, doctorId);
  if (q.some((a) => a.status === "serving")) return null;
  const next = q.find((a) => a.status === "waiting");
  if (!next) return null;
  save({ ...state, appointments: state.appointments.map((x) => (x.id === next.id ? { ...x, status: "serving" } : x)) });
  return next;
}

export function complete(doctorId: string) {
  const serving = doctorQueue(state, doctorId).find((a) => a.status === "serving");
  if (!serving) return null;
  save({ ...state, appointments: state.appointments.map((x) => (x.id === serving.id ? { ...x, status: "completed" } : x)) });
  return serving;
}

export function resetDemo() { save(seed()); }

/* ---------------- Role (patient/staff) ---------------- */
let role: "patient" | "admin" = "patient";
const roleListeners = new Set<() => void>();
export function setRole(r: "patient" | "admin") { role = r; roleListeners.forEach((l) => l()); }
export function useRole() {
  return useSyncExternalStore((l) => { roleListeners.add(l); return () => roleListeners.delete(l); }, () => role, () => role);
}

export const STATUS_LABEL: Record<Status, string> = {
  booked: "Booked", waiting: "Waiting", serving: "Your turn / Serving", completed: "Completed", cancelled: "Cancelled",
};
export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
