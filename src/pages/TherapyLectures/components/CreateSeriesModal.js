import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { createLectureSeries } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import HostSelect from "./HostSelect";
import {
  SERIES_DAYS,
  addDays,
  errorMessage,
  halfLongText,
  halfRange,
  seriesEndKey,
  seriesHalf,
  seriesLabel,
  todayKey,
} from "../helpers";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The start date to suggest: today if it falls in the chosen half (or month),
 * else that half's (or month's) first day.
 */
export const suggestedStart = ({ month, half } = {}, today = todayKey()) => {
  if (!month) return today;
  const { fromKey, toKey } = half ? halfRange(month, half) : { fromKey: `${month}-01`, toKey: `${month}-31` };
  return today >= fromKey && today <= toKey ? today : fromKey;
};

// New series: centre, start date (any day), hosts. It runs 45 days from that
// date. Started on the 1st–15th it is its month's 1st half, on the 16th or
// later the 2nd half; a centre has one series per half. Anyone with the page
// can create one.
const CreateSeriesModal = ({ isOpen, toggle, centreOptions, initial, onCreated }) => {
  const handleAuthError = useAuthError();
  const [center, setCenter] = useState("");
  const [startKey, setStartKey] = useState("");
  const [hosts, setHosts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCenter(initial?.center || (centreOptions.length === 1 ? centreOptions[0].value : ""));
    setStartKey(suggestedStart(initial || {}));
    setHosts([]);
    setError("");
  }, [isOpen, initial, centreOptions]);

  const today = todayKey();
  const valid = DATE_RE.test(startKey);
  const ended = valid && seriesEndKey(startKey) < today;
  const tooFar = valid && startKey > addDays(today, 366);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!center) return setError("Pick a centre");
    if (!valid) return setError("Pick the date the series starts");
    if (ended) return setError("This series has already ended");
    if (tooFar) return setError("A series can be created up to a year ahead");
    if (!hosts.length) return setError("Pick at least one host");
    setSaving(true);
    try {
      const res = await createLectureSeries({ center, startKey, hosts });
      toast.success(res?.message || "Series created");
      onCreated(res?.data);
    } catch (err) {
      if (!handleAuthError(err)) setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>New lecture series</ModalHeader>
      <form onSubmit={submit} noValidate>
        <ModalBody>
          <FormGroup>
            <Label for="tl-centre" className="fw-medium">Centre</Label>
            <Select
              inputId="tl-centre"
              options={centreOptions}
              value={centreOptions.find((o) => o.value === center) || null}
              onChange={(o) => {
                setCenter(o?.value || "");
                setHosts([]);
              }}
              placeholder="Choose a centre…"
              classNamePrefix="select"
            />
          </FormGroup>
          <FormGroup>
            <Label for="tl-start" className="fw-medium">Start date</Label>
            <Input
              id="tl-start"
              type="date"
              value={startKey}
              min={addDays(today, -(SERIES_DAYS - 1))}
              max={addDays(today, 366)}
              onChange={(e) => setStartKey(e.target.value)}
            />
            {valid && !ended && (
              <div className="small mt-2" data-testid="tl-start-summary">
                <div>
                  Counts as the <span className="fw-semibold">{halfLongText(startKey.slice(0, 7), seriesHalf(startKey))}</span>
                </div>
                <div className="text-muted">Runs {seriesLabel(startKey)} · {SERIES_DAYS} days, one session a day</div>
              </div>
            )}
            {ended && <div className="text-danger small mt-1">This series has already ended.</div>}
            <small className="text-muted d-block mt-1">
              Any day works. Started on the 1st–15th it is the month's 1st half, on the 16th or later the 2nd half.
              A centre has one series per half.
            </small>
          </FormGroup>
          <FormGroup className="mb-0">
            <Label for="tl-hosts" className="fw-medium">Hosts</Label>
            <HostSelect inputId="tl-hosts" center={center} value={hosts} onChange={setHosts} />
            <small className="text-muted">
              Hosts add patients and run the sessions. Each day can also have its own hosts.
            </small>
          </FormGroup>
          {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}
        </ModalBody>
        <ModalFooter>
          <Button type="button" color="light" className="border" onClick={toggle}>Cancel</Button>
          <Button type="submit" color="primary" disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Create series"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateSeriesModal;
