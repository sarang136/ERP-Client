import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getAllSopAlerts,
  markSopAlertRead,
  markAllSopAlertsRead,
  resolveSopAlert,
  addAlertNote,
} from "../../../helpers/backend_helper";
import { dateLabel } from "./alertUtils";
import { DEFAULT_RESOLVED_STATE } from "./alertConstants";

const SERVER_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 50;

// The page opens on every unresolved alert: no date range, Resolution =
// Unresolved. Picking a date range or another Resolution narrows from there.
// `overrides` lets a caller start from different filters (a dashboard's
// "this patient's alerts" link, see pages/Alerts/index.js).
const initialFilters = (overrides = {}) => ({
  patients: [],         // array of { value, label } from AsyncSelect
  rules: [],            // array of { value, label } from AsyncSelect
  categories: [],       // array of SOP category values (empty = all)
  centers: [],          // array of center _ids (empty = all accessible)
  roles: [],            // array of User.role values the alert was routed to (empty = all)
  dateFrom: null,       // ISO start of the picked range; null = all dates
  dateTo: null,         // ISO end of the picked range; null = all dates
  readState: "all",     // all | unread | read
  phase: "all",         // all | IMMEDIATE | DELAYED
  resolvedState: DEFAULT_RESOLVED_STATE, // all | resolved | unresolved
  resolvedBy: "all",    // all | staff | system — who closed it; all by default
  // all | SOP_RULE | BASELINE_INVESTIGATION. What produced the alert. Needed
  // because a baseline-package alert has no `rule`, so it can never be reached
  // through the SOP-name dropdown above.
  source: "all",
  severity: [],         // array of LOW/MEDIUM/HIGH/CRITICAL
  ...overrides,
});

// Translates UI filter state → server query params. Option-shaped fields
// (patients, rules) are flattened to csv of ObjectIds; severity stays as csv
// of enum tokens.
const buildServerParams = (filters, page, pageSize) => {
  const out = { page, pageSize };

  if (filters.patients?.length) {
    out.patients = filters.patients.map((p) => p.value).join(",");
  }
  if (filters.rules?.length) {
    out.rules = filters.rules.map((r) => r.value).join(",");
  }
  if (filters.categories?.length) {
    out.categories = filters.categories.join(",");
  }
  if (filters.centers?.length) {
    out.centers = filters.centers.join(",");
  }
  if (filters.roles?.length) {
    out.roles = filters.roles.join(",");
  }
  if (filters.severity?.length) {
    out.severity = filters.severity.join(",");
  }
  if (filters.dateFrom) out.dateFrom = filters.dateFrom;
  if (filters.dateTo) out.dateTo = filters.dateTo;
  if (filters.readState && filters.readState !== "all")
    out.readState = filters.readState;
  if (filters.phase && filters.phase !== "all") out.phase = filters.phase;
  if (filters.resolvedState && filters.resolvedState !== "all")
    out.resolvedState = filters.resolvedState;
  if (filters.resolvedBy && filters.resolvedBy !== "all")
    out.resolvedBy = filters.resolvedBy;
  if (filters.source && filters.source !== "all") out.source = filters.source;

  return out;
};

// Exported so the CSV export builds its params from the SAME translator. These
// were two near-duplicate functions, which meant a filter added to one was
// silently ignored by the other — the downloaded file then disagreed with what
// the user was looking at.
export { buildServerParams };

/**
 * Inbox state for the Alerts page. Every filter lives on the server now
 * (read state / phase / severity / search / date range) and pagination is
 * server-driven via $facet. Text inputs debounce 350ms before refetch.
 *
 * Live socket updates prepend new alerts to the current page (best-effort);
 * the next user-initiated load (refresh / page change / filter change) gets
 * the authoritative server state.
 */
export const useAlertsInbox = (initialOverrides) => {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Unified server-side filter state. Defaults: unresolved only, any date, no
  // patient/rule restriction, all severities/phases/read-states — unless the
  // caller (e.g. a dashboard's "jump to this patient's alerts" link) seeds
  // different starting filters via initialOverrides.
  const [serverFilters, setServerFilters] = useState(() =>
    initialFilters(initialOverrides),
  );

  // Debounced copy — only THIS triggers refetch.
  const [debouncedFilters, setDebouncedFilters] = useState(serverFilters);

  const alertsRef = useRef([]);
  alertsRef.current = alerts;

  const load = useCallback(async (filters, p, size) => {
    setLoading(true);
    try {
      const res = await getAllSopAlerts(buildServerParams(filters, p, size));
      setAlerts(res?.data || []);
      setTotal(res?.total || 0);
      setTotalUnread(res?.totalUnread || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever page/pageSize or debounced filters change.
  useEffect(() => {
    load(debouncedFilters, page, pageSize);
  }, [load, debouncedFilters, page, pageSize]);

  // Debounce filter changes by SERVER_DEBOUNCE_MS. Reset to page 1 whenever
  // filters change so we don't end up on page 50 of a now-shorter list.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(serverFilters);
      setPage(1);
    }, SERVER_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [serverFilters]);

  const setServerFilter = useCallback((key, value) => {
    setServerFilters((p) => ({ ...p, [key]: value }));
  }, []);

  // "Clear all" returns to the same defaults the page boots with: every
  // unresolved alert, any date.
  const clearServerFilters = useCallback(() => {
    setServerFilters(initialFilters());
  }, []);

  const toggleSeverity = useCallback((sev) => {
    setServerFilters((p) => ({
      ...p,
      severity: p.severity.includes(sev)
        ? p.severity.filter((s) => s !== sev)
        : [...p.severity, sev],
    }));
  }, []);

  const clearSeverityFilter = useCallback(
    () => setServerFilters((p) => ({ ...p, severity: [] })),
    [],
  );

  // Group the current page's rows by date label (Today / Yesterday / date).
  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of alerts) {
      const label = dateLabel(a.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(a);
    }
    return [...map.entries()];
  }, [alerts]);

  const markRead = useCallback(async (id) => {
    let wasUnread = false;
    setAlerts((prev) =>
      prev.map((a) => {
        if (a._id === id && !a.isRead) {
          wasUnread = true;
          return { ...a, isRead: true };
        }
        return a;
      }),
    );
    if (wasUnread) setTotalUnread((u) => Math.max(0, u - 1));
    try {
      await markSopAlertRead(id);
    } catch {
      /* best-effort */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setBulkLoading(true);
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setTotalUnread(0);
    try {
      const res = await markAllSopAlertsRead();
      toast.success(`Marked ${res?.count ?? "all"} alert(s) as read`);
    } catch {
      toast.error("Failed to mark all as read");
      load(debouncedFilters, page, pageSize);
    } finally {
      setBulkLoading(false);
    }
  }, [load, debouncedFilters, page, pageSize]);

  // Resolve an alert. `text` is mandatory — the server 400s without it.
  //
  // The response carries both the resolution snapshot AND the new note (stored
  // tagged as kind "RESOLUTION"), so the row is patched with both and the notes
  // column updates in place without a refetch. Also flips the row read,
  // mirroring the server's $addToSet. Throws on failure so the caller can keep
  // the modal open and surface the error.
  const resolveAlert = useCallback(async (id, text) => {
    const res = await resolveSopAlert(id, text);
    const resolution = res?.resolution || {
      resolved: true,
      resolvedAt: new Date().toISOString(),
    };
    const newNote = res?.note;
    let wasUnread = false;
    setAlerts((prev) =>
      prev.map((a) => {
        if (a._id !== id) return a;
        if (!a.isRead) wasUnread = true;
        return {
          ...a,
          resolution,
          isRead: true,
          notes: newNote ? [...(a.notes || []), newNote] : a.notes,
        };
      }),
    );
    if (wasUnread) setTotalUnread((u) => Math.max(0, u - 1));
    return res;
  }, []);

  // Append a note to an alert. On success patches the row in place so the
  // notes column updates immediately without a full refetch. Throws on failure
  // so the caller (modal) can surface the error.
  const addNote = useCallback(async (id, text) => {
    const res = await addAlertNote(id, text);
    const newNote = res?.note;
    if (newNote) {
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, notes: [...(a.notes || []), newNote] }
            : a,
        ),
      );
    }
    return res;
  }, []);

  const getAlertById = useCallback(
    (id) => alerts.find((a) => a._id === id) || null,
    [alerts],
  );

  return {
    // data
    alerts,
    grouped,
    total,
    totalUnread,
    // pagination
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    // status
    loading,
    bulkLoading,
    // filters (all server-side now)
    serverFilters,
    setServerFilter,
    clearServerFilters,
    toggleSeverity,
    clearSeverityFilter,
    // actions
    load: () => load(debouncedFilters, page, pageSize),
    markRead,
    markAllRead,
    resolveAlert,
    addNote,
    getAlertById,
  };
};
