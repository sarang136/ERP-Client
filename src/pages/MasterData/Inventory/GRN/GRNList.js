import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import { getGRNs } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const dateTimeFmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const tableCustomStyles = {
  headRow: {
    style: { backgroundColor: "#fff", borderBottom: "1px solid #edeff3", minHeight: "44px" },
  },
  headCells: { style: { fontSize: "13px", fontWeight: 600, color: "#475569" } },
  rows: {
    style: {
      minHeight: "56px",
      fontSize: "14px",
      color: "#101828",
      "&:not(:last-of-type)": { borderBottomColor: "#edeff3" },
    },
    highlightOnHoverStyle: {
      backgroundColor: "#fafbfc",
      borderBottomColor: "#edeff3",
      outline: "none",
    },
  },
  pagination: { style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" } },
};

const GRNList = ({ onAdd }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "GRN", "WRITE");

  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchGRNs = async () => {
      setLoading(true);
      try {
        const res = await getGRNs({ search });
        if (cancelled) return;
        setGrns(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(error?.response?.data?.message || error?.message || "Couldn't load GRNs.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGRNs();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = [
    { name: "GRN Number", selector: (row) => row.grnNumber, sortable: true, width: "160px" },
    {
      name: "PO Number",
      width: "160px",
      cell: (row) => <span className="uom-cell-muted">{row.poId?.poNumber || "—"}</span>,
    },
    {
      name: "Vendor",
      minWidth: "170px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.poId?.vendorId?.tradeName || row.poId?.vendorId?.legalName || "—"}
        </span>
      ),
    },
    {
      name: "Site",
      minWidth: "120px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.poId?.deliverySiteId?.title || "—"}</span>
      ),
    },
    {
      name: "DI Reference",
      width: "160px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.deliveryIntimationId?.intimationNumber || "—"}</span>
      ),
    },
    {
      name: "Qty (Received / Ordered)",
      width: "170px",
      cell: (row) => {
        const received = (row.lineItems || []).reduce((s, li) => s + (li.receivedQty || 0), 0);
        const ordered = (row.lineItems || []).reduce((s, li) => s + (li.orderedQty || 0), 0);
        return (
          <span className="uom-cell-muted">
            {received} / {ordered}
          </span>
        );
      },
    },
    {
      name: "Attachment",
      width: "130px",
      cell: (row) =>
        row.attachment?.url ? (
          <Button
            size="sm"
            color="light"
            title={row.attachment.originalName}
            onClick={() => setPreviewFile(row.attachment)}
          >
            <i className="bx bx-show me-1"></i> View
          </Button>
        ) : (
          <span className="uom-cell-muted">—</span>
        ),
    },
    {
      name: "Received By",
      minWidth: "180px",
      cell: (row) => (
        <div className="py-1">
          <span className="uom-cell-muted">{row.createdBy?.name || "—"}</span>
          <div className="small text-muted">{dateTimeFmt(row.receivedDate)}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Goods Receipt Notes</h4>
          <p>Physical verification of items received against Purchase Orders</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search GRN number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Create GRN
          </Button>
        )}
      </div>

      <div className="uom-table-card" style={{ overflowX: "auto" }}>
        <DataTable
          columns={columns}
          data={grns}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No GRNs found</p>
              <p className="uom-empty-sub">Create one from an approved Purchase Order.</p>
            </div>
          }
        />
      </div>

      <Modal isOpen={!!previewFile} toggle={() => setPreviewFile(null)} centered size="xl">
        <ModalBody className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-semibold text-truncate" style={{ maxWidth: "70%" }}>
              {previewFile?.originalName || "Attachment"}
            </div>
            <div className="d-flex gap-2">
              <a
                className="btn btn-light btn-sm"
                href={previewFile?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bx bx-link-external me-1"></i> Open in new tab
              </a>
              <Button size="sm" color="light" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </div>
          </div>
          {previewFile &&
            (/\.(png|jpe?g|gif|webp)$/i.test(previewFile.originalName || previewFile.url) ? (
              <img
                src={previewFile.url}
                alt="GRN attachment"
                style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto" }}
              />
            ) : (
              <iframe
                title="GRN attachment preview"
                src={previewFile.url}
                style={{ width: "100%", height: "75vh", border: 0 }}
              />
            ))}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default GRNList;