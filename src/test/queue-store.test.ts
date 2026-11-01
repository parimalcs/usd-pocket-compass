import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { bookAppointment, bookingError, callNext, cancel, checkIn, complete, dateKey, doctorQueue, hydrateStore, isUpcoming, queueInfo, resetDemo } from "@/lib/queue-store";

const snapshot = () => JSON.parse(localStorage.getItem("queuewise-data-v1") ?? "{}");
const input = () => ({ department: "General Medicine", doctorId: "d2", date: dateKey(), time: "11:00", patientName: "Test Patient" });

describe("Shared appointment rules", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 1, 8, 0)); localStorage.clear(); resetDemo(); });
  afterEach(() => vi.useRealTimers());

  it("requires a department before continuing", () => {
    expect(bookingError(snapshot(), { ...input(), department: "" }, 0)).not.toBe("");
    expect(bookingError(snapshot(), input(), 0)).toBe("");
  });
  it("requires a doctor from the selected department", () => {
    expect(bookingError(snapshot(), { ...input(), doctorId: "d3" }, 1)).not.toBe("");
  });
  it("requires an available future slot and valid name", () => {
    expect(bookingError(snapshot(), { ...input(), time: "09:00" }, 2)).not.toBe("");
    expect(bookingError(snapshot(), { ...input(), date: dateKey(-1) }, 2)).not.toBe("");
    expect(bookingError(snapshot(), { ...input(), patientName: "A" }, 3)).not.toBe("");
  });
  it("keeps seeded booked appointments in the future even late in the day", () => {
    vi.setSystemTime(new Date(2026, 10, 1, 19, 0)); resetDemo();
    const booked = snapshot().appointments.filter((a: { status: string }) => a.status === "booked");
    expect(booked).toHaveLength(2);
    expect(booked.every(isUpcoming)).toBe(true);
  });
  it("excludes past booked visits from upcoming and rejects their check-in", () => {
    const booked = bookAppointment(input());
    if (!booked.ok) throw new Error(booked.error);
    vi.setSystemTime(new Date(2026, 10, 2, 8, 0));
    expect(isUpcoming(booked.appt)).toBe(false);
    expect(checkIn(booked.appt.id).ok).toBe(false);
  });
  it("uses one doctor-specific record through check-in, call and completion", () => {
    const booked = bookAppointment(input());
    if (!booked.ok) throw new Error(booked.error);
    const checked = checkIn(booked.appt.id);
    if (!checked.ok) throw new Error(checked.error);
    expect(checked.appt.token).toBe("GK-101");
    const info = queueInfo(snapshot(), checked.appt);
    expect(info).toMatchObject({ position: 1, total: 1, ahead: 0, nextInLine: true, serving: undefined });
    expect(callNext("d2")?.id).toBe(booked.appt.id);
    expect(snapshot().appointments.find((a: { id: string }) => a.id === booked.appt.id).status).toBe("serving");
    expect(callNext("d2")).toBeNull();
    expect(doctorQueue(snapshot(), "d1")).toHaveLength(4);
    expect(complete("d2")?.id).toBe(booked.appt.id);
    expect(snapshot().appointments.find((a: { id: string }) => a.id === booked.appt.id).status).toBe("completed");
  });
  it("prevents duplicate slot bookings and duplicate check-in tokens", () => {
    const booked = bookAppointment(input());
    if (!booked.ok) throw new Error(booked.error);
    expect(bookAppointment(input()).ok).toBe(false);
    expect(checkIn(booked.appt.id).ok).toBe(true);
    expect(checkIn(booked.appt.id).ok).toBe(false);
  });
  it("cancels booked and waiting visits but not a serving visit", () => {
    const booked = bookAppointment(input());
    if (!booked.ok) throw new Error(booked.error);
    expect(cancel(booked.appt.id)).toBe(true);
    const second = bookAppointment(input());
    if (!second.ok) throw new Error(second.error);
    checkIn(second.appt.id);
    expect(cancel(second.appt.id)).toBe(true);
    const third = bookAppointment(input());
    if (!third.ok) throw new Error(third.error);
    checkIn(third.appt.id); callNext("d2");
    expect(cancel(third.appt.id)).toBe(false);
  });
  it("reads other tab records before a staff action", () => {
    hydrateStore();
    const saved = snapshot();
    saved.appointments.push({ id: "shared", patientId: "P-DEMO", patientName: "Test", doctorId: "d2", date: dateKey(), time: "11:00", status: "waiting", token: "GK-110", checkedInAt: Date.now() });
    localStorage.setItem("queuewise-data-v1", JSON.stringify(saved));
    expect(callNext("d2")?.id).toBe("shared");
    expect(doctorQueue(snapshot(), "d1")).toHaveLength(4);
  });
});