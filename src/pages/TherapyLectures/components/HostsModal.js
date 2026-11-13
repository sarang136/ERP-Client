import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { updateLectureSeries } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import HostSelect from "./HostSelect";
import { errorMessage } from "../helpers";

// The series' hosts. Days with their own hosts keep them.
const HostsModal = ({ isOpen, toggle, series, onSaved }) => {
  const handleAuthError = useAuthError();
  const [hosts, setHosts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setHosts((series?.hosts || []).map((h) => h?._id || h));
  }, [isOpen, series]);

  const save = async () => {
    if (!hosts.length) return toast.info("Pick at least one host");
    setSaving(true);
    try {
      const res = await updateLectureSeries(series._id, { hosts });
      toast.success(res?.message || "Hosts updated");
      onSaved();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Series hosts</ModalHeader>
      <ModalBody>
        <HostSelect center={series?.centerId || series?.center?._id} value={hosts} onChange={setHosts} />
        <small className="text-muted d-block mt-2">
          Hosts add and move patients and run every session. Days that have their own hosts keep them.
        </small>
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Cancel</Button>
        <Button color="primary" onClick={save} disabled={saving}>{saving ? <Spinner size="sm" /> : "Save"}</Button>
      </ModalFooter>
    </Modal>
  );
};

export default HostsModal;
