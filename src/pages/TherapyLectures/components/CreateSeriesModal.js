import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { createLectureSeries } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import HostSelect from "./HostSelect";
import { START_DAYS, errorMessage, seriesEndKey, seriesLabel, todayKey } from "../helpers";

// New series: centre, start (the 1st or 16th of a month), hosts. It runs 45 days.
// Anyone with the page can create one.
const CreateSeriesModal = ({ isOpen, toggle, centreOptions, initial, onCreated }) => {
  const handleAuthError = useAuthError();
  const [center, setCenter] = useState("");
  const [month, setMonth] = useState("");
  const [startDay, setStartDay] = useState("01");
  const [hosts, setHosts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCenter(initial?.center || (centreOptions.length === 1 ? centreOptions[0].value : ""));
    setMonth(initial?.month || todayKey().slice(0, 7));
    setStartDay(initial?.startDay || (Number(todayKey().slice(8)) < 16 ? "16" : "01"));
    setHosts([]);
    setError("");
  }, [isOpen, initial, centreOptions]);

  const startKey = month ? `${month}-${startDay}` : "";
  const ended = startKey && seriesEndKey(startKey) < todayKey();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!center) return setError("Pick a centre");
    if (!month) return setError("Pick a month");
    if (ended) return setError("This series has already ended");
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
            <Label for="tl-month" className="fw-medium">Starts in</Label>
            <Input id="tl-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label className="fw-medium d-block">Start day</Label>
            {START_DAYS.map((d) => (
              <div className="form-check" key={d}>
                <Input
                  type="radio"
                  id={`tl-start-${d}`}
                  name="tl-start"
                  className="form-check-input"
                  checked={startDay === d}
                  onChange={() => setStartDay(d)}
                />
                <Label for={`tl-start-${d}`} className="form-check-label">
                  {d === "01" ? "1st" : "16th"}
                  {month && <span className="text-muted"> — runs {seriesLabel(`${month}-${d}`)}</span>}
                </Label>
              </div>
            ))}
            <small className="text-muted">45 days, one session a day.</small>
            {ended && <div className="text-danger small mt-1">This series has already ended.</div>}
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
