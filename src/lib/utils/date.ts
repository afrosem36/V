import { format, parseISO, differenceInCalendarDays, startOfDay } from "date-fns";
import type { DayOfWeek } from "@/types/domain";

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function dayOfWeekOf(d: Date): DayOfWeek {
  return d.getDay() as DayOfWeek;
}

export function formatFriendlyDate(iso: string): string {
  return format(parseISO(iso), "MMMM d, yyyy");
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "MMM d");
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export function daysAgo(iso: string): number {
  return differenceInCalendarDays(startOfDay(new Date()), startOfDay(parseISO(iso)));
}

export function isSameDay(iso: string, dateOnly: string): boolean {
  return iso.startsWith(dateOnly);
}
