import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { getLectureSeriesList, moveLectureMember } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { errorMessage, hostNames, seriesStatus } from "../helpers";

// Moves a patient to another (current or upcoming) series of the same centre.
const MoveModal = ({ isOpen, toggle, member, series, onMoved }) => {
  const handleAuthError = useAuthError();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const centre = series?.centerId || series?.center?._id;
  useEffect(() => {
    if (!isOpen || !centre) return undefined;
    let live = true;
    setTarget("");
    setLoading(true);
    getLectureSeriesList({ open: 1, center: centre })
      .then((res) => live && setOptions((res?.data || []).filter((s) => s._id !== series._id)))
      .catch((err) => live && !handleAuthError(err) && toast.error(errorMessage(err)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, centre, series?._id]);

  const move = async () => {
    setSaving(true);
    try {
      const res = await moveLectureMember(member._id, target);
      toast.success(res?.message || "Moved");
      onMoved();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Move to another series</ModalHeader>
      <ModalBody>
        <p className="mb-3">
          <span className="fw-medium text-capitalize">{member?.patient?.name}</span> leaves the {series?.label} series today and
          joins the other series at the day it's on (from its first day if it hasn't started). Their attendance so far is kept.
        </p>
        {loading ? (
          <Spinner size="sm" color="primary" />
        ) : options.length === 0 ? (
          <div className="text-muted small">
            There's no other current or upcoming series at this centre. Create the next one first.
          </div>
        ) : (
          options.map((s) => (
            <div className="form-check mb-2" key={s._id}>
              <Input type="radio" className="form-check-input" id={`tl-move-${s._id}`} name="tl-move" checked={target === s._id} onChange={() => setTarget(s._id)} />
              <Label className="form-check-label" for={`tl-move-${s._id}`}>
                {s.label} <span className="text-muted">({seriesStatus(s).text})</span>
                <div className="small text-muted text-capitalize">
                  {s.patientCount} patient{s.patientCount === 1 ? "" : "s"} · {hostNames(s.hosts)}
                </div>
              </Label>
            </div>
          ))
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Cancel</Button>
        <Button color="primary" disabled={!target || saving} onClick={move}>{saving ? <Spinner size="sm" /> : "Move"}</Button>
      </ModalFooter>
    </Modal>
  );
};

export default MoveModal;
