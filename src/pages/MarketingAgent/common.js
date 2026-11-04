import React, { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Input, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import { getCities, getJob } from "../../helpers/marketingAgentApi";
import { usePermissions } from "../../Components/Hooks/useRoles";

let citiesCache = null;
const cityListeners = new Set();

export const PAGE_SIZES = [10, 20, 30, 40, 50];

export const PANE = {
  maxHeight: "calc(100vh - 230px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingRight: 4,
};

export const CHANNELS = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["linkedin", "LinkedIn"],
  ["gbp", "Google Business Profile"],
  ["website", "Website"],
];

export const FORMATS = [
  "reel_script",
  "carousel",
  "post",
  "blog",
  "city_page",
  "gbp_post",
  "ad_copy",
];

export const FORMAT_CHOICES = [
  ["reel_script", "Reel"],
  ["carousel", "Carousel"],
  ["post", "Single post"],
  ["blog", "Blog"],
  ["city_page", "City page"],
  ["gbp_post", "Google post"],
  ["ad_copy", "Ad copy"],
];

export const ChoiceChecks = ({ options, value, onChange, disabled, id }) => (
  <div className="d-flex flex-wrap gap-3">
    {options.map(([key, label]) => (
      <div className="form-check" key={key}>
        <Input
          type="checkbox"
          id={`${id}-${key}`}
          disabled={disabled}
          checked={value.includes(key)}
          onChange={() =>
            onChange(
              value.includes(key)
                ? value.filter((v) => v !== key)
                : [...value, key],
            )
          }
        />
        <label className="form-check-label" htmlFor={`${id}-${key}`}>
          {label}
        </label>
      </div>
    ))}
  </div>
);

export const LANGUAGE_CHOICES = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["mr", "Marathi"],
  ["hinglish", "Hinglish"],
];

export const SCORE_STYLE = {
  crisis: { bg: "#f06548", color: "#fff", label: "CRISIS" },
  hot: { bg: "#fde8e4", color: "#f06548", label: "HOT" },
  warm: { bg: "#fef4e4", color: "#f7b84b", label: "WARM" },
  cold: { bg: "#e3f2fc", color: "#299cdb", label: "COLD" },
  unclear: { bg: "#f3f6f9", color: "#878a99", label: "UNSCORED" },
};

const STATE_COLOR = {
  draft: "secondary",
  checking: "info",
  revising: "info",
  needs_person: "danger",
  awaiting_b: "warning",
  awaiting_c: "warning",
  approved: "success",
  rejected: "dark",
  scheduled: "info",
  publishing: "info",
  published: "success",
  failed: "danger",
  cancelled: "dark",
  awaiting_approval: "warning",
  active: "success",
  paused: "secondary",
  ended: "dark",
  applied: "success",
  planned: "info",
  dropped: "dark",
  content_created: "success",
  open: "danger",
  acknowledged: "success",
  succeeded: "success",
  running: "info",
  queued: "info",
};

const STATE_LABEL = {
  awaiting_b: "Awaiting marketing lead",
  awaiting_c: "Awaiting psychiatrist",
  needs_person: "Needs a person",
  content_created: "Content written",
  awaiting_approval: "Awaiting approval",
};

const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const weekStartOf = (day) => {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoDay(d);
};

export const nextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return weekStartOf(isoDay(d));
};

export const dayStart = (day) =>
  day ? new Date(`${day}T00:00:00`).toISOString() : "";

export const dayEnd = (day) =>
  day ? new Date(`${day}T23:59:59.999`).toISOString() : "";

export const DateRange = ({ since, until, onSince, onUntil, label }) => (
  <div className="d-flex gap-2 align-items-center" style={{ fontSize: 13 }}>
    <span className="text-muted">{label || "From"}</span>
    <Input
      type="date"
      bsSize="sm"
      value={since}
      max={until || undefined}
      onChange={(e) => onSince(e.target.value)}
      style={{ width: 150 }}
    />
    <span className="text-muted">to</span>
    <Input
      type="date"
      bsSize="sm"
      value={until}
      min={since || undefined}
      onChange={(e) => onUntil(e.target.value)}
      style={{ width: 150 }}
    />
  </div>
);

export const errorText = (e) => e?.message || "Something went wrong";

export const notifyError = (e) => toast.error(errorText(e));

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const money = (value) =>
  value === null || value === undefined
    ? "-"
    : `₹${Math.round(value).toLocaleString("en-IN")}`;

export const pct = (value) =>
  value === null || value === undefined ? "-" : `${Math.round(value * 100)}%`;

export const StateBadge = ({ state }) => (
  <Badge
    color={STATE_COLOR[state] || "secondary"}
    className="text-uppercase"
    style={{ fontSize: 11 }}
  >
    {STATE_LABEL[state] || String(state || "").replace(/_/g, " ")}
  </Badge>
);

export const ScoreBadge = ({ score }) => {
  const s = SCORE_STYLE[score] || SCORE_STYLE.unclear;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

export const AGENT_MODULE = "MARKETING_AGENT";

export const useAgentAccess = () => {
  const raw = localStorage.getItem("micrologin");
  const token = raw ? JSON.parse(raw)?.token : null;
  const { hasPermission } = usePermissions(token);
  const can = (subModule, level = "WRITE") =>
    hasPermission(AGENT_MODULE, subModule, level);
  return { can };
};

const publishCities = (data) => {
  citiesCache = data;
  cityListeners.forEach((listener) => listener(data));
};

export const refreshCities = () =>
  getCities({ limit: 200 })
    .then((page) => publishCities(page.items))
    .catch(notifyError);

export const useCities = () => {
  const [cities, setCities] = useState(citiesCache || []);

  useEffect(() => {
    cityListeners.add(setCities);
    if (!citiesCache) refreshCities();
    return () => cityListeners.delete(setCities);
  }, []);

  return cities;
};

export const CitySelect = ({
  value,
  onChange,
  allowAll = false,
  activeOnly = true,
  style,
}) => {
  const cities = useCities();
  const shown = activeOnly ? cities.filter((c) => c.active) : cities;
  return (
    <Input
      type="select"
      bsSize="sm"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {allowAll && <option value="">All cities</option>}
      {shown.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.name}
        </option>
      ))}
    </Input>
  );
};

export const useDefaultCity = () => {
  const cities = useCities();
  const [city, setCity] = useState("");
  useEffect(() => {
    if (!city && cities.length) {
      setCity((cities.find((c) => c.active) || cities[0]).slug);
    }
  }, [cities, city]);
  return [city, setCity];
};

export const useJob = () => {
  const [running, setRunning] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async (start, { successText } = {}) => {
    setRunning(true);
    try {
      let job = await start();
      const startedAt = Date.now();
      while (
        ["queued", "running"].includes(job.status) &&
        Date.now() - startedAt < 15 * 60 * 1000
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        if (!alive.current) return job;
        job = await getJob(job.id);
      }
      if (job.status === "succeeded") {
        if (successText) toast.success(successText);
      } else if (job.status === "failed") {
        toast.error(job.error || "The job failed");
      } else {
        toast.info(
          "Still running in the background. Check again in a few minutes.",
        );
      }
      return job;
    } catch (e) {
      notifyError(e);
      return null;
    } finally {
      if (alive.current) setRunning(false);
    }
  }, []);

  return { run, running };
};

export const useAction = () => {
  const [busy, setBusy] = useState(null);
  const act = useCallback(async (key, fn, successText) => {
    setBusy(key);
    try {
      const result = await fn();
      if (successText) toast.success(successText);
      return result;
    } catch (e) {
      notifyError(e);
      return undefined;
    } finally {
      setBusy(null);
    }
  }, []);
  return { act, busy };
};

export const Loading = () => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <Spinner color="primary" />
  </div>
);

export const Empty = ({ children }) => (
  <div className="text-muted text-center py-4">{children}</div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
    <div>
      <h4 className="mb-1">{title}</h4>
      {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
    </div>
    <div className="d-flex flex-wrap gap-2 align-items-center">{children}</div>
  </div>
);

const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );

export const usePagedList = (fetcher, filters = {}, initialSize = 10) => {
  const key = JSON.stringify(cleanParams(filters));
  const [position, setPosition] = useState({ key, page: 1 });
  const [pageSize, setPageSizeState] = useState(initialSize);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const page = position.key === key ? position.page : 1;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetcher({
      ...JSON.parse(key),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
      .then((result) => {
        if (!alive) return;
        const next = result || { items: [], total: 0 };
        const lastPage = Math.max(1, Math.ceil(next.total / pageSize));
        if (!next.items.length && page > lastPage) {
          setPosition({ key, page: lastPage });
          return;
        }
        setData(next);
      })
      .catch((e) => alive && notifyError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [fetcher, key, page, pageSize, version]);

  const setPage = useCallback(
    (next) => setPosition({ key, page: next }),
    [key],
  );
  const setPageSize = useCallback(
    (size) => {
      setPageSizeState(size);
      setPosition({ key, page: 1 });
    },
    [key],
  );
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    items: data.items,
    total: data.total,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    reload,
  };
};

const pageNumbers = (page, last) => {
  const wanted = new Set([1, last, page - 1, page, page + 1]);
  const pages = [...wanted]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b);
  return pages.flatMap((n, i) =>
    i > 0 && n - pages[i - 1] > 1 ? [`gap-${n}`, n] : [n],
  );
};

export const Pager = ({ list, sizes = PAGE_SIZES }) => {
  const { page, pageSize, total, setPage, setPageSize, loading } = list;
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div
      className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2"
      style={{ fontSize: 13 }}
    >
      <div className="d-flex align-items-center gap-2 text-muted">
        <span>Rows</span>
        <Input
          type="select"
          bsSize="sm"
          aria-label="Rows per page"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ width: 72 }}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Input>
        <span>
          {loading ? "Loading…" : `Showing ${from}–${to} of ${total}`}
        </span>
      </div>
      <div className="d-flex align-items-center gap-1">
        <Button
          size="sm"
          color="light"
          disabled={page <= 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        {pageNumbers(page, last).map((n) =>
          typeof n === "string" ? (
            <span key={n} className="px-1 text-muted">
              …
            </span>
          ) : (
            <Button
              key={n}
              size="sm"
              color={n === page ? "primary" : "light"}
              disabled={loading}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ),
        )}
        <Button
          size="sm"
          color="light"
          disabled={page >= last || loading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export const SearchBox = ({ onSearch, placeholder = "Search", style }) => {
  const [text, setText] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const timer = setTimeout(() => onSearch(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <Input
      bsSize="sm"
      type="search"
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{ width: 220, ...style }}
    />
  );
};

export const FilterSelect = ({ value, onChange, options, allLabel, style }) => (
  <Input
    type="select"
    bsSize="sm"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    style={{ width: "auto", ...style }}
  >
    {allLabel && <option value="">{allLabel}</option>}
    {options.map((o) => {
      const [val, label] = Array.isArray(o) ? o : [o, labelOf(o)];
      return (
        <option key={val} value={val}>
          {label}
        </option>
      );
    })}
  </Input>
);

export const labelOf = (value) =>
  STATE_LABEL[value] ||
  String(value || "")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
