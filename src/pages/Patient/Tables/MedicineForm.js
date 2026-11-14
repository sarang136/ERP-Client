import React from "react";
import PropTypes from "prop-types";
import { Col, Input, Row } from "reactstrap";
import {
  medicineTypes,
  medicineUnits,
} from "../../../Components/constants/medicine";
import { connect } from "react-redux";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Menu } from "lucide-react";
import Flatpicker from "react-flatpickr";
import { capitalizeWords } from "../../../utils/toCapitalize";
import "flatpickr/dist/themes/material_green.css";
import {
  getMedicineFrequencyLabel,
  getMedicineFrequencyPreset,
  normalizeMedicineFrequency,
  PRESET_MEDICINE_FREQUENCIES,
} from "../../../helpers/prescriptionFrequency";
import {
  getMedicineEndDate,
  getDaysBetween,
  drugIdentity,
  getScheduleList,
  validateSchedulesSequential,
} from "../../../helpers/currentMedicines";
import { toast } from "react-toastify";
import { isPilotCenterRow } from "../../../helpers/pilotCenter";
import PrescriptionPharmacyStock from "./PrescriptionPharmacyStock";
import { getAvailableMedicineIds } from "../../../helpers/backend_helper";


const SortableMedicine = ({ index, locked, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index, disabled: locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: locked ? 0.75 : 1,
      }}
      className="d-flex align-items-center gap-2"
    >
      <span
        {...(locked ? {} : { ...listeners, ...attributes })}
        style={{
          cursor: locked ? "not-allowed" : "grab",
          marginRight: 6,
          fontSize: window.innerWidth < 768 ? 14 : 20,
          touchAction: "none",
          visibility: locked ? "hidden" : "visible",
        }}
      >
        <Menu />
      </span>
      <div
        className="d-flex align-items-center gap-2 flex-grow-1"
        style={locked ? { pointerEvents: "none", userSelect: "none" } : undefined}
      >
        {children}
      </div>
    </div>
  );
};


const Medicine = ({
  medicines,
  setMedicines,
  isNew,
  showDates = false,
  centerId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  const isPilotCenter = isPilotCenterRow(centerId);

  const medicinesRef = React.useRef(medicines);
  React.useEffect(() => {
    medicinesRef.current = medicines;
  }, [medicines]);

  // In-stock status per "centerId:medicineId" (true / false, null if the check
  // failed, absent while pending). One small request covers every medicine on
  // the form that hasn't been checked yet, instead of one request per row.
  const [stockStatus, setStockStatus] = React.useState({});
  const stockRequested = React.useRef(new Set());
  React.useEffect(() => {
    if (!isPilotCenter || !centerId) return;

    const ids = [
      ...new Set(
        (medicines || []).map((m) => m.medicine?._id).filter(Boolean).map(String)
      ),
    ].filter((id) => !stockRequested.current.has(`${centerId}:${id}`));
    if (!ids.length) return;
    ids.forEach((id) => stockRequested.current.add(`${centerId}:${id}`));

    const record = (available) =>
      setStockStatus((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[`${centerId}:${id}`] = available ? available.has(id) : null;
        });
        return next;
      });

    getAvailableMedicineIds(ids, centerId)
      .then((res) => record(new Set((res?.data || []).map(String))))
      .catch(() => record(null));
  }, [medicines, centerId, isPilotCenter]);

  const handleChange = (e) => {
    const prop = e.target.name;
    const value = e.target.value;
    const index = e.target.id;
    const drugsTable = [...medicines];

    if (prop === "morning" || prop === "evening" || prop === "night") {
      drugsTable[index].dosageAndFrequency = {
        ...drugsTable[index].dosageAndFrequency,
        [prop]: value,
      };
    } else if (prop === "frequency") {
      drugsTable[index].frequencyPreset = "custom";
      drugsTable[index].frequencyType = "interval";
      drugsTable[index][prop] = value;
    } else if (prop === "monthlyDate") {
      drugsTable[index].monthlyDate = value;
    } else if (prop === "frequencyPreset") {
      drugsTable[index].frequencyPreset = value;
      if (value === "monthly") {
        drugsTable[index].frequencyType = "monthly";
        if (!drugsTable[index].monthlyDate) {
          drugsTable[index].monthlyDate = 1;
        }
      } else if (value === "custom") {
        drugsTable[index].frequencyType = "interval";
        const currentFrequency = normalizeMedicineFrequency(
          drugsTable[index].frequency
        );
        drugsTable[index].frequency =
          PRESET_MEDICINE_FREQUENCIES.some(({ value }) => value === currentFrequency)
            ? ""
            : currentFrequency;
      } else {
        drugsTable[index].frequencyType = "interval";
        drugsTable[index].frequency = normalizeMedicineFrequency(value);
      }
    } else {
      drugsTable[index][prop] = value;
    }

    // Editing duration/unit directly drives the To date off the From date.
    if (prop === "duration" || prop === "unit") {
      drugsTable[index].endDate = getMedicineEndDate(
        drugsTable[index].startDate,
        drugsTable[index],
      );
    }

    setMedicines(drugsTable);
  };

  // From/To dates and duration stay in sync in both directions: editing the
  // date range recomputes duration (in days) from the gap between them;
  // editing duration/unit (above) recomputes the To date instead.
  const handleStartDateChange = (idx, date) => {
    const drugsTable = [...medicinesRef.current];
    drugsTable[idx] = { ...drugsTable[idx] };
    drugsTable[idx].startDate = date;
    if (drugsTable[idx].endDate) {
      drugsTable[idx].duration = String(getDaysBetween(date, drugsTable[idx].endDate));
      drugsTable[idx].unit = "Day (s)";
    } else {
      drugsTable[idx].endDate = getMedicineEndDate(date, drugsTable[idx]);
    }
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const handleEndDateChange = (idx, date) => {
    const drugsTable = [...medicinesRef.current];
    drugsTable[idx] = { ...drugsTable[idx] };
    drugsTable[idx].endDate = date;
    drugsTable[idx].duration = String(
      getDaysBetween(drugsTable[idx].startDate, date),
    );
    drugsTable[idx].unit = "Day (s)";
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  // Multiple dosage periods for one medicine (e.g. 500mg day 1-5, then 250mg
  // day 6-10). A medicine only ever carries `schedules` once it has 2+
  // periods — collapsing back to 1 period deletes the key again, so a
  // medicine with a single period always saves in the original flat shape.
  const addSchedulePeriod = (idx) => {
    const drugsTable = [...medicines];
    const med = { ...drugsTable[idx] };
    const existingPeriods = getScheduleList(med);
    const last = existingPeriods[existingPeriods.length - 1];
    const prevEnd = last?.endDate ? new Date(last.endDate) : new Date();
    const start = new Date(prevEnd);
    start.setDate(start.getDate() + 1);
    const newPeriod = {
      startDate: start,
      duration: "30",
      unit: "Day (s)",
      dosageAndFrequency: {
        morning: "",
        evening: "",
        night: "",
        unit: last?.dosageAndFrequency?.unit || "",
      },
      frequency: 1,
      frequencyType: "interval",
      intake: last?.intake || "After food",
      instructions: last?.instructions || "",
    };
    newPeriod.endDate = getMedicineEndDate(start, newPeriod);

    med.schedules = [...existingPeriods, newPeriod];
    drugsTable[idx] = med;
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const removeSchedulePeriod = (idx, pIdx) => {
    const drugsTable = [...medicines];
    const med = { ...drugsTable[idx] };
    const periods = [...(med.schedules || [])];
    periods.splice(pIdx, 1);

    if (periods.length <= 1) {
      // Back down to a single period: drop `schedules` entirely and restore
      // the original flat fields so this medicine saves in the old shape.
      const remaining = periods[0] || getScheduleList(med)[0];
      delete med.schedules;
      med.startDate = remaining.startDate;
      med.endDate = remaining.endDate;
      med.duration = remaining.duration;
      med.unit = remaining.unit;
      med.dosageAndFrequency = remaining.dosageAndFrequency;
      med.frequency = remaining.frequency;
      med.frequencyType = remaining.frequencyType;
      med.monthlyDate = remaining.monthlyDate;
      med.intake = remaining.intake;
      med.instructions = remaining.instructions;
    } else {
      med.schedules = periods;
    }

    drugsTable[idx] = med;
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const handlePeriodChange = (idx, pIdx, prop, value) => {
    const drugsTable = [...medicinesRef.current];
    const med = { ...drugsTable[idx] };
    const periods = [...(med.schedules || [])];
    let period = { ...periods[pIdx] };

    if (prop === "morning" || prop === "evening" || prop === "night" || prop === "doseUnit") {
      period.dosageAndFrequency = {
        ...period.dosageAndFrequency,
        [prop === "doseUnit" ? "unit" : prop]: value,
      };
    } else if (prop === "frequency") {
      period.frequencyPreset = "custom";
      period.frequencyType = "interval";
      period.frequency = value;
    } else if (prop === "monthlyDate") {
      period.monthlyDate = value;
    } else if (prop === "frequencyPreset") {
      period.frequencyPreset = value;
      if (value === "monthly") {
        period.frequencyType = "monthly";
        if (!period.monthlyDate) period.monthlyDate = 1;
      } else if (value === "custom") {
        period.frequencyType = "interval";
        const currentFrequency = normalizeMedicineFrequency(period.frequency);
        period.frequency = PRESET_MEDICINE_FREQUENCIES.some(
          ({ value: v }) => v === currentFrequency,
        )
          ? ""
          : currentFrequency;
      } else {
        period.frequencyType = "interval";
        period.frequency = normalizeMedicineFrequency(value);
      }
    } else {
      period[prop] = value;
    }

    if (prop === "duration" || prop === "unit") {
      period.endDate = getMedicineEndDate(period.startDate, period);
    }

    periods[pIdx] = period;
    med.schedules = periods;
    drugsTable[idx] = med;
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const handlePeriodStartDateChange = (idx, pIdx, date) => {
    const drugsTable = [...medicinesRef.current];
    const med = { ...drugsTable[idx] };
    const periods = [...(med.schedules || [])];
    const period = { ...periods[pIdx], startDate: date };
    if (period.endDate) {
      period.duration = String(getDaysBetween(date, period.endDate));
      period.unit = "Day (s)";
    } else {
      period.endDate = getMedicineEndDate(date, period);
    }
    periods[pIdx] = period;
    med.schedules = periods;
    drugsTable[idx] = med;
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const handlePeriodEndDateChange = (idx, pIdx, date) => {
    const drugsTable = [...medicinesRef.current];
    const med = { ...drugsTable[idx] };
    const periods = [...(med.schedules || [])];
    const period = { ...periods[pIdx], endDate: date };
    period.duration = String(getDaysBetween(period.startDate, date));
    period.unit = "Day (s)";
    periods[pIdx] = period;
    med.schedules = periods;
    drugsTable[idx] = med;
    medicinesRef.current = drugsTable;
    setMedicines(drugsTable);
  };

  const removeDrug = (idx) => {
    const list = [...medicines];
    list.splice(idx, 1);
    setMedicines(list);
  };

  const bulkEditMedDuration = (duration) => {
    const meds = [...medicines]?.map((med) => {
      const updated = { ...med, duration };
      return { ...updated, endDate: getMedicineEndDate(med.startDate, updated) };
    });
    setMedicines(meds);
  };

  const bulkEditFrequency = (frequency) => {
    const normalizedFrequency = normalizeMedicineFrequency(frequency);
    const meds = [...medicines]?.map((med) => ({
      ...med,
      frequency: normalizedFrequency,
    }));
    setMedicines(meds);
  };

  // Swaps the drug on an existing row (dosage, duration etc. stay as the
  // doctor set them) — used when the original isn't in stock.
  const replaceMedicine = (idx, med) => {
    const nextIdentity = drugIdentity(med);
    const duplicate = medicines.some(
      (m, i) => i !== idx && drugIdentity(m.medicine) === nextIdentity,
    );
    if (duplicate) {
      toast.error("This medicine is already on the prescription");
      return;
    }
    const drugsTable = [...medicines];
    drugsTable[idx] = {
      ...drugsTable[idx],
      medicine: {
        _id: med._id,
        name: med.name,
        isNew: false,
        type: med.type || "TAB",
        strength: med.strength || "",
        unit: med.unit || "MG",
      },
    };
    setMedicines(drugsTable);
  };

  const handleMedicineSub = (name, idx, value) => {
    const drugsTable = [...medicines];
    drugsTable[idx].medicine[name] = value;
    setMedicines(drugsTable);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setMedicines((items) => arrayMove(items, active.id, over.id));
    }
  };


  return (
    <React.Fragment>
      <div className="medicine-table overflow-auto bg-light p-3 mb-3">
        <Row className="row-gap-2">
          <Col xs={1} className="border-bottom"></Col>
          <Col xs={2} className="border-bottom">
            <h6 className="display-6 fs-14">Drug</h6>
          </Col>
          <Col xs={3} className="border-bottom">
            <h6 className="display-6 fs-14">Dosage & Frequency</h6>
          </Col>
          <Col xs={2} className="border-bottom">
            <h6 className="display-6 fs-14">Intake</h6>
          </Col>
          <Col xs={2} className="border-bottom">
            <h6 className="display-6 fs-14">Duration</h6>
          </Col>
          <Col xs={2} className="border-bottom">
            <h6 className="display-6 fs-14">Frequency</h6>
          </Col>
          <Col xs={1} className="border-bottom"></Col>


          {/* List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={medicines.map((_, idx) => idx)}
              strategy={verticalListSortingStrategy}
            >
              {(medicines || []).map((medicine, idx) => {
                const periods = medicine.schedules?.length ? medicine.schedules : null;
                return (
                <div
                  key={idx}
                  className="pb-2 mb-2"
                  style={{ borderBottom: "1px solid #6c757d" }}
                >
                <SortableMedicine index={idx} locked={medicine.locked}>
                  <Col xs={2} className="">
                    <span className="font-semi-bold text-uppercase d-flex">
                      <span
                        className={`me-2 ${medicine.medicine.isNew
                          ? "w-50"
                          : ""
                          }`}
                      >
                        {medicine.medicine.isNew ? (
                          <div class="form-group">
                            <input
                              list="type-options"
                              className="form-control form-control-sm"
                              id={idx}
                              onChange={(e) =>
                                handleMedicineSub("type", idx, e.target.value)
                              }
                              required
                              name="type"
                              value={medicine.medicine?.type}
                              placeholder="Type or select an option"
                            />
                            <datalist id="type-options">
                              {(medicineTypes || []).map((item, idx) => (
                                <option
                                  key={idx + item}
                                  value={item}
                                  className="text-cap"
                                ></option>
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          // <Input
                          //   bsSize="xs"
                          //   id={idx}
                          //   onChange={(e) =>
                          //     handleMedicineSub("type", idx, e.target.value)
                          //   }
                          //   name="type"
                          //   required
                          //   value={medicine.medicine.type}
                          //   type="select"
                          //   className="form-control p-0 ps-1 w-5"
                          // >
                          //   <option value="" selected disabled hidden>
                          //     Choose Type
                          //   </option>
                          //   {(medicineTypes || []).map((item, idx) => (
                          //     <option
                          //       key={idx + item}
                          //       value={item}
                          //       className="text-cap"
                          //     >
                          //       {item}
                          //     </option>
                          //   ))}
                          // </Input>
                          medicine.medicine.type
                        )}
                      </span>
                      {medicine.medicine?.name}
                      <span
                        className={`ms-2 ${medicine.medicine.isNew
                          ? "w-50"
                          : ""
                          }`}
                      >
                        {medicine.medicine.isNew ? (
                          <div class="form-group">
                            <input
                              list="unit-options"
                              className="form-control form-control-sm"
                              id={idx}
                              onChange={(e) => {
                                handleMedicineSub("unit", idx, e.target.value);
                                if (e.target.value === "") {
                                  // Blur and refocus to re-trigger datalist suggestions
                                  e.target.blur();
                                  setTimeout(() => e.target.focus(), 0);
                                }
                              }}
                              required
                              name="unit"
                              value={medicine.medicine?.unit || ""}
                              placeholder="Type or select an option"
                            />
                            <datalist id="unit-options">
                              {(medicineUnits || []).map((item, idx) => (
                                <option
                                  key={idx + item}
                                  value={item}
                                  className="text-cap"
                                ></option>
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          // <Input
                          //   bsSize="xs"
                          //   id={idx}
                          //   onChange={(e) =>
                          //     handleMedicineSub("unit", idx, e.target.value)
                          //   }
                          //   name="unit"
                          //   value={medicine.medicine?.unit}
                          //   type="select"
                          //   required
                          //   className="form-control p-0 ps-1"
                          // >
                          //   <option value="" selected disabled hidden>
                          //     Choose Unit
                          //   </option>
                          //   {(medicineUnits || []).map((item, idx) => (
                          //     <option key={idx + item}>{item}</option>
                          //   ))}
                          // </Input>
                          null
                        )}{" "}
                        {/* medicine.medicine?.strength &&  */}
                        {medicine.medicine.isNew ? (
                          <Input
                            bsSize="xs"
                            id={idx}
                            onChange={(e) =>
                              handleMedicineSub("strength", idx, e.target.value)
                            }
                            name="strength"
                            required
                            value={medicine.medicine?.strength}
                            type="text"
                            className="form-control p-0 ps-1"
                          />
                        ) : (
                          medicine.medicine.strength
                        )}
                      </span>
                    </span>
                  </Col>
                  {/* <Col xs={3} className="">

                    <div className="d-flex flex-nowrap align-items-center justify-content-center">
                      <Input
                        bsSize={"sm"}
                        id={idx}
                        name="morning"
                        onChange={handleChange}
                        value={medicine.dosageAndFrequency.morning}
                      />
                      <span className="mx-2">-</span>
                      <Input
                        bsSize={"sm"}
                        id={idx}
                        name="evening"
                        onChange={handleChange}
                        value={medicine.dosageAndFrequency.evening}
                      />
                      <span className="mx-2">-</span>
                      <Input
                        bsSize={"sm"}
                        id={idx}
                        name="night"
                        onChange={handleChange}
                        value={medicine.dosageAndFrequency.night}
                      />
                      <span className="ms-3">Tablets</span>
                    </div>
                  </Col> */}
                  <Col xs={3}>
                    {!periods ? (
                    <div className="d-flex align-items-center">

                      <div className="d-flex flex-column align-items-center">
                        <div className="fw-bold mb-1" style={{ textTransform: "uppercase" }}>Mor</div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          bsSize="sm"
                          id={idx}
                          name="morning"
                          onChange={handleChange}
                          value={medicine.dosageAndFrequency.morning}
                          style={{ width: "55px" }}
                        />
                      </div>

                      <span className="mx-2">-</span>

                      <div className="d-flex flex-column align-items-center">
                        <div className="fw-bold mb-1" style={{ textTransform: "uppercase" }}>Aft</div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          bsSize="sm"
                          id={idx}
                          name="evening"
                          onChange={handleChange}
                          value={medicine.dosageAndFrequency.evening}
                          style={{ width: "55px" }}
                        />
                      </div>

                      <span className="mx-2">-</span>

                      <div className="d-flex flex-column align-items-center">
                        <div className="fw-bold mb-1" style={{ textTransform: "uppercase" }}>Eve</div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          bsSize="sm"
                          id={idx}
                          name="night"
                          onChange={handleChange}
                          value={medicine.dosageAndFrequency.night}
                          style={{ width: "55px" }}
                        />
                      </div>

                      <div className="d-flex flex-column align-items-center ms-2">
                        <div className="fw-bold mb-1" style={{ fontSize: "11px", textTransform: "uppercase" }}>Unit</div>
                        <Input
                          type="text"
                          bsSize="sm"
                          onChange={(e) => {
                             const drugsTable = [...medicines];
                             drugsTable[idx].dosageAndFrequency = {
                               ...drugsTable[idx].dosageAndFrequency,
                               unit: e.target.value
                             };
                             setMedicines(drugsTable);
                          }}
                          value={medicine.dosageAndFrequency.unit || ""}
                          placeholder="ml, drop"
                          style={{ width: "65px", fontSize: "12px" }}
                        />
                      </div>
                    </div>
                    ) : (
                      <div className="text-muted fst-italic" style={{ fontSize: "12px" }}>
                        {periods.length} dosage periods — see below
                      </div>
                    )}
                  </Col>
                  <Col xs={2} className="ps-3">
                    <div>
                      <Input
                        // id={idx}
                        name="intake"
                        className="bg-white"
                        bsSize={"sm"}
                        id={idx}
                        type="select"
                        onChange={handleChange}
                        value={medicine.intake}
                      >
                        <option value={"Before food"}>Before food</option>
                        <option value={"After food"}>After food</option>
                      </Input>
                      <Input
                        name="instructions"
                        bsSize={"sm"}
                        id={idx}
                        className="mt-2 bg-white"
                        type="text"
                        onChange={handleChange}
                        value={medicine.instructions}
                        placeholder="instruction"
                      />
                    </div>
                  </Col>
                  <Col xs={2} className="">
                    {!periods ? (
                    <>
                    <div className="d-flex flex-nowrap">
                      <div className="position-relative">
                        <Input
                          name="duration"
                          type="number"
                          onChange={handleChange}
                          value={medicine.duration}
                          bsSize={"sm"}
                          id={idx}
                        />
                        <span
                          onClick={() => bulkEditMedDuration(medicine.duration)}
                          style={{ top: "-5px", right: "-7px" }}
                          className="btn btn-sm btn-success bg-white btn-outline p-0 position-absolute"
                        >
                          <svg
                            width="15"
                            height="15"
                            // className="bg-white"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 18 18"
                          >
                            <path
                              fill="#14c56b"
                              d="M2.855 10.908l-.67 1.407L.038 17.26a.535.535 0 0 0 0 .368.917.917 0 0 0 .154.184.917.917 0 0 0 .184.155.562.562 0 0 0 .188.033.48.48 0 0 0 .18-.033l4.945-2.143 1.41-.672 8.527-8.528-4.244-4.243zM4.862 14l-1.515.657L4 13.144l.512-1.064 1.414 1.414zM16.708 5.54L12.466 1.3l.707-.707A2 2 0 0 1 16 .59L17.415 2a2 2 0 0 1 0 2.83zM7.74.893l-.63-.63a.886.886 0 0 0-1.26 0l-4.578 4.59-.3.62-.96 2.2a.29.29 0 0 0 0 .16.705.705 0 0 0 .07.09.705.705 0 0 0 .09.07c.02 0 .05.01.08.01a.22.22 0 0 0 .08-.01l2.2-.96.62-.3 4.588-4.58a.887.887 0 0 0 0-1.26zM17.735 10.89l-.63-.63a.886.886 0 0 0-1.26 0l-4.578 4.59-.3.62-.96 2.2a.29.29 0 0 0 0 .16.46.46 0 0 0 .16.16c.02 0 .05.01.08.01a.22.22 0 0 0 .08-.01l2.2-.96.62-.3 4.59-4.58a.887.887 0 0 0-.002-1.26z"
                            />
                          </svg>
                        </span>
                      </div>
                      <Input
                        name="unit"
                        className="ms-3 bg-white"
                        bsSize={"sm"}
                        id={idx}
                        onChange={handleChange}
                        value={medicine.unit}
                        type="select"
                      >
                        <option>Day (s)</option>
                        <option>Month (s)</option>
                        <option>Year (s)</option>
                      </Input>
                    </div>
                    {showDates && (
                      <div className="d-flex flex-column mt-2">
                        <Flatpicker
                          value={medicine.startDate || ""}
                          onChange={([date]) => handleStartDateChange(idx, date)}
                          options={{ dateFormat: "d M, Y" }}
                          className="form-control form-control-sm bg-white mb-1"
                          placeholder="From"
                        />
                        <Flatpicker
                          value={medicine.endDate || ""}
                          onChange={([date]) => handleEndDateChange(idx, date)}
                          options={{ dateFormat: "d M, Y" }}
                          className="form-control form-control-sm bg-white"
                          placeholder="To"
                        />
                      </div>
                    )}
                    </>
                    ) : (
                      <span className="badge bg-info-subtle text-info">
                        {periods.length} periods
                      </span>
                    )}
                    {showDates && !periods && !medicine.locked && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 d-flex align-items-center gap-1 mt-2"
                        onClick={() => addSchedulePeriod(idx)}
                      >
                        <i className="ri-add-circle-line"></i>
                        Add dosage period
                      </button>
                    )}
                  </Col>
                  <Col xs={2} className="">
                    {!periods ? (
                    <div>
                      <Input
                        name="frequencyPreset"
                        className="bg-white"
                        bsSize={"sm"}
                        id={idx}
                        onChange={handleChange}
                        value={medicine.frequencyPreset ?? getMedicineFrequencyPreset(medicine)}
                        type="select"
                      >
                        <option value="1">Daily</option>
                        <option value="2">Alternate days</option>
                        <option value="7">Every 7 days</option>
                        <option value="15">Every 15 days</option>
                        <option value="28">Every 28 days</option>
                        <option value="30">Every 30 days</option>
                        <option value="monthly">Specific date every month</option>
                        <option value="custom">Custom days</option>
                      </Input>
                      {(medicine.frequencyPreset === "monthly" || (!medicine.frequencyPreset && getMedicineFrequencyPreset(medicine) === "monthly")) && (
                        <div className="position-relative mt-2">
                          <Input
                            name="monthlyDate"
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Day of month (1-31)"
                            onChange={handleChange}
                            value={medicine.monthlyDate ?? ""}
                            bsSize={"sm"}
                            id={idx}
                          />
                        </div>
                      )}
                      {(medicine.frequencyPreset === "custom" || (!medicine.frequencyPreset && getMedicineFrequencyPreset(medicine) === "custom")) && (
                        <div className="position-relative mt-2">
                          <Input
                            name="frequency"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Days"
                            onChange={handleChange}
                            value={medicine.frequency ?? ""}
                            bsSize={"sm"}
                            id={idx}
                          />
                          <span
                            onClick={() => bulkEditFrequency(medicine.frequency)}
                            style={{ top: "-5px", right: "-7px" }}
                            className="btn btn-sm btn-success bg-white btn-outline p-0 position-absolute"
                          >
                            <svg
                              width="15"
                              height="15"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 18 18"
                            >
                              <path
                                fill="#14c56b"
                                d="M2.855 10.908l-.67 1.407L.038 17.26a.535.535 0 0 0 0 .368.917.917 0 0 0 .154.184.917.917 0 0 0 .184.155.562.562 0 0 0 .188.033.48.48 0 0 0 .18-.033l4.945-2.143 1.41-.672 8.527-8.528-4.244-4.243zM4.862 14l-1.515.657L4 13.144l.512-1.064 1.414 1.414zM16.708 5.54L12.466 1.3l.707-.707A2 2 0 0 1 16 .59L17.415 2a2 2 0 0 1 0 2.83zM7.74.893l-.63-.63a.886.886 0 0 0-1.26 0l-4.578 4.59-.3.62-.96 2.2a.29.29 0 0 0 0 .16.705.705 0 0 0 .07.09.705.705 0 0 0 .09.07c.02 0 .05.01.08.01a.22.22 0 0 0 .08-.01l2.2-.96.62-.3 4.588-4.58a.887.887 0 0 0 0-1.26zM17.735 10.89l-.63-.63a.886.886 0 0 0-1.26 0l-4.578 4.59-.3.62-.96 2.2a.29.29 0 0 0 0 .16.46.46 0 0 0 .16.16c.02 0 .05.01.08.01a.22.22 0 0 0 .08-.01l2.2-.96.62-.3 4.59-4.58a.887.887 0 0 0-.002-1.26z"
                              />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
                        {getMedicineFrequencyLabel(medicine)}
                      </div>
                    </div>
                    ) : (
                      <div className="text-muted fst-italic" style={{ fontSize: "12px" }}>
                        Varies by period
                      </div>
                    )}
                  </Col>
                  <Col xs={1}>
                    {medicine.locked ? (
                      // Carried forward from another doctor's prescription —
                      // it stays theirs, so it is shown under their name and
                      // cannot be edited or removed here.
                      <span
                        className="badge bg-secondary text-wrap"
                        style={{ fontSize: "10px" }}
                        title="Prescribed by another user — read only"
                      >
                        {capitalizeWords(
                          medicine.prescribedByUser?.name || medicine.author?.name,
                        ) || "Locked"}
                      </span>
                    ) : (
                      <i
                        onClick={() => removeDrug(idx)}
                        className="btn btn-sm btn-outline-danger ri-delete-bin-6-line"
                      ></i>
                    )}
                  </Col>
                </SortableMedicine>
                {periods && (
                  <Row className="mt-1">
                    <Col xs={12}>
                      <div
                        className="p-2 rounded"
                        style={{ background: "#f4f7fc", border: "1px solid #dde3ee" }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span
                            className="fw-semibold text-primary text-uppercase"
                            style={{ fontSize: "10px", letterSpacing: "0.4px" }}
                          >
                            Dosage periods
                          </span>
                          {!medicine.locked && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 d-flex align-items-center gap-1"
                              style={{ fontSize: "12px" }}
                              onClick={() => addSchedulePeriod(idx)}
                            >
                              <i className="ri-add-line"></i>
                              Add period
                            </button>
                          )}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "26px 240px 220px 150px 140px 90px 28px",
                            columnGap: "10px",
                            fontSize: "9px",
                            letterSpacing: "0.3px",
                            color: "#8a93a6",
                            textTransform: "uppercase",
                            paddingBottom: "2px",
                          }}
                        >
                          <span></span>
                          <span></span>
                          <span></span>
                          <span>Duration</span>
                          <span>Frequency</span>
                          <span></span>
                          <span></span>
                        </div>

                        {periods.map((period, pIdx) => {
                          const freqPreset =
                            period.frequencyPreset ?? getMedicineFrequencyPreset(period);
                          return (
                          <div
                            key={pIdx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "26px 240px 220px 150px 140px 90px 28px",
                              columnGap: "10px",
                              alignItems: "end",
                              paddingTop: "6px",
                              paddingBottom: "6px",
                              borderTop: pIdx > 0 ? "1px dashed #dde3ee" : "none",
                            }}
                          >
                            <span
                              className="badge bg-info-subtle text-info"
                              style={{ fontSize: "10px" }}
                            >
                              P{pIdx + 1}
                            </span>

                            <div className="d-flex align-items-end gap-1">
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  From
                                </span>
                                <Flatpicker
                                  value={period.startDate || ""}
                                  onChange={([date]) =>
                                    handlePeriodStartDateChange(idx, pIdx, date)
                                  }
                                  options={{ dateFormat: "d M, Y" }}
                                  className="form-control form-control-sm"
                                  style={{ width: "112px" }}
                                  disabled={medicine.locked}
                                />
                              </div>
                              <span className="text-muted mb-1">&rarr;</span>
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  To
                                </span>
                                <Flatpicker
                                  value={period.endDate || ""}
                                  onChange={([date]) =>
                                    handlePeriodEndDateChange(idx, pIdx, date)
                                  }
                                  options={{ dateFormat: "d M, Y" }}
                                  className="form-control form-control-sm"
                                  style={{ width: "112px" }}
                                  disabled={medicine.locked}
                                />
                              </div>
                            </div>

                            <div className="d-flex align-items-end gap-1">
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  Mor
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  bsSize="sm"
                                  style={{ width: "42px" }}
                                  value={period.dosageAndFrequency?.morning || ""}
                                  onChange={(e) =>
                                    handlePeriodChange(idx, pIdx, "morning", e.target.value)
                                  }
                                  disabled={medicine.locked}
                                />
                              </div>
                              <span className="text-muted mb-1">-</span>
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  Aft
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  bsSize="sm"
                                  style={{ width: "42px" }}
                                  value={period.dosageAndFrequency?.evening || ""}
                                  onChange={(e) =>
                                    handlePeriodChange(idx, pIdx, "evening", e.target.value)
                                  }
                                  disabled={medicine.locked}
                                />
                              </div>
                              <span className="text-muted mb-1">-</span>
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  Eve
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  bsSize="sm"
                                  style={{ width: "42px" }}
                                  value={period.dosageAndFrequency?.night || ""}
                                  onChange={(e) =>
                                    handlePeriodChange(idx, pIdx, "night", e.target.value)
                                  }
                                  disabled={medicine.locked}
                                />
                              </div>
                              <div className="d-flex flex-column">
                                <span style={{ fontSize: "8px", color: "#8a93a6", textTransform: "uppercase" }}>
                                  Unit
                                </span>
                                <Input
                                  type="text"
                                  bsSize="sm"
                                  style={{ width: "46px" }}
                                  value={period.dosageAndFrequency?.unit || ""}
                                  placeholder="ml, drop"
                                  onChange={(e) =>
                                    handlePeriodChange(idx, pIdx, "doseUnit", e.target.value)
                                  }
                                  disabled={medicine.locked}
                                />
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              <Input
                                type="number"
                                bsSize="sm"
                                title="Duration"
                                style={{ width: "48px" }}
                                value={period.duration || ""}
                                onChange={(e) =>
                                  handlePeriodChange(idx, pIdx, "duration", e.target.value)
                                }
                                disabled={medicine.locked}
                              />
                              <Input
                                type="select"
                                bsSize="sm"
                                style={{ width: "92px" }}
                                value={period.unit || "Day (s)"}
                                onChange={(e) =>
                                  handlePeriodChange(idx, pIdx, "unit", e.target.value)
                                }
                                disabled={medicine.locked}
                              >
                                <option>Day (s)</option>
                                <option>Month (s)</option>
                                <option>Year (s)</option>
                              </Input>
                            </div>

                            <Input
                              type="select"
                              bsSize="sm"
                              title={getMedicineFrequencyLabel(period)}
                              value={freqPreset}
                              onChange={(e) =>
                                handlePeriodChange(idx, pIdx, "frequencyPreset", e.target.value)
                              }
                              disabled={medicine.locked}
                            >
                              <option value="1">Daily</option>
                              <option value="2">Alternate days</option>
                              <option value="7">Every 7 days</option>
                              <option value="15">Every 15 days</option>
                              <option value="28">Every 28 days</option>
                              <option value="30">Every 30 days</option>
                              <option value="monthly">Specific date/month</option>
                              <option value="custom">Custom days</option>
                            </Input>

                            {freqPreset === "monthly" ? (
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="Day (1-31)"
                                bsSize="sm"
                                value={period.monthlyDate ?? ""}
                                onChange={(e) =>
                                  handlePeriodChange(idx, pIdx, "monthlyDate", e.target.value)
                                }
                                disabled={medicine.locked}
                              />
                            ) : freqPreset === "custom" ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="Days"
                                bsSize="sm"
                                value={period.frequency ?? ""}
                                onChange={(e) =>
                                  handlePeriodChange(idx, pIdx, "frequency", e.target.value)
                                }
                                disabled={medicine.locked}
                              />
                            ) : (
                              <span></span>
                            )}

                            {!medicine.locked && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                onClick={() => removeSchedulePeriod(idx, pIdx)}
                                title="Remove this period"
                              >
                                <i className="ri-delete-bin-6-line"></i>
                              </button>
                            )}
                          </div>
                          );
                        })}

                        {validateSchedulesSequential(periods) && (
                          <div
                            className="alert alert-danger py-1 px-2 mt-1 mb-0 d-flex align-items-center gap-1"
                            style={{ fontSize: "12px" }}
                          >
                            <i className="ri-error-warning-line"></i>
                            {validateSchedulesSequential(periods)}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                )}
                {isPilotCenter && !medicine.locked && (
                  <Row className="mt-1">
                    <Col xs={12}>
                      <PrescriptionPharmacyStock
                        medicine={medicine}
                        centerId={centerId}
                        available={stockStatus[`${centerId}:${medicine.medicine?._id}`]}
                        onReplace={(med) => replaceMedicine(idx, med)}
                      />
                    </Col>
                  </Row>
                )}
                </div>
                );
              })}
            </SortableContext>
          </DndContext>
        </Row>
      </div>
    </React.Fragment>
  );
};

Medicine.propTypes = {
  medicines: PropTypes.array,
  setMedicines: PropTypes.func,
  showDates: PropTypes.bool,
  centerId: PropTypes.string,
};

const mapStateToProps = (state) => ({
  isNew: state.Chart.chartForm?.data ? false : true,
});

export default connect(mapStateToProps)(Medicine);