import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge, Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { addLectureMember, getLectureEligiblePatients } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { errorMessage, formatDate } from "../helpers";

// Adds admitted patients of the centre. One in another series that's still
// running is moved here after the host confirms; one whose series has ended
// completed it and is simply added.
const AddPatientModal = ({ isOpen, toggle, series, today, onAdded }) => {
  const handleAuthError = useAuthError();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);
  const [joinedKey, setJoinedKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setPicked(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !series?._id) return undefined;
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      getLectureEligiblePatients(series._id, search.trim())
        .then((res) => live && setResults(res?.data || []))
        .catch((err) => live && !handleAuthError(err) && toast.error(errorMessage(err)))
        .finally(() => live && setLoading(false));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, search, series?._id, refresh]);

  const seriesStarted = series && today > series.startKey;
  const firstAllowed = picked?.admissionKey && picked.admissionKey > series?.startKey ? picked.admissionKey : series?.startKey;

  const pick = (p) => {
    setPicked(p);
    setJoinedKey(seriesStarted ? today : "");
  };

  const moving = Boolean(picked?.current) && !picked.current.ended;

  const add = async (move = moving) => {
    setSaving(true);
    try {
      const body = { patient: picked._id, move };
      if (!move && joinedKey && joinedKey !== today) body.joinedKey = joinedKey;
      const res = await addLectureMember(series._id, body);
      toast.success(res?.message || "Patient added");
      setPicked(null);
      setRefresh((x) => x + 1);
      onAdded();
    } catch (err) {
      if (handleAuthError(err)) return;
      if (err?.code === "IN_OTHER_SERIES") {
        // Added to another series meanwhile: show it, and let the host move them.
        setPicked((p) => ({ ...p, current: { label: err?.data?.label || "another", ended: false } }));
        toast.info(errorMessage(err));
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" scrollable>
      <ModalHeader toggle={toggle}>Add patients to {series?.label}</ModalHeader>
      <ModalBody>
        <Input
          placeholder="Search admitted patients by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="mb-3"
        />
        {loading && <Spinner size="sm" color="primary" className="mb-2" />}
        {!loading && results.length === 0 && <div className="text-muted small">No admitted patients found at this centre.</div>}
        <ul className="list-group mb-3" style={{ maxHeight: 280, overflowY: "auto" }}>
          {results.map((p) => {
            const here = p.current?.sameSeries;
            return (
              <li
                key={p._id}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${picked?._id === p._id ? "active" : ""}`}
                role="button"
                aria-disabled={here}
                onClick={() => !here && pick(p)}
                style={here ? { opacity: 0.6, cursor: "default" } : undefined}
              >
                <div>
                  <span className="fw-medium text-capitalize">{p.name}</span>
                  <small className={`ms-2 ${picked?._id === p._id ? "" : "text-muted"}`}>{p.uid}</small>
                  {p.admissionKey && (
                    <small className={`d-block ${picked?._id === p._id ? "" : "text-muted"}`}>Admitted {formatDate(p.admissionKey)}</small>
                  )}
                </div>
                {here ? (
                  <Badge color="success">In this series</Badge>
                ) : p.current?.ended ? (
                  <Badge color="light" className="text-muted">Completed {p.current.label}</Badge>
                ) : p.current ? (
                  <Badge color="warning" className="text-dark">In {p.current.label}{p.current.day ? ` · Day ${p.current.day}` : ""}</Badge>
                ) : null}
              </li>
            );
          })}
        </ul>

        {picked && (
          <div className="border rounded p-3 bg-light">
            <div className="fw-medium mb-2 text-capitalize">{picked.name}</div>
            {moving ? (
              <p className="mb-0 small">
                In the <strong>{picked.current.label}</strong> series
                {picked.current.day ? ` (on its day ${picked.current.day})` : ""}. Adding moves them here: they leave that
                series today. Their attendance so far is kept. A patient can be in only one series at a time.
              </p>
            ) : (
              <>
                {picked.current?.ended && (
                  <p className="small mb-2">
                    Completed the <strong>{picked.current.label}</strong> series. Adding them starts them in this one.
                  </p>
                )}
                {seriesStarted ? (
                  <FormGroup className="mb-0">
                    <Label for="tl-add-from" className="fw-medium small mb-1">In the series from</Label>
                    <Input id="tl-add-from" type="date" min={firstAllowed} max={today} value={joinedKey} onChange={(e) => setJoinedKey(e.target.value)} style={{ width: 170 }} />
                    <small className="text-muted d-block">Today, or earlier only to mark sessions already held.</small>
                  </FormGroup>
                ) : (
                  <p className="mb-0 small text-muted">They'll be in the series from its first day.</p>
                )}
              </>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Done</Button>
        <Button color="primary" disabled={!picked || saving} onClick={() => add()}>
          {saving ? <Spinner size="sm" /> : moving ? "Move here" : "Add patient"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddPatientModal;
