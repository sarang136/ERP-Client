import DataTable from "react-data-table-component";
import { Badge, Button, Spinner } from "reactstrap";
import {
  SEVERITY_COLOR,
  SEVERITY_HEX,
  PHASE_META,
  ALERT_SOURCE_META,
  RECIPIENT_ROLES,
  RECIPIENT_VIA_NOTE,
} from "./alertConstants";
import {
  timeAgo,
  isRuleSourced,
  alertSourceLabel,
  alertCategoryLabel,
  isResolutionNote,
  isComplianceAlert,
  complianceCentrePath,
} from "./alertUtils";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTotalAmount, viewPatient } from "../../../store/actions";
import "./AlertsList.css";

// Tabular alerts view. One row per SOPAlert. Click a row → opens the
// offcanvas (pre-existing behaviour). Pagination is server-driven via the
// `useAlertsInbox` hook.
//
// `react-data-table-component` v7 fires onRowClicked only when the click
// target has the EXACT attribute data-tag="allowRowEvents" — it does not
// walk up the DOM. So every element inside a custom cell renderer that a
// user might click on (badges, inner divs, <small>, icons) must carry the
// attribute, or clicks on the visible text are silently dropped.
const RC = { "data-tag": "allowRowEvents" };

// Matches the selectors in AlertsList.css.
const RESOLUTION_COLUMN_ID = "resolution";

// The names in one role column (Doctor, Nurse, …): who in that role sees the
// alert. Long lists scroll inside the cell, like the notes.
const RecipientNames = ({ list }) => {
  if (!list?.length) {
    return (
      <small {...RC} className="text-muted">
        —
      </small>
    );
  }
  return (
    <div {...RC} className="py-1" style={{ maxHeight: 110, overflowY: "auto", width: "100%" }}>
      {list.map((r) => (
        <div {...RC} key={r._id} style={{ fontSize: "0.75rem", lineHeight: 1.35, marginBottom: 2 }}>
          {r.name}
          {RECIPIENT_VIA_NOTE[r.via] && (
            <small {...RC} className="d-block text-muted" style={{ fontSize: "0.65rem" }}>
              {RECIPIENT_VIA_NOTE[r.via]}
            </small>
          )}
        </div>
      ))}
    </div>
  );
};

const recipientColumns = RECIPIENT_ROLES.map(({ key, label }) => ({
  id: `recipients-${key}`,
  name: label,
  width: "160px",
  cell: (row) => <RecipientNames list={row.recipients?.[key]} />,
}));

const AlertsList = ({
  alerts,
  total,
  page,
  pageSize,
  loading,
  canResolve,
  onSelect,
  onResolve,
  onAddNote,
  onPageChange,
  onPageSizeChange,
}) => {
  const dispatch = useDispatch();

  const columns = [
    // Resolution comes first and stays pinned to the left while the table
    // scrolls sideways (AlertsList.css, keyed on this id).
    {
      id: RESOLUTION_COLUMN_ID,
      name: "Resolution",
      width: "180px",
      ignoreRowClick: true,
      cell: (row) =>
        row.resolution?.resolved ? (
          <div className="py-1" style={{ whiteSpace: "normal", minWidth: 0 }}>
            <Badge
              color="success"
              pill
              className="d-inline-flex align-items-center mb-1"
            >
              <i className="bx bx-check-circle me-1" />
              Resolved
            </Badge>
            {row.resolution?.resolvedByName && (
              <div style={{ fontSize: "0.72rem", color: "#6c757d", lineHeight: 1.3 }}>
                <i className="bx bx-user me-1" />
                {row.resolution.resolvedByName}
              </div>
            )}
            {row.resolution?.resolvedAt && (
              <div style={{ fontSize: "0.72rem", color: "#6c757d" }}>
                {new Date(row.resolution.resolvedAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        ) : canResolve ? (
          <Button
            size="sm"
            color="success"
            outline
            onClick={(e) => {
              e.stopPropagation();
              onResolve(row);
            }}
          >
            <i className="bx bx-check me-1" />
            Resolve
          </Button>
        ) : (
          <small className="text-muted">—</small>
        ),
    },
    {
      name: "",
      width: "6px",
      cell: (row) => (
        <div
          style={{
            width: 4,
            height: 36,
            background: SEVERITY_HEX[row.severity] || "#6c757d",
          }}
        />
      ),
      ignoreRowClick: true,
    },
    {
      name: "Severity",
      width: "115px",
      cell: (row) => (
        <Badge
          {...RC}
          color={SEVERITY_COLOR[row.severity] || "secondary"}
          pill
        >
          {row.severity}
        </Badge>
      ),
    },
    {
      name: "Phase",
      width: "130px",
      cell: (row) => {
        const phase = PHASE_META[row.phase] || PHASE_META.IMMEDIATE;
        return (
          <Badge
            {...RC}
            color={phase.color}
            pill
            className="d-inline-flex align-items-center"
          >
            <i {...RC} className={`${phase.icon} me-1`} />
            {phase.label}
          </Badge>
        );
      },
    },
    {
      name: "Patient / Licence",
      grow: 1.2,
      // A licence alert has no patient — show the licence and link to the
      // centre's Compliance page instead.
      cell: (row) => isComplianceAlert(row) ? (
        <Link
          key={row._id}
          to={complianceCentrePath(row)}
          className="dropdown-item fs-13 notify-item"
        >
          <div {...RC}>
            <div {...RC} className={row.isRead ? "" : "fw-semibold"}>
              <i {...RC} className="bx bx-certification me-1" />
              {row.complianceInfo?.typeName || "Licence"}
            </div>
            {row.complianceInfo?.licenceNumber && (
              <small {...RC} className="text-muted">
                {row.complianceInfo.licenceNumber}
              </small>
            )}
          </div>
        </Link>
      ) : (
        <Link
          key={row.patient?._id}
          to={`/patient/${row.patient?._id}`}
          onClick={() => {
            dispatch(viewPatient(row.patient));
            dispatch(
              setTotalAmount({
                totalPayable: 0,
                totalAdvance: 0,
              })
            );
          }}
          className="dropdown-item fs-13 notify-item"
        > <div {...RC}>
            <div {...RC} className={row.isRead ? "" : "fw-semibold"}>
              {row.patient?.name || "Unknown"}
            </div>
            {row.patient?.uid && (
              <small {...RC} className="text-muted">
                UID {row.patient.uid}
              </small>
            )}
          </div></Link>

      ),
    },
    {
      name: "Center",
      width: "120px",
      cell: (row) => (
        <div {...RC}>
          <small {...RC} className="text-muted">
            {row.center?.title || "—"}
          </small>
        </div>
      ),
    },
    {
      name: "Source",
      width: "150px",
      cell: (row) => (
        <div {...RC}>
          <div {...RC} className={row.isRead ? "text-muted" : "fw-semibold"}>
            {alertSourceLabel(row)}
          </div>
          {/* Only badge the exceptions — a rule-sourced alert is the norm and
              labelling every row would be noise. Every element in a custom cell
              needs {...RC} or row clicks are silently dropped. */}
          {!isRuleSourced(row) && (
            <Badge
              {...RC}
              color={ALERT_SOURCE_META[row.source]?.color || "secondary"}
              className="mt-1"
            >
              {ALERT_SOURCE_META[row.source]?.label || row.source}
            </Badge>
          )}
        </div>
      ),
    },
    {
      name: "Category",
      width: "150px",
      cell: (row) => {
        const label = alertCategoryLabel(row);
        return label ? (
          <span {...RC} className="badge rounded-pill badge-soft-info text-wrap text-start">
            {label}
          </span>
        ) : (
          <small {...RC} className="text-muted">
            —
          </small>
        );
      },
    },
    {
      name: "Block",
      grow: 1.5,
      cell: (row) => (
        <div {...RC}>
          {row.blockName && (
            <small {...RC} className="text-muted">
              {row.blockName}
            </small>
          )}
        </div>
      ),
    },
    {
      name: "Window",
      width: "150px",
      cell: (row) =>
        row.window?.label ? (
          <Badge
            {...RC}
            color="light"
            pill
            className="text-dark border"
            style={{ whiteSpace: "normal", textAlign: "left" }}
          >
            <i className="bx bx-calendar me-1" />
            {row.window.label}
          </Badge>
        ) : (
          <small {...RC} className="text-muted">
            —
          </small>
        ),
    },
    {
      name: "Routed To",
      width: "210px",
      wrap: true,
      cell: (row) => {
        const r = row.routing || {};
        const roles = r.notifyRoles || [];
        const users = row._specificUsersDetailed || [];
        const hasAny =
          roles.length ||
          users.length ||
          r.notifyAdmissionDoctor ||
          r.notifyAdmissionPsychologist;
        const badgeStyle = {
          whiteSpace: "normal",
          wordBreak: "break-word",
          maxWidth: "100%",
          textAlign: "left",
        };
        return (
          <div
            {...RC}
            className="d-flex flex-wrap gap-1 py-1"
            style={{ maxWidth: "100%", overflow: "hidden" }}
          >
            {roles.map((role) => (
              <Badge {...RC} key={`role-${role}`} color="info" pill style={badgeStyle}>
                {role}
              </Badge>
            ))}
            {r.notifyAdmissionDoctor && (
              <Badge {...RC} color="warning" pill style={badgeStyle}>
                Patient&apos;s Doctor
              </Badge>
            )}
            {r.notifyAdmissionPsychologist && (
              <Badge {...RC} color="warning" pill style={badgeStyle}>
                Patient&apos;s Psychologist
              </Badge>
            )}
            {users.map((u, i) => (
              <Badge {...RC} key={`user-${i}`} color="secondary" pill style={badgeStyle}>
                {u}
              </Badge>
            ))}
            {!hasAny && (
              <small {...RC} className="text-muted">
                —
              </small>
            )}
          </div>
        );
      },
    },
    // Doctor, Psychologist, MSW, RMO, Nurse, Center Manager.
    ...recipientColumns,
    {
      name: "Message",
      grow: 2,
      cell: (row) => (
        <div
          {...RC}
          className={row.isRead ? "text-muted" : ""}
          style={{
            whiteSpace: "normal",
            lineHeight: 1.35,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {row.message}
        </div>
      ),
    },
    {
      name: "When",
      width: "120px",
      cell: (row) => (
        <small {...RC} className="text-muted">
          {timeAgo(row.createdAt)}
        </small>
      ),
    },
    {
      name: "",
      width: "70px",
      cell: (row) =>
        !row.isRead ? (
          <Badge {...RC} color="danger" pill>
            NEW
          </Badge>
        ) : null,
    },
    {
      name: "Notes",
      width: "260px",
      // ignoreRowClick so clicking inside the notes cell doesn't open the
      // detail offcanvas.
      ignoreRowClick: true,
      cell: (row) => {
        const notes = row.notes || [];
        return (
          <div style={{ padding: "6px 0", width: "100%" }}>
            {/* Existing notes list */}
            {notes.length > 0 && (
              <div
                style={{
                  maxHeight: 110,
                  overflowY: "auto",
                  marginBottom: 6,
                }}
              >
                {notes.map((n, i) => {
                  // Notes predating the `kind` field have no value at all, so
                  // ordinary is "not RESOLUTION" — never "=== NOTE".
                  const isRes = isResolutionNote(n);
                  return (
                    <div
                      key={i}
                      style={{
                        background: isRes ? "rgba(25, 135, 84, 0.08)" : "#f8f9fa",
                        border: `1px solid ${isRes ? "rgba(25, 135, 84, 0.35)" : "#e9ecef"}`,
                        borderRadius: 6,
                        padding: "5px 8px",
                        marginBottom: 4,
                        fontSize: "0.72rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {isRes && (
                        <Badge
                          {...RC}
                          color="success"
                          className="mb-1"
                          style={{ fontSize: "0.6rem" }}
                        >
                          <i className="bx bx-check-circle me-1" />
                          Resolution
                        </Badge>
                      )}
                      <div style={{ color: "#212529", wordBreak: "break-word" }}>
                        {n.text}
                      </div>
                      <div style={{ color: "#6c757d", marginTop: 2 }}>
                        <i className="bx bx-user me-1" style={{ fontSize: "0.65rem" }} />
                        {n.addedByName || "Unknown"}
                        {n.addedAt && (
                          <>
                            {" · "}
                            {new Date(n.addedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Note button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNote(row);
              }}
              style={{
                background: "transparent",
                border: "1px dashed #0d6efd",
                borderRadius: 6,
                color: "#0d6efd",
                fontSize: "0.75rem",
                padding: "3px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(13,110,253,0.07)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <i className="bx bx-plus" />
              Add Note
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      className="sop-alerts-table"
      columns={columns}
      data={alerts || []}
      pagination
      paginationServer
      paginationTotalRows={total || 0}
      paginationPerPage={pageSize}
      paginationDefaultPage={page}
      paginationRowsPerPageOptions={[10, 25, 50, 100]}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onPageSizeChange}
      onRowClicked={onSelect}
      pointerOnHover
      highlightOnHover
      striped
      responsive
      fixedHeader
      fixedHeaderScrollHeight="calc(100vh - 320px)"
      progressPending={loading}
      progressComponent={
        <div className="py-4 text-center">
          <Spinner className="text-primary" />
        </div>
      }
      noDataComponent={
        <div className="py-4 text-center text-muted">
          <i className="bx bx-bell-off display-6 d-block mb-2" />
          No alerts match these filters.
        </div>
      }
      customStyles={{
        headCells: {
          style: {
            backgroundColor: "#f8f9fa",
            fontWeight: "600",
            borderBottom: "2px solid #e9ecef",
          },
        },
        rows: {
          style: { minHeight: "60px", borderBottom: "1px solid #f1f1f1" },
        },
      }}
    />
  );
};

export default AlertsList;
