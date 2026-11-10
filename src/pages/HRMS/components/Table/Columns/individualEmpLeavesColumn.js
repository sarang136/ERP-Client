import { Badge } from "reactstrap";

const Center = ({ children }) => (
  <div className="text-center w-100">{children}</div>
);


const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const SHIFT_TYPE_LABELS = {
  FULL_DAY: "Full Day",
  FIRST_HALF: "First Half",
  SECOND_HALF: "Second Half",
};

const formatShiftType = (shiftTime) =>
  SHIFT_TYPE_LABELS[shiftTime] || shiftTime || "-";

export const IndividualLeavesColumn = () => [
  {
    name: <div className="text-center">Leave Type</div>,
    selector: (row) =>
      row?.leaveType === "LEAVE_WTIHOUT_PAYS"
        ? "LEAVE_WITHOUT_PAYS"
        : row?.leaveType || "-",
    sortable: true,
    center: true,
    minWidth: "200px",
  },
  {
    name: <div className="text-center">From</div>,
    selector: (row) => formatDate(row.fromDate),
    center: true,
    minWidth: "140px",
  },
  {
    name: <div className="text-center">To</div>,
    selector: (row) => formatDate(row.toDate),
    grow: 1,
    minWidth: "140px",
    center: true,
  },

  {
    name: <div className="text-center">Shift Type</div>,
    selector: (row) => formatShiftType(row?.shiftTime),
    grow: 1,
    minWidth: "140px",
    center: true,
  },
  {
    name: <div className="text-center">No.of days</div>,
    selector: (row) => row?.days ?? "-",
    grow: 1,
    minWidth: "140px",
    center: true,
  },
  {
    name: <div className="text-center">Reason</div>,
    cell: (row) => (
      <div
        style={{
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.4",
          padding: "4px 0",
        }}
      >
        {row?.leaveReason || "-"}
      </div>
    ),
    grow: 2,
    minWidth: "180px",
    center: true,
  },
  {
    name: <Center>Status</Center>,
    cell: (row) => {
      const status = row?.status?.toLowerCase();

      if (status === "approved")
        return (
          <Center>
            <Badge pill color="success">
              Approved
            </Badge>
          </Center>
        );

      if (status === "pending")
        return (
          <Center>
            <Badge pill color="warning">
              Pending
            </Badge>
          </Center>
        );

      if (status === "rejected")
        return (
          <Center>
            <Badge pill color="danger">
              Rejected
            </Badge>
          </Center>
        );
      if (status === "retrieved")
        return (
          <Center>
            <Badge pill color="secondary">
              Retrieved
            </Badge>
          </Center>
        );

      return (
        <Center>
          <Badge pill color="secondary">
            Unknown
          </Badge>
        </Center>
      );
    },
    width: "120px",
  },
  {
    name: <div className="text-center">Action On</div>,
    selector: (row) => formatDate(row?.actionOn) || "-",
    grow: 1,
    minWidth: "140px",
    center: true,
  },
  {
    name: <div className="text-center">Regularized For</div>,
    selector: (row) =>
      row?.regularizedDates?.length
        ? row.regularizedDates
            .map((d) =>
              new Date(d).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            )
            .join(", ")
        : "-",
    grow: 1,
    minWidth: "140px",
    center: true,
  },
];
