import React, { useEffect, useState } from "react";
import { Row, Col, Button, Badge } from "reactstrap";
import { getPRById } from "../../../../helpers/backend_helper";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const PR_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

const Field = ({ label, value }) => (
  <div className="mb-3">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "—"}</div>
  </div>
);

const SectionCard = ({ icon, title, children }) => (
  <div className="uom-table-card p-3 mb-4">
    <div className="fw-semibold mb-3 d-flex align-items-center gap-2">
      <i className={`bx ${icon}`}></i> {title}
    </div>
    {children}
  </div>
);

const PROverview = ({ prId, onBack }) => {
  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);
  const { items: uoms } = useReferenceList("uomsAll");

  useEffect(() => {
    setLoading(true);
    getPRById(prId)
      .then((res) => setPr(res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [prId]);

  if (loading) {
    return <div className="p-4 text-muted">Loading purchase requisition...</div>;
  }
  if (!pr) {
    return (
      <div className="p-4">
        <div className="text-muted mb-3">Couldn't load this purchase requisition.</div>
        <Button color="light" onClick={onBack}>
          <i className="bx bx-arrow-back me-1"></i> Back
        </Button>
      </div>
    );
  }

  const uomLabel = (id) => {
    const u = uoms.find((x) => x._id === (id?._id || id));
    return u ? u.symbol || u.name : "";
  };
  const totalQty = (pr.lineItems || []).reduce((s, li) => s + (li.quantity || 0), 0);

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>
            {pr.prNumber}{" "}
            <Badge
              color={
                pr.status === "approved"
                  ? "success"
                  : pr.status === "submitted"
                    ? "warning"
                    : pr.status === "rejected"
                      ? "danger"
                      : "secondary"
              }
              className="ms-2"
            >
              {PR_STATUS_LABELS[pr.status] || pr.status}
            </Badge>
          </h4>
          <p className="mb-0">{pr.prTitle}</p>
        </div>
        <Button color="light" onClick={onBack}>
          <i className="bx bx-arrow-back me-1"></i> Back
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <div className="uom-table-card p-3 h-100">
            <div className="text-muted small">Net Payable</div>
            <div className="fs-4 fw-bold">{money(pr.netPayable)}</div>
            <div className="text-muted small">
              Subtotal {money(pr.subtotal)} + Tax {money(pr.taxAmount)}
            </div>
          </div>
        </Col>
        <Col md={3}>
          <div className="uom-table-card p-3 h-100">
            <div className="text-muted small">Required By</div>
            <div className="fs-5 fw-semibold">{dateFmt(pr.requiredByDate)}</div>
            <div className="text-muted small">PR date {dateFmt(pr.prDate)}</div>
          </div>
        </Col>
        <Col md={3}>
          <div className="uom-table-card p-3 h-100">
            <div className="text-muted small">Lines</div>
            <div className="fs-5 fw-semibold">{(pr.lineItems || []).length}</div>
            <div className="text-muted small">{totalQty} qty requested</div>
          </div>
        </Col>
        <Col md={3}>
          <div className="uom-table-card p-3 h-100">
            <div className="text-muted small">Urgency</div>
            <div className="fs-5 fw-semibold text-capitalize">{pr.urgencyLevel || "—"}</div>
            <div className="text-muted small text-capitalize">{pr.prType || ""} PR</div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <SectionCard icon="bx-list-ul" title="Line Items">
            <div style={{ overflowX: "auto" }}>
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Tax %</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(pr.lineItems || []).map((li, idx) => (
                    <tr key={li._id || idx}>
                      <td>
                        <div className="fw-semibold">{li.itemName}</div>
                        {li.description && li.description !== li.itemName && (
                          <div className="text-muted small">{li.description}</div>
                        )}
                        {(li.category || li.subCategory) && (
                          <div className="text-muted small">
                            {[li.category, li.subCategory].filter(Boolean).join(" › ")}
                          </div>
                        )}
                        {li.remarks && <div className="text-muted small">Note: {li.remarks}</div>}
                      </td>
                      <td>{li.hsnCode || "—"}</td>
                      <td>
                        {li.quantity} {uomLabel(li.uomId)}
                      </td>
                      <td>{money(li.unitPrice)}</td>
                      <td>{li.taxPercent || 0}%</td>
                      <td className="text-end fw-semibold">{money(li.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {pr.remarks && (
            <SectionCard icon="bx-note" title="Remarks">
              <div style={{ whiteSpace: "pre-wrap" }}>{pr.remarks}</div>
            </SectionCard>
          )}

          {(pr.attachments || []).length > 0 && (
            <SectionCard icon="bx-paperclip" title="Attachments">
              {pr.attachments.map((a) => (
                <div key={a._id || a.url} className="mb-1">
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    {a.originalName || "Attachment"}
                  </a>
                </div>
              ))}
            </SectionCard>
          )}
        </Col>

        <Col lg={4}>
          <SectionCard icon="bx-building" title="Request Details">
            <Field label="Department" value={pr.departmentId?.name} />
            <Field label="Delivery Site" value={pr.deliverySiteId?.title} />
            <Field
              label="Budget"
              value={
                pr.budgetId
                  ? `${pr.budgetId.fiscalYear} (approved ${money(pr.budgetId.approvedAmount)})`
                  : ""
              }
            />
            <Field
              label="Preferred Vendor"
              value={pr.preferredVendorId?.tradeName || pr.preferredVendorId?.legalName}
            />
            <Field label="Contract / Project Ref" value={pr.contractOrProjectRef} />
            <Field label="Requested By" value={pr.requestedBy?.name || pr.requestedBy?.email} />
          </SectionCard>

          <SectionCard icon="bx-check-shield" title="Approval">
            <Field label="Status" value={PR_STATUS_LABELS[pr.status] || pr.status} />
            {pr.submittedAt && <Field label="Submitted On" value={dateFmt(pr.submittedAt)} />}
            {pr.approvedAt && (
              <>
                <Field
                  label="Approved By"
                  value={pr.approvedBy?.name || pr.approvedBy?.email}
                />
                <Field label="Approved On" value={dateFmt(pr.approvedAt)} />
              </>
            )}
            {pr.rejectionReason && (
              <Field label="Sent back — reason" value={pr.rejectionReason} />
            )}
          </SectionCard>
        </Col>
      </Row>
    </div>
  );
};

export default PROverview;
