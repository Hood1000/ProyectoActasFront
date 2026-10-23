import { normalizeText } from "../../utils/normalizeText";

// "YYYY-MM-DD" from <input type="date"> must be read as a local day, not UTC midnight.
const parseLocalDay = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
    : new Date(year, month - 1, day).getTime();
};

export const hasActiveFilters = (filters) =>
  Boolean(filters.search.trim() || filters.dateFrom || filters.dateTo);

export const filterMeetings = (meetings, filters) => {
  const term = normalizeText(filters.search).trim();
  const from = parseLocalDay(filters.dateFrom);
  const to = parseLocalDay(filters.dateTo, true);

  return meetings.filter((meeting) => {
    if (term && !normalizeText(meeting?.title).includes(term)) return false;
    if (from === null && to === null) return true;

    const meetingTime = new Date(meeting?.date).getTime();
    if (Number.isNaN(meetingTime)) return false;
    if (from !== null && meetingTime < from) return false;
    if (to !== null && meetingTime > to) return false;
    return true;
  });
};
