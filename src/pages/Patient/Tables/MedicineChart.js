// import React from "react";
// import PropTypes from "prop-types";
// import DataTable from "react-data-table-component";

// const MedicineChart = ({ medicines, isPharmacy, onDosageChange }) => {
//   const handleTotalChange = (index, value) => {
//     const updatedMedicine = {
//       ...medicines[index],
//       totalCount: value,
//     };
//     onDosageChange(index, updatedMedicine);
//   };

//   const columns = [
//     {
//       name: "Medicine",
//       selector: (row) =>
//         `${row.medicine?.type || ""} ${row.medicine?.name || ""} ${row.medicine?.strength || ""} ${row.medicine?.unit || ""}`,
//       style: { textTransform: "capitalize" },
//       wrap: true,
//     },
//     {
//       name: <div>Dosage & Frequency</div>,
//       cell: (row) => {
//         const freq = row.dosageAndFrequency || {};
//         return (
//           <div>{`${freq.morning || 0} - ${freq.evening || 0} - ${freq.night || 0}`}</div>
//         );
//       },
//       wrap: true,
//     },
//     {
//       name: "Duration",
//       selector: (row) => `${row?.duration || ""} ${row?.unit || ""}`,
//       wrap: true,
//     },
//     {
//       name: "Intake",
//       cell: (row) => (
//         <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
//           {row?.instructions ? `${row?.instructions}, ` : ""}
//           {row?.intake || ""}
//         </div>
//       ),
//       wrap: true,
//     },
//     ...(isPharmacy
//       ? [
//         {
//           name: "Total Count",
//           cell: (row, index) => {
//             const freq = row.dosageAndFrequency || {};
//             const defaultTotal =
//               (Number(freq.morning) || 0) +
//               (Number(freq.evening) || 0) +
//               (Number(freq.night) || 0);
//             return (
//               <input
//                 type="number"
//                 min="0"
//                 value={row.totalCount ?? defaultTotal}
//                 onChange={(e) => handleTotalChange(index, e.target.value)}
//                 style={{
//                   width: "70px",
//                   textAlign: "center",
//                   border: "1px solid #ccc",
//                   borderRadius: "4px",
//                   fontSize: "13px",
//                   padding: "2px 4px",
//                 }}
//               />
//             );
//           },
//           center: true,
//           wrap: true,
//         },
//       ]
//       : []),
//   ];

//   return (
//     <div className="px-2">
//       <DataTable
//         columns={columns}
//         data={medicines}
//         customStyles={{
//           cells: {
//             style: { minHeight: "48px", alignItems: "center" },
//           },
//         }}
//       />
//     </div>
//   );
// };

// MedicineChart.propTypes = {
//   medicines: PropTypes.array.isRequired,
//   isPharmacy: PropTypes.bool,
//   onDosageChange: PropTypes.func,
// };

// export default MedicineChart;


import React from "react";
import PropTypes from "prop-types";
import DataTable from "react-data-table-component";
import moment from "moment";
import { getMedicineFrequencyLabel, formatDosage } from "../../../helpers/prescriptionFrequency";
import { getMedicineEndDate } from "../../../helpers/currentMedicines";
import { capitalizeWords } from "../../../utils/toCapitalize";
import CheckPermission from "../../../Components/HOC/CheckPermission";

const MedicineChart = ({
  medicines,
  handleDispensedCountChange,
  isPharmacy,
  baseDate,
  currentUserId,
  onDiscontinue,
  showDates = false,
  showOwner = false,
  fallbackPrescriber,
  readOnly = false,
}) => {
  // The owner badge stands on its own (read-only views want it too); the
  // action column only appears where discontinuing is actually offered.
  const showOwnerColumn = showOwner || !!onDiscontinue;
  const columns = [
    {
      name: "Medicine",
      selector: (row) => {
        // A medicine stopped early stays on the prescription it was written
        // on — the row is tinted red and labelled (not struck through, which
        // made the drug name hard to read), so an old chart never reads as if
        // the drug were still running. Medicines that simply ran out their
        // course are left as they are.
        const isDiscontinued = row.status === "discontinued";
        const stoppedBy = capitalizeWords(row.discontinuedBy?.name);

        return (
          <div className="d-flex flex-column">
            <span>
              {row.medicine?.type} {row.medicine?.name} {row.medicine?.strength}
            </span>
            {isDiscontinued && (
              <span className="text-danger" style={{ fontSize: "12px" }}>
                <span
                  className="badge bg-danger text-white me-1"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.3px",
                    padding: "2px 5px",
                  }}
                >
                  DISCONTINUED
                </span>
                {stoppedBy ? `by ${stoppedBy}` : ""}
                {row.discontinuedAt
                  ? ` on ${moment(row.discontinuedAt).format("DD MMM, YYYY")}`
                  : ""}
              </span>
            )}
            {/* {isPharmacy && row.availableStock !== undefined && (row.dispensedCount > row.availableStock || row.totalQuantity > row.availableStock) && (
              <span className="text-danger small fw-bold">
                ⚠ Only {row.availableStock} left
              </span>
            )} */}
          </div>
        );
      },
      style: {
        textTransform: "capitalize",
      },
      wrap: true,
      minWidth:"120px"
    },
    {
      name: (
        <div style={{ textAlign: "center" }}>
          <div>Dosage & Frequency</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100px",
              margin: "0 auto",
              fontSize: "12px",
              marginTop: "2px",
            }}
          >
            <span>Mor</span>
            <span>-</span>
            <span>Aft</span>
            <span>-</span>
            <span>Eve</span>
          </div>
        </div>
      ),

      selector: (row) => {
        const periods = row.schedules?.length ? row.schedules : null;
        if (!periods) {
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100px",
                margin: "0 auto",
                textAlign: "center",
              }}
            >
              <span>{formatDosage(row.dosageAndFrequency?.morning, row.dosageAndFrequency?.unit) || "-"}</span>
              <span>-</span>
              <span>{formatDosage(row.dosageAndFrequency?.evening, row.dosageAndFrequency?.unit) || "-"}</span>
              <span>-</span>
              <span>{formatDosage(row.dosageAndFrequency?.night, row.dosageAndFrequency?.unit) || "-"}</span>
            </div>
          );
        }
        return (
          <div style={{ width: "100%" }}>
            {periods.map((p, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  lineHeight: "20px",
                  padding: "1px 0",
                  borderTop: i > 0 ? "1px dashed #dde3ee" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100px",
                  margin: "0 auto",
                }}
              >
                <span>{formatDosage(p.dosageAndFrequency?.morning, p.dosageAndFrequency?.unit) || "0"}</span>
                <span>-</span>
                <span>{formatDosage(p.dosageAndFrequency?.evening, p.dosageAndFrequency?.unit) || "0"}</span>
                <span>-</span>
                <span>{formatDosage(p.dosageAndFrequency?.night, p.dosageAndFrequency?.unit) || "0"}</span>
              </div>
            ))}
          </div>
        );
      },

      wrap: true,
      center: true,
      minWidth:"200px"
    },
    {
      name: "Duration",
      selector: (row) => {
        const periods = row.schedules?.length ? row.schedules : null;
        if (!periods) {
          return `${row?.duration} ${row?.unit} - ${getMedicineFrequencyLabel(row)}`;
        }
        return (
          <div>
            {periods.map((p, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  lineHeight: "20px",
                  padding: "1px 0",
                  borderTop: i > 0 ? "1px dashed #dde3ee" : "none",
                }}
              >
                {p.duration} {p.unit} - {getMedicineFrequencyLabel(p)}
              </div>
            ))}
          </div>
        );
      },
      wrap: true,
    },
    ...(showDates
      ? [
        {
          name: "From",
          selector: (row) => {
            const periods = row.schedules?.length ? row.schedules : null;
            if (!periods) {
              const from = row?.startDate || baseDate;
              return from ? moment(from).format("DD MMM, YYYY") : "-";
            }
            return (
              <div>
                {periods.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "12px",
                      lineHeight: "20px",
                      padding: "1px 0",
                      borderTop: i > 0 ? "1px dashed #dde3ee" : "none",
                    }}
                  >
                    {p.startDate ? moment(p.startDate).format("DD MMM, YYYY") : "-"}
                  </div>
                ))}
              </div>
            );
          },
          wrap: true,
        },
        {
          name: "To",
          selector: (row) => {
            const periods = row.schedules?.length ? row.schedules : null;
            if (!periods) {
              const from = row?.startDate || baseDate;
              const to =
                row?.endDate || (from ? getMedicineEndDate(from, row) : null);
              return to ? moment(to).format("DD MMM, YYYY") : "Ongoing";
            }
            return (
              <div>
                {periods.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "12px",
                      lineHeight: "20px",
                      padding: "1px 0",
                      borderTop: i > 0 ? "1px dashed #dde3ee" : "none",
                    }}
                  >
                    {p.endDate ? moment(p.endDate).format("DD MMM, YYYY") : "Ongoing"}
                  </div>
                ))}
              </div>
            );
          },
          wrap: true,
        },
      ]
      : []),
    {
      name: "Intake",
      cell: (row) => {
        const periods = row.schedules?.length ? row.schedules : null;
        if (!periods) {
          return (
            <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
              {row?.instructions ? `${row?.instructions}, ` : ""}
              {row?.intake || ""}
            </div>
          );
        }
        return (
          <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {periods.map((p, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  lineHeight: "20px",
                  padding: "1px 0",
                  borderTop: i > 0 ? "1px dashed #dde3ee" : "none",
                }}
              >
                {p.instructions ? `${p.instructions}, ` : ""}
                {p.intake || ""}
              </div>
            ))}
          </div>
        );
      },
      wrap: true,
      // selector: (row, idx) =>
      //   row?.instructions ? `${row?.instructions}, ` : "" + row?.intake || "",
      //       style: {
      //   whiteSpace: "normal",
      // },
    },
    ...(showOwnerColumn
      ? [
        {
          name: "Prescribed by",
          cell: (row) => {
            // prescribedBy arrives populated on charts and as a plain id from
            // the current-medicines endpoint (which sends prescribedByUser
            // alongside). Rows saved before prescribedBy existed fall back to
            // whoever authored the chart they sit on.
            const prescriber =
              (row.prescribedBy && typeof row.prescribedBy === "object"
                ? row.prescribedBy
                : row.prescribedByUser) || fallbackPrescriber;
            const ownerId =
              row.prescribedBy?._id ||
              row.prescribedBy ||
              fallbackPrescriber?._id;
            const isOwn =
              ownerId && currentUserId
                ? String(ownerId) === String(currentUserId)
                : false;

            // Only your own rows get a badge — everyone else's prescriber is
            // shown as plain text.
            return isOwn ? (
              <span className="badge bg-success">You</span>
            ) : (
              <span>{capitalizeWords(prescriber?.name) || "-"}</span>
            );
          },
          wrap: true,
          minWidth: "120px",
        },
      ]
      : []),
    ...(onDiscontinue
      ? [
        {
          name: "",
          cell: (row) => {
            if (row.status === "discontinued") return null;

            // Any doctor may stop any medicine, not just the one who
            // prescribed it — the action is recorded against them.
            return (
              <CheckPermission permission={"edit"} subAccess="Charting">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger text-nowrap"
                  onClick={() => onDiscontinue(row)}
                >
                  Discontinue
                </button>
              </CheckPermission>
            );
          },
          // Fixed width and no wrapping, otherwise the narrow action column
          // breaks the button label across lines.
          width: "150px",
          center: true,
          wrap: false,
        },
      ]
      : []),
    // Dispensed Count column — commented out for the read-only prescription
    // view in medicine approval (readOnly), kept for the live approve flow.
    ...(isPharmacy && !readOnly
      ? [
        {
          name: "Dispensed Count",
          cell: (row) => {
            return (
              <input
                type="number"
                min="0"
                value={row.dispensedCount ?? row.totalQuantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleDispensedCountChange(row._id, val < 0 ? 0 : val);
                }}
                style={{
                  width: "70px",
                  textAlign: "center",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "13px",
                  padding: "2px 4px",
                }}
              />

            );
          },
          center: true,
          wrap: true,
        },
      ]
      : []),
  ];

  return (
    <React.Fragment>
      <div className="px-2">
        <DataTable
          columns={columns}
          data={medicines}
          // A stopped medicine stays on the prescription it was written on,
          // tinted rather than struck through so the drug name stays readable.
          conditionalRowStyles={[
            {
              when: (row) => row.status === "discontinued",
              style: {
                backgroundColor: "rgba(240, 101, 72, 0.22)",
                borderLeft: "5px solid #f06548",
              },
            },
          ]}
        />
        {/* <Row className="bg-white">
          <Col xs={3} className="border-bottom">
            <span className="font-semi-bold fs-6">Medicine</span>{" "}
          </Col>
          <Col xs={3} className="border-bottom">
            <span className="font-semi-bold fs-6">Dosage & Frequency</span>
          </Col>
          <Col xs={3} className="border-bottom">
            <span className="font-semi-bold fs-6">Intake</span>
          </Col>
          <Col xs={3} className="border-bottom">
            <span className="font-semi-bold fs-6">Duration</span>
          </Col>
          {(medicines || []).map((medicine) => (
            <React.Fragment key={medicine._id}>
              <Col xs={3} className="py-2">
                <span className="font-semi-bold">
                  {medicine.medicine?.name}
                </span>
              </Col>
              <Col xs={3} className="py-2">
                <span className="font-semi-bold">
                  {medicine.dosageAndFrequency?.morning || ""}-
                  {medicine.dosageAndFrequency?.evening || ""}-
                  {medicine.dosageAndFrequency?.night || ""}
                </span>
              </Col>
              <Col xs={3} className="py-2">
                <span className="font-semi-bold">
                  {medicine?.duration} {medicine?.unit}
                </span>
              </Col>
              <Col xs={3} className="py-2">
                <span className="font-semi-bold">
                  {medicine?.instructions ? `${medicine?.instructions}, ` : ""}
                  {medicine?.intake || ""}
                </span>
              </Col>
            </React.Fragment>
          ))}
        </Row> */}
      </div>
    </React.Fragment>
  );
};

MedicineChart.propTypes = {
  medicines: PropTypes.array.isRequired,
  isPharmacy: PropTypes.bool,
  readOnly: PropTypes.bool,
  handleDispensedCountChange: PropTypes.func,
  baseDate: PropTypes.any,
  currentUserId: PropTypes.string,
  onDiscontinue: PropTypes.func,
  showDates: PropTypes.bool,
  showOwner: PropTypes.bool,
  fallbackPrescriber: PropTypes.object,
};

export default MedicineChart;
