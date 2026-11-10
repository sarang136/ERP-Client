import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import { getRewritePreview } from "../../helpers/marketingAgentApi";
import { notifyError } from "./common";

const STATE = {
  awaiting_b: "Waiting for marketing lead",
  awaiting_c: "Waiting for psychiatrist",
  needs_person: "Needs a person",
  rejected: "Rejected",
  draft: "Draft",
  approved: "Approved",
};

export const RewriteWeek = ({ weekId, weekName, isOpen, onClose, onStart }) => {
  const [includeApproved, setIncludeApproved] = useState(false);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isOpen || !weekId) return;
    setPreview(null);
    getRewritePreview(weekId, includeApproved)
      .then(setPreview)
      .catch(notifyError);
  }, [isOpen, weekId, includeApproved]);

  const n = preview?.items.length || 0;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered scrollable>
      <ModalHeader toggle={onClose}>
        <i className="bx bx-revision me-1" />
        Rewrite all posts: {weekName}
      </ModalHeader>
      <ModalBody style={{ fontSize: 13 }}>
        <p className="text-muted">
          Each post is written again from its brief with fresh facts, website
          extracts and hooks, then goes through both checkers (rules and
          compliance, then brief, RAG material and brand voice). Anything that
          fails is rewritten automatically, up to twice, before it reaches a
          reviewer. Images and videos are kept.
        </p>
        <FormGroup>
          <Label className="fw-semibold">What should change? (optional)</Label>
          <Input
            type="textarea"
            rows={3}
            maxLength={2000}
            placeholder="e.g. Warmer and shorter, speak more to mothers, mention family visits"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormGroup>
        <div className="form-check mb-3">
          <Input
            type="checkbox"
            className="form-check-input"
            id="rewrite-approved"
            checked={includeApproved}
            onChange={(e) => setIncludeApproved(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="rewrite-approved">
            Also rewrite approved posts that aren&apos;t scheduled yet (they
            will need approval again)
          </label>
        </div>
        {!preview ? (
          <div className="d-flex gap-2 align-items-center text-muted">
            <Spinner size="sm" /> Looking at the posts…
          </div>
        ) : (
          <>
            <div className="fw-semibold mb-1">
              Will be rewritten{" "}
              <Badge color="primary" pill>
                {n}
              </Badge>
            </div>
            {n === 0 && (
              <div className="text-muted mb-2">Nothing to rewrite.</div>
            )}
            {preview.items.map((i) => (
              <div
                key={i.id}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span>{i.topic}</span>
                <span className="text-muted">{STATE[i.state] || i.state}</span>
              </div>
            ))}
            {preview.skipped.length > 0 && (
              <>
                <div className="fw-semibold mt-3 mb-1">
                  Left as they are{" "}
                  <Badge color="secondary" pill>
                    {preview.skipped.length}
                  </Badge>
                </div>
                {preview.skipped.map((i) => (
                  <div
                    key={i.id}
                    className="d-flex justify-content-between border-bottom py-1 text-muted"
                  >
                    <span>{i.topic}</span>
                    <span>{i.reason}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="warning"
          disabled={!n}
          onClick={() =>
            onStart({
              week_id: weekId,
              notes: notes.trim() || null,
              include_approved: includeApproved,
            })
          }
        >
          <i className="bx bx-revision me-1" />
          Rewrite {n} post{n === 1 ? "" : "s"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RewriteWeek;
