import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";
import { Badge, Button, Card, CardBody, Col, Row, Spinner } from "reactstrap";
import { getLectureSeriesList } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { useCenterOptions } from "../../../Components/Hooks/useCenterOptions";
import CreateSeriesModal from "../components/CreateSeriesModal";
import { useLecturePermissions } from "../permissions";
import {
  HALVES,
  currentMonth,
  errorMessage,
  formatDate,
  halfDaysText,
  halfRange,
  halfTag,
  hostNames,
  monthLabel,
  seriesEndKey,
  seriesHalf,
  seriesHalfTag,
  seriesStatus,
  shiftMonth,
  todayKey,
} from "../helpers";

const startsText = (startKey) => `${startKey <= todayKey() ? "Started" : "Starts"} ${formatDate(startKey)}`;

const SeriesCard = ({ s, onOpen }) => {
  const status = seriesStatus(s);
  return (
    <Card className="h-100 border shadow-none mb-0" role="button" onClick={onOpen} data-testid="series-card">
      <CardBody>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div className="text-muted small text-uppercase fw-semibold">
              <span data-testid="series-half">{seriesHalfTag(s.startKey)}</span> · {startsText(s.startKey)}
            </div>
            <h5 className="mb-0">{s.label}</h5>
          </div>
          <Badge color={status.color} className="fs-12">{status.text}</Badge>
        </div>
        <div className="small text-muted mb-2 text-capitalize">
          <i className="bx bx-user-voice me-1" />
          {hostNames(s.hosts) || "No hosts"}
        </div>
        <div className="d-flex gap-3 small">
          <span><i className="bx bx-group me-1" />{s.patientCount} patient{s.patientCount === 1 ? "" : "s"}</span>
          <span><i className="bx bx-check-circle me-1" />{s.doneCount} / {s.sessionCount} sessions done</span>
        </div>
      </CardBody>
    </Card>
  );
};

// A half of the month (1st–15th or 16th–end) with no series started in it yet.
// It can still take one while a series started on its last day would not have ended.
const EmptySlot = ({ month, half, onCreate, canCreate }) => {
  const ended = seriesEndKey(halfRange(month, half).toKey) < todayKey();
  return (
    <Card className="h-100 shadow-none mb-0" style={{ border: "1px dashed var(--vz-border-color)" }} data-testid="empty-slot">
      <CardBody className="d-flex flex-column justify-content-center align-items-center text-center">
        <div className="text-muted small text-uppercase fw-semibold">{halfTag(month, half)}</div>
        <div className="mb-2">Start on any day, {halfDaysText(month, half)}</div>
        {ended ? (
          <span className="text-muted small">No series was run</span>
        ) : !canCreate ? (
          <span className="text-muted small">No series yet</span>
        ) : (
          <Button size="sm" color="primary" outline onClick={onCreate}>
            <i className="bx bx-plus me-1" />Create series
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

const SeriesList = () => {
  const navigate = useNavigate();
  const handleAuthError = useAuthError();
  const { canWrite } = useLecturePermissions();
  const [params, setParams] = useSearchParams();
  const centreOptionsAll = useCenterOptions({ includeAll: true });
  const centreOptions = useMemo(() => centreOptionsAll.filter((o) => o.value !== "ALL"), [centreOptionsAll]);

  const month = /^\d{4}-\d{2}$/.test(params.get("month") || "") ? params.get("month") : currentMonth();
  const centre = params.get("centre") || (centreOptions.length === 1 ? centreOptions[0].value : "ALL");

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null); // initial values for the create modal

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    const centres = centre === "ALL" ? centreOptions.map((o) => o.value) : [centre];
    if (!centres.length) return setList([]);
    setLoading(true);
    try {
      const res = await getLectureSeriesList({ month, center: centres.join(",") });
      setList(res?.data || []);
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err, "Could not load the series"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, centre, centreOptions]);

  useEffect(() => {
    load();
  }, [load]);

  // One row per centre: the selected centre always (with empty slots), or every
  // centre that has a series running this month when "All centres" is chosen.
  const rows = useMemo(() => {
    const byCentre = new Map();
    for (const s of list) {
      const id = s.center?._id || s.center;
      if (!byCentre.has(id)) byCentre.set(id, { id, title: s.center?.title || "Centre", series: [] });
      byCentre.get(id).series.push(s);
    }
    if (centre !== "ALL") {
      const title = centreOptions.find((o) => o.value === centre)?.label || "Centre";
      return [byCentre.get(centre) || { id: centre, title, series: [] }];
    }
    return [...byCentre.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [list, centre, centreOptions]);

  // A centre's cards: every series running in the month (some started in an
  // earlier month), plus an empty slot for each half of this month that has no
  // series started in it (1st–15th, 16th–end).
  const slotsOf = (row) => {
    const taken = new Set(row.series.filter((s) => s.startKey.slice(0, 7) === month).map((s) => seriesHalf(s.startKey)));
    const empty = HALVES.filter((h) => !taken.has(h)).map((half) => ({ empty: true, half, startKey: halfRange(month, half).fromKey }));
    return [...row.series, ...empty].sort((a, b) => a.startKey.localeCompare(b.startKey) || (a.empty ? 1 : -1));
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="mb-0">Therapy Lectures</h4>
          <small className="text-muted">
            45-Day De-addiction Lecture Programme · a series runs 45 days from the day it starts · one series per half-month
            (started 1st–15th or 16th onwards)
          </small>
        </div>
        {canWrite && (
          <Button color="primary" onClick={() => setCreating({ center: centre !== "ALL" ? centre : "", month })}>
            <i className="bx bx-plus me-1" />New series
          </Button>
        )}
      </div>

      <Card className="mb-3">
        <CardBody className="d-flex flex-wrap align-items-center gap-3 py-2">
          <div className="d-flex align-items-center gap-1">
            <Button color="light" size="sm" aria-label="Previous month" onClick={() => setParam("month", shiftMonth(month, -1))}>
              <i className="bx bx-chevron-left" />
            </Button>
            <span className="fw-semibold px-2" style={{ minWidth: 130, textAlign: "center" }}>{monthLabel(month)}</span>
            <Button color="light" size="sm" aria-label="Next month" onClick={() => setParam("month", shiftMonth(month, 1))}>
              <i className="bx bx-chevron-right" />
            </Button>
            {month !== currentMonth() && (
              <Button color="link" size="sm" onClick={() => setParam("month", currentMonth())}>This month</Button>
            )}
          </div>
          <div style={{ minWidth: 240 }}>
            <Select
              aria-label="Centre"
              options={centreOptions.length > 1 ? [{ value: "ALL", label: "All centres" }, ...centreOptions] : centreOptions}
              value={
                centre === "ALL"
                  ? { value: "ALL", label: "All centres" }
                  : centreOptions.find((o) => o.value === centre) || null
              }
              onChange={(o) => setParam("centre", o?.value || "ALL")}
              classNamePrefix="select"
            />
          </div>
          {loading && <Spinner size="sm" color="primary" />}
        </CardBody>
      </Card>

      {!loading && rows.length === 0 && (
        <Card>
          <CardBody className="text-center text-muted py-5">
            No lecture series running in {monthLabel(month)}.{canWrite ? " Pick a centre to create one." : ""}
          </CardBody>
        </Card>
      )}

      {rows.map((row) => (
        <div key={row.id} className="mb-4">
          <h6 className="text-muted text-uppercase mb-2">{row.title}</h6>
          <Row className="g-3">
            {slotsOf(row).map((slot) => (
              <Col md={6} xl={3} key={slot.empty ? `empty-${slot.half}` : slot._id}>
                {slot.empty ? (
                  <EmptySlot
                    month={month}
                    half={slot.half}
                    canCreate={canWrite}
                    onCreate={() => setCreating({ center: row.id, month, half: slot.half })}
                  />
                ) : (
                  <SeriesCard s={slot} onOpen={() => navigate(`/therapy-lectures/${slot._id}`)} />
                )}
              </Col>
            ))}
          </Row>
        </div>
      ))}

      <CreateSeriesModal
        isOpen={canWrite && Boolean(creating)}
        toggle={() => setCreating(null)}
        centreOptions={centreOptions}
        initial={creating}
        onCreated={(s) => {
          setCreating(null);
          if (s?._id) navigate(`/therapy-lectures/${s._id}`);
          else load();
        }}
      />
    </>
  );
};

export default SeriesList;
