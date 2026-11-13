import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import LectureProgress, { usePatientLectureProgress } from "./LectureProgress";

// A patient's attendance across the 45 activities, and the series they've been in.
const ProgressModal = ({ isOpen, toggle, patient }) => {
  const { data, loading, error } = usePatientLectureProgress(patient?._id, isOpen);

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable centered>
      <ModalHeader toggle={toggle}>
        <span className="text-capitalize">{patient?.name}</span> <small className="text-muted">{patient?.uid}</small>
      </ModalHeader>
      <ModalBody>
        {loading && <Spinner color="primary" />}
        {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}
        {data && <LectureProgress data={data} />}
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ProgressModal;
