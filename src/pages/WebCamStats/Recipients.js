import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Spinner,
  Button,
  Input,
  Table,
} from "reactstrap";
import { RefreshCw, XCircle, Users, Search, Clock, Phone } from "lucide-react";
import axios from "axios";
import { api } from "../../config";

const CCTV_API_KEY =
  process.env.REACT_APP_CCTV_API_KEY ||
  "48dd6cc2f04685a14c6a7320b87097b23bd9a2979edfa8d0818902a8659313b0";

const REFRESH_MS = 60000;

/** Friendly names for the alert groups in each machine's recipients.json. */
const GROUP_LABELS = {
  all: "All alerts",
  restricted: "Restricted area",
  yoga: "Yoga",
  test: "Test",
  staff: "Staff",
  staffTest: "Staff (test)",
  selfHarm: "Self-harm",
};

const GROUP_ORDER = Object.keys(GROUP_LABELS);

const groupLabel = (g) => GROUP_LABELS[g] || g;

/** "just now" / "4m ago" / "2h ago" / "3d ago" */
const formatAge = (value) => {
  if (!value) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value)) / 1000));
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/** 917773015690 -> +91 77730 15690 */
const formatNumber = (n) => {
  const s = String(n || "");
  if (s.length === 12 && s.startsWith("91")) {
    return `+91 ${s.slice(2, 7)} ${s.slice(7)}`;
  }
  return s ? `+${s}` : "";
};

const CenterCard = ({ center, query }) => {
  const q = query.trim().toLowerCase();
  const rows = (center.recipients || []).filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.number.includes(q.replace(/[^\d]/g, "") || "\u0000"),
  );

  // A machine that has not synced in a while may be showing stale numbers.
  const stale =
    center.syncedAt && Date.now() - new Date(center.syncedAt) > 30 * 60 * 1000;

  const overridden = (center.groups || []).filter((g) => g.envOverride);

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <CardBody className="p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="min-w-0">
            <h6 className="fw-bold mb-1">
              {center.center?.name || "Unknown centre"}
            </h6>
            <p className="text-muted small mb-0" title={center.machineId}>
              {center.machineId}
            </p>
          </div>
          <span className="rc-count" title="People receiving alerts">
            <Users size={13} />
            {center.recipients?.length || 0}
          </span>
        </div>

        <div className="d-flex flex-wrap gap-3 rc-facts mb-2">
          <span title={center.updatedAt ? new Date(center.updatedAt).toLocaleString() : ""}>
            <Clock size={12} className="me-1" />
            Edited {formatAge(center.updatedAt)}
          </span>
          <span
            title={center.syncedAt ? new Date(center.syncedAt).toLocaleString() : ""}
            className={stale ? "rc-stale" : ""}
          >
            Synced {formatAge(center.syncedAt)}
          </span>
        </div>

        {overridden.length ? (
          <p className="rc-note mb-2">
            Overridden on the machine by environment variable:{" "}
            {overridden.map((g) => groupLabel(g.group)).join(", ")}. Those
            numbers are what is actually used.
          </p>
        ) : null}

        {rows.length ? (
          <div className="table-responsive">
            <Table size="sm" className="mb-0 align-middle rc-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Number</th>
                  <th>Receives</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.number}>
                    <td className="fw-semibold">
                      {r.name || <span className="text-muted fst-italic">No name</span>}
                    </td>
                    <td className="text-nowrap">
                      <a href={`tel:+${r.number}`} className="rc-phone">
                        <Phone size={11} className="me-1" />
                        {formatNumber(r.number)}
                      </a>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {[...r.groups]
                          .sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b))
                          .map((g) => (
                            <span key={g} className="rc-chip" data-group={g}>
                              {groupLabel(g)}
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <p className="text-muted small mb-0">
            {q ? "No one here matches your search." : "No recipients configured."}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

const Recipients = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState("ALL");

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const res = await axios.get(`${api.CCTV_SERVICE_URL}/recipients`, {
        headers: { "x-api-key": CCTV_API_KEY },
      });
      // The ERP axios layer may or may not unwrap `.data` — accept both.
      const payload = res?.data?.centers ? res.data : res;
      setData(payload?.centers ? payload : { centers: [] });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load recipients",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
    const id = setInterval(fetchRecipients, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchRecipients]);

  const centers = useMemo(() => data?.centers || [], [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return centers.filter((c) => {
      if (centerFilter !== "ALL" && c.machineId !== centerFilter) return false;
      if (!q) return true;
      const digits = q.replace(/[^\d]/g, "");
      return (
        (c.center?.name || "").toLowerCase().includes(q) ||
        (c.recipients || []).some(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (digits && r.number.includes(digits)),
        )
      );
    });
  }, [centers, query, centerFilter]);

  // A search that matched the centre name should show everyone there.
  const rowQuery = (c) =>
    (c.center?.name || "").toLowerCase().includes(query.trim().toLowerCase())
      ? ""
      : query;

  const totalPeople = useMemo(
    () => new Set(centers.flatMap((c) => (c.recipients || []).map((r) => r.number))).size,
    [centers],
  );

  return (
    <React.Fragment>
      <div className="page-content overflow-hidden">
        <Container fluid>
          <div className="chat-wrapper d-flex row gap-1 mx-n4 my-n4 mb-n5 p-1">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">Recipients</h2>
                <p className="text-muted mb-0">
                  Who gets the WhatsApp CCTV alerts at each centre
                  {centers.length
                    ? ` · ${totalPeople} people across ${centers.length} ${centers.length === 1 ? "machine" : "machines"}`
                    : ""}
                </p>
              </div>
              <Button
                color="light"
                size="sm"
                onClick={fetchRecipients}
                disabled={loading}
                className="d-flex align-items-center gap-2"
              >
                <RefreshCw size={15} className={loading ? "spin-anim" : ""} />
                Refresh
              </Button>
            </div>

            <Row className="g-2 mb-3">
              <Col md={6} lg={4}>
                <div className="position-relative">
                  <Search size={14} className="rc-search-icon" />
                  <Input
                    type="search"
                    placeholder="Search name, number or centre"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="ps-4"
                  />
                </div>
              </Col>
              <Col md={6} lg={3}>
                <Input
                  type="select"
                  value={centerFilter}
                  onChange={(e) => setCenterFilter(e.target.value)}
                >
                  <option value="ALL">All centres</option>
                  {centers.map((c) => (
                    <option key={c.machineId} value={c.machineId}>
                      {c.center?.name || c.machineId}
                      {c.center?.name ? ` (${c.machineId})` : ""}
                    </option>
                  ))}
                </Input>
              </Col>
            </Row>

            {error ? (
              <div className="alert alert-danger rounded-3 d-flex align-items-center gap-2">
                <XCircle size={16} />
                {error}
              </div>
            ) : null}

            {loading && !data ? (
              <div className="d-flex justify-content-center py-4">
                <Spinner color="primary" />
              </div>
            ) : visible.length ? (
              <Row className="g-3">
                {visible.map((c) => (
                  <Col xl={6} key={c.machineId}>
                    <CenterCard center={c} query={rowQuery(c)} />
                  </Col>
                ))}
              </Row>
            ) : (
              !error && (
                <Card className="border-0 shadow-sm rounded-4">
                  <CardBody className="text-center text-muted py-4">
                    <Users size={22} className="mb-2 d-block mx-auto" />
                    {centers.length
                      ? "Nothing matches your search."
                      : "No centre has synced its recipients yet. They appear here once a machine's CCTV server restarts or its recipients are saved."}
                  </CardBody>
                </Card>
              )
            )}
          </div>
        </Container>
      </div>

      <style>{`
        .rc-count {
          display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto;
          padding: 3px 9px; border-radius: 999px; font-size: .74rem; font-weight: 700;
          background: var(--vz-light, #f3f6f9); color: var(--vz-body-color, #212529);
        }
        .rc-facts { font-size: .74rem; color: var(--vz-text-muted, #878a99); }
        .rc-facts span { display: inline-flex; align-items: center; }
        .rc-stale { color: #8a5d00; font-weight: 600; }
        body[data-layout-mode="dark"] .rc-stale { color: #fac95e; }
        .rc-note {
          font-size: .72rem; line-height: 1.4; padding: 6px 10px; border-radius: 8px;
          background: rgba(250, 178, 25, 0.14); color: var(--vz-body-color, #212529);
        }
        .rc-table th {
          font-size: .7rem; text-transform: uppercase; letter-spacing: .04em;
          color: var(--vz-text-muted, #878a99); font-weight: 600; border-top: 0;
        }
        .rc-table td { font-size: .8rem; }
        .rc-phone { color: var(--vz-body-color, #212529); display: inline-flex; align-items: center; }
        .rc-phone:hover { color: var(--vz-primary, #405189); }
        .rc-chip {
          display: inline-block; padding: 1px 7px; border-radius: 6px;
          font-size: .68rem; font-weight: 600; white-space: nowrap;
          background: var(--vz-light, #f3f6f9); color: var(--vz-body-color, #212529);
          border: 1px solid var(--vz-border-color, #e9ebec);
        }
        .rc-chip[data-group="selfHarm"] { background: rgba(208, 59, 59, 0.12); border-color: transparent; color: #a32020; }
        .rc-chip[data-group="all"] { background: rgba(64, 81, 137, 0.12); border-color: transparent; color: var(--vz-primary, #405189); }
        body[data-layout-mode="dark"] .rc-chip[data-group="selfHarm"] { color: #ef8080; }
        .rc-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: var(--vz-text-muted, #878a99); pointer-events: none;
        }
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </React.Fragment>
  );
};

export default Recipients;
