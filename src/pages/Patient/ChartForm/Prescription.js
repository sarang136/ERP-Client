import referredByName from "../../../utils/referredByName";
import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Row,
  Col,
  Card,
  CardBody,
  Input,
  Button,
  Label,
  CardHeader,
  Spinner,
} from "reactstrap";
import PropTypes from "prop-types";
import _ from "lodash";
import Select from "react-select";
import { format, parse } from "date-fns";

//flatpicker
import Flatpicker from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//constant
import {
  CLINICAL_NOTE,
  COUNSELLING_NOTE,
  DETAIL_ADMISSION,
  DISCHARGE_SUMMARY,
  GENERAL,
  IPD,
  LAB_REPORT,
  OPD,
  PRESCRIPTION,
  prescriptionFormFields,
  RELATIVE_VISIT,
  VITAL_SIGN,
} from "../../../Components/constants/patient";
import MedicineDropdown from "../Dropdowns/Medicine";
import MedicineTable from "../Tables/MedicineForm";
import SopSuggestedMedicines from "./SopSuggestedMedicines";
import CurrentMedicinesPanel from "./CurrentMedicinesPanel";
import {
  getCurrentUserId,
  getMedicineEndDate,
  drugIdentity,
  validateSchedulesSequential,
} from "../../../helpers/currentMedicines";
import { connect, useDispatch } from "react-redux";
import {
  addGeneralPrescription,
  addPrescription,
  createEditChart,
  fetchOPDPrescription,
  setPtLatestOPDPrescription,
  updatePrescription,
} from "../../../store/actions";
import Wrapper from "../Components/Wrapper";
import RelativeVisit from "../Charts/RelativeVisit";
import DischargeSummary from "../Charts/DischargeSummary";
import VitalSign from "../Charts/VitalSign";
import ClinicalNote from "../Charts/ClinicalNote";
import CounsellingNote from "../Charts/CounsellingNote";
import LabReport from "../Charts/LabReport";
import DetailAdmission from "../Charts/DetailAdmission";
import PrescriptionChart from "../Charts/Prescription";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getICDCodes,
  getLatestCharts,
  getCarryForward,
  toggleCarryForward,
  clearCarryForward,
} from "../../../helpers/backend_helper.js";
import { normalizeMedicineFrequency } from "../../../helpers/prescriptionFrequency";


// Dr Notes carry-forward
//
// When a new prescription is created, the Dr Notes field starts with today's
// date header on top (the doctor writes under it), followed by the previous
// prescription's entries, newest first:
//
//   14 Jul, 2026        ← today's note goes here
//
//   08 Jul, 2026
//   <that visit's note>
//
//   05 Jul, 2026
//   <that visit's note>
//
// The pre-fill carries the newest DR_NOTES_HISTORY_LIMIT entries below
// today's header, and the save caps the total at the same limit: writing
// today's note pushes the oldest carried entry out, while saving without a
// note keeps all carried entries — so the history stays bounded instead of
// growing with every prescription. Because we always re-parse the single
// latest snapshot (never concatenate several prescriptions), entries are
// never duplicated. Entries are ordered by their
// header date (newest first) both in the field and in the saved value, so
// older oldest-first data is re-ordered automatically on the next create;
// text without a date header (legacy notes) sinks to the bottom.
const DR_NOTES_HISTORY_LIMIT = 5;
// A line that is ONLY a date, e.g. "05 Jul, 2026" / "5 Jul 2026" — our entry header.
const DR_NOTES_DATE_LINE = /^\s*\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4}\s*$/;
const DR_NOTES_DATE_FORMATS = [
  "dd MMM, yyyy",
  "d MMM, yyyy",
  "dd MMM yyyy",
  "d MMM yyyy",
];

const formatDrNotesDate = (value) => {
  const d = value ? new Date(value) : new Date();
  return format(Number.isNaN(d.getTime()) ? new Date() : d, "dd MMM, yyyy");
};

// Timestamp of an entry's date header, or null when it has none / can't parse.
const drNotesEntryTime = (date) => {
  if (!date) return null;
  for (const f of DR_NOTES_DATE_FORMATS) {
    const parsed = parse(date, f, new Date());
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  const fallback = new Date(date).getTime();
  return Number.isNaN(fallback) ? null : fallback;
};

// Splits a Dr Notes value into { date, body } entries on date-header lines.
// Entries with no note written under their header are dropped.
export const parseDrNotesEntries = (text) => {
  const entries = [];
  let current = null;
  (text || "").split("\n").forEach((line) => {
    if (DR_NOTES_DATE_LINE.test(line)) {
      current = { date: line.trim(), lines: [] };
      entries.push(current);
    } else {
      if (!current) {
        // Text before any date header (legacy notes) — kept as one entry.
        current = { date: null, lines: [] };
        entries.push(current);
      }
      current.lines.push(line);
    }
  });

  return entries
    .map((e) => ({
      date: e.date,
      body: e.lines.join("\n").trim(),
      time: drNotesEntryTime(e.date),
    }))
    .filter((e) => e.body) // drop headers nobody wrote under
    .sort((a, b) => {
      // Newest first; undated/legacy entries sink to the bottom. Equal dates
      // keep their text order (Array#sort is stable).
      if (a.time === b.time) return 0;
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return b.time - a.time;
    });
};

const composeDrNotesEntries = (entries) =>
  entries.map((e) => (e.date ? `${e.date}\n${e.body}` : e.body)).join("\n\n");

export const buildDrNotesPrefill = (previousNotes, chartDate) => {
  const today = formatDrNotesDate(chartDate);
  const history = composeDrNotesEntries(
    parseDrNotesEntries(previousNotes).slice(0, DR_NOTES_HISTORY_LIMIT),
  );
  // Today's header on top with an empty line to write on; history below it.
  return history ? `${today}\n\n\n${history}` : `${today}\n`;
};

// Run on save (create only). Drops dangling date headers with nothing written
// under them (e.g. the seeded "today" header when the doctor saved without a
// note), then keeps the newest DR_NOTES_HISTORY_LIMIT entries. Net effect:
// writing today's note pushes the oldest carried entry out; saving without
// one keeps the carried history as is.
export const cleanDrNotesForSave = (value) =>
  composeDrNotesEntries(
    parseDrNotesEntries(value).slice(0, DR_NOTES_HISTORY_LIMIT),
  );

const defaultStartDate = (chartDate) =>
  chartDate ? new Date(chartDate) : new Date();

const Prescription = ({
  drugs,
  author,
  patient,
  doctor,
  center,
  chartDate,
  editChartData,
  type,
  appointment,
  charts,
  patientLatestOPDPrescription,
  populatePreviousAppointment = false,
  shouldPrintAfterSave = false,
}) => {
  const dispatch = useDispatch();
  const [medicines, setMedicines] = useState([]);
  const [allICDCodes, setAllICDCodes] = useState([]);
  const [icdOptions, setIcdOptions] = useState([]);
  // Previous IPD prescription, used to prefill the clinical notes on a new
  // chart. Never used for medicines.
  const [lastIpdPrescription, setLastIpdPrescription] = useState(null);
  // Prescriptions staged for carry-forward, loaded from the server rather than
  // redux — so the selection survives a reload and stays private to this user.
  const [carryForwardCharts, setCarryForwardCharts] = useState([]);
  // Chart id currently being staged/unstaged, so only that chart's button
  // shows a loader while its request is in flight.
  const [togglingCarryForwardId, setTogglingCarryForwardId] = useState(null);
  const [opdLatestCharts, setOpdLatestCharts] = useState([]);

  const editPrescription = editChartData?.prescription;
  const ptLatestOPDPrescription = patientLatestOPDPrescription?.prescription;

  const isEditMode = !!editPrescription;

  const isIPD = type === "IPD";
  const opdPatientId = appointment?.patient?._id || patient?._id;

  const isPopulateMode =
    !isIPD && populatePreviousAppointment && ptLatestOPDPrescription;

  const currentUserId = getCurrentUserId();
  const editChartAuthorId = editChartData?.author?._id || editChartData?.author;

  const carryForwardMedicines = React.useMemo(() => {
    const byDrug = new Map();

    const drugKey = (drug) =>
      drug?._id
        ? `id:${String(drug._id)}`
        : `key:${[drug?.name, drug?.strength, drug?.unit]
            .map((v) => String(v || "").trim().toLowerCase())
            .join("|")}`;

    [...(carryForwardCharts || [])]
      .sort(
        (a, b) =>
          new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt),
      )
      .forEach((chart) => {
        (chart?.prescription?.medicines || [])
          .filter((med) => med.status !== "discontinued")
          .forEach((med) => {
            byDrug.set(drugKey(med.medicine), {
              ...med,
              _carryForwardChartId: chart._id,
            });
          });
      });

    return Array.from(byDrug.values());
  }, [carryForwardCharts]);

  const isCarryForwardMode = !isEditMode && carryForwardMedicines.length > 0;

  const latestChartsForDisplay = React.useMemo(() => {
    const byId = new Map();
    [...(charts || []), ...(opdLatestCharts || [])].forEach((c) => {
      if (c?._id) byId.set(String(c._id), c);
    });
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    );
  }, [charts, opdLatestCharts]);


  useEffect(() => {
    if (isIPD || isEditMode) return;

    setMedicines((prevMeds) => {
      const handAdded = prevMeds.filter((m) => !m.carriedFromChartId);
      if (!carryForwardMedicines.length) return handAdded;

      const startDate = defaultStartDate(chartDate);
      const carried = carryForwardMedicines.map((entry) => {
        const {
          _id,
          prescribedBy,
          prescribedByUser,
          discontinuedAt,
          discontinuedBy,
          startDate: sourceStartDate,
          endDate: sourceEndDate,
          _carryForwardChartId,
          ...medicineFields
        } = entry;
        return {
          ..._.cloneDeep(medicineFields),
          prescribedBy: currentUserId,
          startDate,
          endDate: getMedicineEndDate(startDate, medicineFields),
          status: "active",
          carriedFromChartId: _carryForwardChartId,
        };
      });

      return [...carried, ...handAdded];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carryForwardMedicines, isIPD, isEditMode, chartDate]);

  // Clinical text comes from the chart being edited, the previous OPD visit
  // (OPD populate mode), or — on a new IPD chart — the patient's previous IPD
  // prescription. Medicines never come from here.
  const sourcePrescription = isEditMode
    ? editPrescription
    : isPopulateMode
      ? ptLatestOPDPrescription
      : isIPD
        ? lastIpdPrescription
        : null;

  useEffect(() => {
    if (!isIPD && populatePreviousAppointment)
      dispatch(
        fetchOPDPrescription({ id: appointment?.patient?._id || patient?._id }),
      );
  }, [dispatch, appointment, populatePreviousAppointment, isIPD, patient._id]);

  useEffect(() => {
    if (!opdPatientId) {
      setOpdLatestCharts([]);
      return;
    }

    let cancelled = false;
    getLatestCharts({
      patient: opdPatientId,
      limit: 5,
      chartType: PRESCRIPTION,
      carryForwardScope: true,
    })
      .then((res) => {
        if (!cancelled) setOpdLatestCharts(res?.payload || []);
      })
      .catch(() => {
        if (!cancelled) setOpdLatestCharts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [opdPatientId]);

  useEffect(() => {
    if (!isIPD || isEditMode || !patient?._id) return;

    let cancelled = false;
    getLatestCharts({
      patient: patient._id,
      limit: 1,
      chartType: PRESCRIPTION,
      type: IPD,
    })
      .then((res) => {
        if (cancelled) return;
        setLastIpdPrescription(res?.payload?.[0]?.prescription || null);
      })
      .catch(() => {
        if (!cancelled) setLastIpdPrescription(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isIPD, isEditMode, patient?._id]);

  useEffect(() => {
    const carryForwardPatientId = isIPD ? patient?._id : opdPatientId;
    if (isEditMode || !carryForwardPatientId) {
      setCarryForwardCharts([]);
      return;
    }

    let cancelled = false;
    getCarryForward(carryForwardPatientId)
      .then((res) => {
        if (!cancelled) setCarryForwardCharts(res?.payload || []);
      })
      .catch(() => {
        if (!cancelled) setCarryForwardCharts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isIPD, isEditMode, patient?._id, opdPatientId]);

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      author: author?._id,
      patient: patient?._id,
      center: center ? center : patient?.center?._id,
      addmission: patient?.addmission?._id || patient?.addmission || "",
      chart: PRESCRIPTION,
      age: patient ? patient.age : "",
      dateOfBirth: patient ? patient.dateOfBirth : "",
      // Every new prescription starts with today's date header, with the
      // previous prescription's windowed history carried below it.
      drNotes: isEditMode
        ? editPrescription?.drNotes || ""
        : buildDrNotesPrefill(sourcePrescription?.drNotes || "", chartDate),
      diagnosis: sourcePrescription?.diagnosis || "",
      // diagnosis2: editPrescription
      //   ? editPrescription.diagnosis2
      //   : ptLatestOPDPrescription
      //     ? patientLatestOPDPrescription?.diagnosis2
      //     : "",
      notes: sourcePrescription?.notes || "",
      followUp: sourcePrescription?.followUp || "",
      referredby: referredByName(patient.referredBy) || patient.referredBy || "",
      // editPrescription
      //   ? editPrescription.referredby
      //   : ptLatestOPDPrescription
      //   ? patientLatestOPDPrescription?.referredby
      //   :
      investigationPlan: sourcePrescription?.investigationPlan || "",
      complaints: sourcePrescription?.complaints || "",
      observation: sourcePrescription?.observation || "",
      type,
      date: chartDate,
      icdCode:
        allICDCodes.find(
          (item) => item.value === sourcePrescription?.icdCode,
        ) || null,
      icdCode2: [],
    },
    validationSchema: Yup.object({
      patient: Yup.string().required("Patient is required"),
      center: Yup.string().required("Center is required"),
      chart: Yup.string().required("Chart is required"),
      icdCode: Yup.mixed()
        .required("ICD Code is required")
        .test(
          "icd-required",
          "ICD Code is required",
          (val) => !!val && !!val.value,
        )
        .test(
          "icd-not-same",
          "ICD Code 1 and ICD Code 2 cannot be same",
          function (value) {
            const { icdCode2 } = this.parent;
            if (!value || !icdCode2?.length) return true;

            return !icdCode2.some((item) => item.value === value.value);
          },
        ),
    }),
    onSubmit: async (values) => {
      const hasAnyDose = (dosageAndFrequency) =>
        ["morning", "evening", "night"].some((slot) => {
          const val = dosageAndFrequency?.[slot];
          return val !== undefined && val !== null && val !== "" && Number(val) !== 0;
        });

      for (const med of medicines) {
        if (med.locked) continue;

        if (med.schedules?.length > 1) {
          const missingDateIdx = med.schedules.findIndex(
            (period) => !period.startDate || !period.endDate,
          );
          if (missingDateIdx !== -1) {
            toast.error(
              `Enter both From and To date for period ${missingDateIdx + 1} (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }

          const error = validateSchedulesSequential(med.schedules);
          if (error) {
            toast.error(`${error} (${med.medicine?.name || "a medicine"})`);
            return;
          }

          const emptyPeriodIdx = med.schedules.findIndex(
            (period) => !hasAnyDose(period.dosageAndFrequency),
          );
          if (emptyPeriodIdx !== -1) {
            toast.error(
              `Enter at least one of Morning/Afternoon/Evening dose for period ${emptyPeriodIdx + 1} (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }
        } else {
          if (!med.startDate || !med.endDate) {
            toast.error(
              `Enter both From and To date (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }

          if (!hasAnyDose(med.dosageAndFrequency)) {
            toast.error(
              `Enter at least one of Morning/Afternoon/Evening dose (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }
        }
      }

      const formattedICD2 = Array.isArray(values.icdCode2)
        ? values.icdCode2.map((item) => ({
          code_id: item?.value,
          code: item?.label,
        }))
        : [];
      const medicinesForSave = medicines.map(
        ({ carriedFromChartId, ...m }) => m,
      );

      const saveAction = editPrescription
        ? updatePrescription({
          id: editChartData._id,
          chartId: editPrescription._id,
          doctor,
          medicines: medicinesForSave,
          appointment: appointment?._id,
          ...values,
          shouldPrintAfterSave,
          icdCode: values.icdCode?.value || null,
          icdCode2: formattedICD2,
        })
        : type === "GENERAL"
          ? addGeneralPrescription({
            ...values,
            drNotes: cleanDrNotesForSave(values.drNotes),
            medicines: medicinesForSave,
            icdCode: values.icdCode?.value || null,
            icdCode2: formattedICD2,
          })
          : addPrescription({
            ...values,
            drNotes: cleanDrNotesForSave(values.drNotes),
            appointment: appointment?._id,
            medicines: medicinesForSave,
            shouldPrintAfterSave,
            icdCode: values.icdCode?.value || null,
            icdCode2: formattedICD2,
          });

      try {
        await dispatch(saveAction).unwrap();
      } catch (error) {
        // Save rejected (e.g. duration/date mismatch caught server-side) -
        // the thunk already surfaced the error via setAlert. Leave the
        // carry-forward staging and form state untouched so the doctor can
        // fix the offending field and resubmit, instead of losing their
        // carried-forward selections on a failed save.
        return;
      }

      // closeForm();
      dispatch(setPtLatestOPDPrescription(null));
      // Staged carry-forward prescriptions have been consumed by this save.
      const carryForwardPatientId = isIPD ? patient?._id : opdPatientId;
      if (carryForwardPatientId) {
        clearCarryForward(carryForwardPatientId).catch(() => { });
      }
      setCarryForwardCharts([]);
    },
  });

  useEffect(() => {
    const source = isEditMode
      ? sourcePrescription?.medicines
      : isIPD && isCarryForwardMode
        ? carryForwardMedicines
        : null;

    if (source) {
    const meds = _.cloneDeep(source);

    // Edit mode keeps the chart's own date as the From anchor; carry-forward
    // reissues the medicine under the current user today, so it starts now.
    const baseStartDate = isEditMode
      ? editChartData?.date || editChartData?.createdAt || chartDate
      : defaultStartDate(chartDate);

    const fixed = meds.map((med) => {
      const m = med.medicine;

      // OPD keeps its original behaviour: a straight copy, no dates,
      // no ownership, no locking.
      if (!isIPD) {
        const normalizedOpdMedicine = {
          ...med,
          frequency: normalizeMedicineFrequency(med.frequency),
        };
        if (m?._id) return normalizedOpdMedicine;

        const opdMatch = drugs.find(
          (d) =>
            d.name?.toLowerCase().trim() === m.name?.toLowerCase().trim() &&
            String(d.strength).trim() === String(m.strength).trim() &&
            String(d.unit).trim().toLowerCase() ===
            String(m.unit).trim().toLowerCase(),
        );

        return opdMatch
          ? {
            ...normalizedOpdMedicine,
            medicine: {
              ...m,
              _id: opdMatch._id,
              name: opdMatch.name,
              strength: opdMatch.strength,
              unit: opdMatch.unit,
              isNew: false,
            },
          }
          : normalizedOpdMedicine;
      }

      // Carrying a medicine forward reissues it as the current user's own
      // order: the source row's identity, prescriber and date window are all
      // dropped, and it restarts from today for its stated duration.
      const {
        _id,
        prescribedBy,
        prescribedByUser,
        discontinuedAt,
        discontinuedBy,
        startDate: sourceStartDate,
        endDate: sourceEndDate,
        ...carried
      } = med;
      const base = isEditMode ? med : carried;
      const ownerId = isEditMode
        ? med.prescribedBy
          ? String(med.prescribedBy?._id || med.prescribedBy)
          : editChartAuthorId
            ? String(editChartAuthorId)
            : null
        : currentUserId;
      const startDate = isEditMode ? med.startDate || baseStartDate : baseStartDate;
      const normalizedMedicine = {
        ...base,
        frequency: normalizeMedicineFrequency(med.frequency),
        prescribedBy: ownerId,
        prescribedByUser: isEditMode
          ? med.prescribedByUser || editChartData?.author
          : undefined,
        startDate,
        endDate: isEditMode
          ? med.endDate || getMedicineEndDate(startDate, med)
          : getMedicineEndDate(startDate, med),
        status: isEditMode ? med.status || "active" : "active",
        // Only relevant when editing an existing chart: a medicine is editable
        // only by the person who prescribed it. Carried-forward rows are the
        // current user's own, so they are never locked.
        locked: !!ownerId && !!currentUserId && ownerId !== String(currentUserId),
      };

      // if  _id ,then skip
      if (m?._id) return normalizedMedicine;

      // try to get _id using name + strength + unit
      const match = drugs.find(
        (d) =>
          d.name?.toLowerCase().trim() === m.name?.toLowerCase().trim() &&
          String(d.strength).trim() === String(m.strength).trim() &&
          String(d.unit).trim().toLowerCase() ===
          String(m.unit).trim().toLowerCase(),
      );

      if (match) {
        return {
          ...normalizedMedicine,
          medicine: {
            ...m,
            _id: match._id,
            name: match.name,
            strength: match.strength,
            unit: match.unit,
            isNew: false,
          },
        };
      }

      return normalizedMedicine;
    });

    setMedicines(fixed);
    }

    if (isPopulateMode && !editPrescription) {
      validation.setFieldValue(
        "drNotes",
        buildDrNotesPrefill(ptLatestOPDPrescription.drNotes, chartDate),
      );
      validation.setFieldValue("diagnosis", ptLatestOPDPrescription.diagnosis);
      validation.setFieldValue("notes", ptLatestOPDPrescription.notes);
      validation.setFieldValue(
        "investigationPlan",
        ptLatestOPDPrescription.investigationPlan,
      );
      validation.setFieldValue(
        "complaints",
        ptLatestOPDPrescription.complaints,
      );
      validation.setFieldValue(
        "observation",
        ptLatestOPDPrescription.observation,
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPrescription, ptLatestOPDPrescription, carryForwardMedicines, drugs]);

  useEffect(() => {
    if (!isEditMode && !isCarryForwardMode && !isPopulateMode) {
      setMedicines([]);
      dispatch(setPtLatestOPDPrescription(null));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, isCarryForwardMode, isPopulateMode]);

  const closeForm = () => {
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
    dispatch(setPtLatestOPDPrescription(null));
    // Abandoning the form drops the staged carry-forward selection too, so it
    // can't leak into an unrelated chart later.
    const carryForwardPatientId = isIPD ? patient?._id : opdPatientId;
    if (carryForwardPatientId) {
      clearCarryForward(carryForwardPatientId).catch(() => { });
    }
    setCarryForwardCharts([]);
    setMedicines([]);
    validation.resetForm();
  };

  const addMdicine = (med, data) => {
    if (!med) return;

    const medicineName = med.name || (typeof med === "string" ? med : "");
    if (!medicineName) return;

    // Matched on name + strength + unit, not name alone: DOLO 500 and DOLO 650
    // are different medicines and both must be addable.
    const checkMedicine = data.find(
      (val) => drugIdentity(val.medicine) === drugIdentity(med),
    );

    if (!checkMedicine) {
      const startDate = defaultStartDate(chartDate);
      const medicine = {
        medicine: {
          _id: med?._id || "",
          name: med?.name || med,
          isNew: med?._id ? false : true,
          type: med?.type || "TAB",
          strength: med?.strength || "",
          unit: med?.unit || "MG",
        },
        dosageAndFrequency: {
          morning: "1",
          evening: "0",
          night: "1",
        },
        instructions: "",
        intake: "After food",
        duration: "30",
        unit: "Day (s)",
        frequency: 1,
        startDate,
        endDate: getMedicineEndDate(startDate, { duration: "30", unit: "Day (s)" }),
      };

      setMedicines((prevMeds) => [medicine, ...prevMeds]);
    }
  };

  // Pulls a medicine from the current-medicines panel (one the logged in
  // user prescribed) into today's editable prescription, so it can be
  // reviewed/continued/adjusted the same way a carried-forward medicine is.
  const addCurrentMedicineToRx = (entry) => {
    const medicineName = entry?.medicine?.name;
    if (!medicineName) return;

    const alreadyAdded = medicines.some(
      (m) => m.medicine?.name?.toLowerCase().trim() === medicineName.toLowerCase().trim(),
    );
    if (alreadyAdded) return;

    // Reissuing a current medicine writes it as the current user's own order:
    // the source row's identity, prescriber and date window are dropped, and
    // it restarts from today for its stated duration.
    const {
      _id,
      prescribedBy,
      prescribedByUser,
      discontinuedAt,
      discontinuedBy,
      startDate: sourceStartDate,
      endDate: sourceEndDate,
      ...medicineFields
    } = entry;
    const startDate = defaultStartDate(chartDate);
    const newEntry = {
      ..._.cloneDeep(medicineFields),
      prescribedBy: currentUserId,
      startDate,
      endDate: getMedicineEndDate(startDate, medicineFields),
      status: "active",
    };
    setMedicines((prevMeds) => [newEntry, ...prevMeds]);
  };

  const isStagedForCarryForward = (chart) =>
    (carryForwardCharts || []).some((c) => String(c._id) === String(chart._id));

  const hasCarryForwardableMedicines = (chart) =>
    (chart?.prescription?.medicines || []).some(
      (m) => m.status !== "discontinued" && m?.medicine?.name,
    );

  const handleToggleCarryForward = (chart) => {
    setTogglingCarryForwardId(chart._id);
    toggleCarryForward(chart.patient, chart._id)
      .then((res) => {
        setCarryForwardCharts(res?.payload || []);
        toast.success(
          res?.staged ? "Added to carry forward" : "Removed from carry forward",
        );
      })
      .catch((err) =>
        toast.error(err?.message || "Failed to update carry forward"),
      )
      .finally(() => setTogglingCarryForwardId(null));
  };

  const medicineDropdown = useMemo(() => {
    return (
      <Col xl={12} className="mb-4">
        <MedicineDropdown
          dataList={drugs}
          data={medicines}
          setMedicines={setMedicines}
          addItem={addMdicine}
          fieldName={"name"}
        />
      </Col>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugs, medicines]);

  const medicineTable = useMemo(() => {
    return (
      medicines?.length > 0 && (
        <Col xs={12}>
          <MedicineTable
            medicines={medicines}
            setMedicines={setMedicines}
            showDates
            centerId={center ? center : patient?.center?._id}
          />
        </Col>
      )
    );
  }, [medicines, center, patient?.center?._id]);

  useEffect(() => {
    const fetchICD = async () => {
      const res = await getICDCodes();

      const options = res?.map((item) => ({
        label: `${item?.code} - ${item.text}`,
        value: item?._id,
        text: item?.text,
      }));

      // options.push({
      //   label: "OTHERS",
      //   value: "OTHERS",
      //   text: "Others",
      // });

      setAllICDCodes(options);
      setIcdOptions(options);
    };

    fetchICD();
  }, []);

  const handleICDSearch = (input) => {
    if (!input) {
      setIcdOptions(allICDCodes);
      return;
    }

    const filtered = allICDCodes.filter((item) =>
      item.label.toLowerCase().includes(input.toLowerCase()),
    );

    setIcdOptions(filtered);
  };

  // useEffect(() => {
  //   if (!allICDCodes.length) return;
  //   if (icd2Initialized.current) return;

  //   const sourceICD2 = Array.isArray(
  //     editPrescription?.icdCode2 || ptLatestOPDPrescription?.icdCode2,
  //   )
  //     ? editPrescription?.icdCode2 || ptLatestOPDPrescription?.icdCode2
  //     : [];

  //   if (!sourceICD2.length) return;

  //   const selected = sourceICD2
  //     .map((item) => allICDCodes.find((opt) => opt.value === item.code_id))
  //     .filter(Boolean);

  //   validation.setFieldValue("icdCode2", selected);

  //   icd2Initialized.current = true;
  // }, [allICDCodes]);

  useEffect(() => {
    if (!allICDCodes.length) return;

    if (!Array.isArray(sourcePrescription?.icdCode2) || !sourcePrescription.icdCode2.length) {
      validation.setFieldValue("icdCode2", []);
      return;
    }

    const selected = sourcePrescription.icdCode2
      .map((item) =>
        allICDCodes.find((opt) => opt.value === item.code_id)
      )
      .filter(Boolean);

    validation.setFieldValue("icdCode2", selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allICDCodes, sourcePrescription]);

  return (
    <React.Fragment>
      <div>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            // toggle();
            return false;
          }}
          className="needs-validation"
          action="#"
        >
          <Row className="mt-3">
            {type === OPD && (
              <>
                <Col xs={12} md={2}>
                  <div className="pb-4">
                    <Label className="">Age</Label>
                    <Input
                      type="text"
                      name={"age"}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.age || ""}
                      className="form-control presc-border rounded"
                      bsSize="sm"
                    />
                  </div>
                </Col>
                {/* <Col xs={12} md={6}>
                  <div className="pb-4">
                    <Label className="">Date of birth</Label>
                    <Flatpicker
                      name="dateOfBirth"
                      value={validation.values.dateOfBirth || ""}
                      onChange={([e]) => {
                        validation.setFieldValue("dateOfBirth", e);
                      }}
                      options={{
                        // enableTime: true,
                        // noCalendar: true,
                        dateFormat: "d M, Y",
                        // time_24hr: false,
                        // defaultDate: moment().format('LT'),
                      }}
                      className="form-control form-control-sm shadow-none bg-light"
                      id="dateOfBirth"
                    />
                  </div>
                </Col> */}
              </>
            )}
            {(isIPD
              ? patient?._id
              : opdPatientId) && (
              <Col xs={12}>
                <CurrentMedicinesPanel
                  patientId={isIPD ? patient?._id : opdPatientId}
                  type={isIPD ? "IPD" : "OPD"}
                  existingMedicines={medicines}
                  onAddMedicine={addCurrentMedicineToRx}
                />
              </Col>
            )}
            {medicines.some((med) => med.locked) && (
              <Col xs={12} className="mb-3">
                <div className="alert alert-warning py-2 mb-0" role="alert">
                  Some medicines below were prescribed by another doctor. They
                  stay under their name and cannot be edited or removed here —
                  you can still add and manage your own medicines.
                </div>
              </Col>
            )}
            {medicineDropdown}
            {patient?._id && (patient?.addmission?._id || patient?.addmission) && (
              <Col xs={12} className="mb-3">
                <SopSuggestedMedicines
                  patientId={patient._id}
                  existingMedicines={medicines}
                  onPopulate={(newMeds) =>
                    setMedicines((prev) => {
                      const existing = new Set(
                        prev
                          .map((m) => m?.medicine?.name?.toLowerCase?.().trim())
                          .filter(Boolean),
                      );
                      const fresh = newMeds.filter((m) => {
                        const n = m?.medicine?.name?.toLowerCase?.().trim();
                        return n && !existing.has(n);
                      });
                      return [...fresh, ...prev];
                    })
                  }
                />
              </Col>
            )}
            {medicineTable}
            {/* {(prescriptionFormFields || []).map((item, idx) => (
              <Col xs={12} md={6}>
                <div className="pb-4">
                  <Label className="">{item.label}</Label>
                  <Input
                    type="textarea"
                    name={item.name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values[item.name] || ""}
                    className="form-control presc-border rounded"
                    aria-label="With textarea"
                    rows="3"
                  />
                </div>
              </Col>
            ))} */}

            {(prescriptionFormFields || []).map((item, idx) => (
              <Col xs={12} md={6} key={idx}>
                <div className="pb-4">
                  <Label>
                    {item.label}
                    {item?.name === "icdCode" && (
                      <span className="text-danger ms-1">*</span>
                    )}
                  </Label>

                  {item.type === "async-select" ? (
                    <>
                      <Select
                        isClearable={true}
                        placeholder="Search Diagnosis ICD Code 1..."
                        options={icdOptions}
                        value={validation.values.icdCode || null}
                        onInputChange={(value, actionMeta) => {
                          if (actionMeta.action === "input-change") {
                            handleICDSearch(value);
                          }
                        }}
                        onChange={(selected) =>
                          validation.setFieldValue("icdCode", selected)
                        }
                        onBlur={() =>
                          validation.setFieldTouched("icdCode", true)
                        }
                        filterOption={() => true}
                      />
                      {validation.touched.icdCode &&
                        validation.errors.icdCode && (
                          <div
                            className="text-danger mt-1"
                            style={{ fontSize: "12px" }}
                          >
                            {validation.errors.icdCode}
                          </div>
                        )}

                      <Label className="fw-normal mt-3 mb-1 text-muted">
                        Diagnosis ICD Code 2
                      </Label>
                      <Select
                        isMulti
                        placeholder="Search Diagnosis ICD Code 2..."
                        options={icdOptions}
                        value={validation.values.icdCode2 || []}
                        onInputChange={(value, actionMeta) => {
                          if (actionMeta.action === "input-change") {
                            handleICDSearch(value);
                          }
                        }}
                        onChange={(selected) =>
                          validation.setFieldValue("icdCode2", selected || [])
                        }
                        filterOption={() => true}
                      />
                    </>
                  ) : (
                    <Input
                      type="textarea"
                      name={item.name}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values[item.name] || ""}
                      className="form-control presc-border rounded"
                      rows={item.rows || 3}
                    />
                  )}
                </div>
              </Col>
            ))}

            {/* <Col xs={12} md={6}>
              <div className="mb-3">
                <Label className="">Follow Up</Label>
                <Flatpicker
                  name="dateOfAdmission"
                  value={validation.values.followUp || ""}
                  onChange={([e]) => {
                    validation.setFieldValue("followUp", e);
                  }}
                  options={{
                    dateFormat: "d M, Y",
                    // enable: [
                    //   function (date) {
                    //     return date.getDate() === new Date().getDate();
                    //   },
                    // ],
                  }}
                  className="form-control shadow-none bg-light"
                  id="dateOfAdmission"
                />
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="mb-3">
                <Label className="">Referred by</Label>
                <Input
                  type="text"
                  name="referredby"
                  disabled
                  onChange={validation.handleChange}
                  value={validation.values.referredby || ""}
                  className="form-control presc-border rounded"
                  aria-label="With textarea"
                />
              </div>
            </Col> */}

            <Col xs={12} md={6}>
              <div className="mb-3">
                <Label className="">Follow Up</Label>
                <Flatpicker
                  name="dateOfAdmission"
                  value={validation.values.followUp || ""}
                  onChange={([e]) => validation.setFieldValue("followUp", e)}
                  options={{
                    dateFormat: "d M, Y",
                    // enable: [
                    //   function (date) {
                    //     return date.getDate() === new Date().getDate();
                    //   },
                    // ],
                  }}
                  className="form-control shadow-none bg-light"
                />
              </div>

              <div className="mb-3">
                <Label className="">Referred by</Label>
                <Input
                  type="text"
                  name="referredby"
                  disabled
                  value={validation.values.referredby || ""}
                  className="form-control presc-border rounded"
                />
              </div>
            </Col>
          </Row>

          <div className="mt-3">
            <div className="d-flex gap-3 justify-content-end">
              <Button
                onClick={closeForm}
                size="sm"
                color="danger"
                type="button"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit">
                Save
                {/* {chart ? "Update" : "Save"} */}
              </Button>
            </div>
          </div>
        </Form>

        {(type === OPD || type === IPD) && appointment && shouldPrintAfterSave && (
          <Card className="mt-3">
            <CardHeader
              tag="h5"
              className="mb-0 d-flex justify-content-between align-items-center"
            >
              <span className="fs-6 fs-md-5">Latest Charts</span>
              <Button color="primary" size="sm" className="btn-sm">
                <Link
                  to={`/patient/${patient?._id}`}
                  onClick={() =>
                    dispatch(createEditChart({ chart: null, isOpen: false }))
                  }
                  className="text-white text-decoration-none"
                >
                  <span className="">Go to Patient</span>
                </Link>
              </Button>
            </CardHeader>
            <CardBody>
              {(isIPD ? latestChartsForDisplay : opdLatestCharts)
                .filter((chart) => isIPD || chart.chart === PRESCRIPTION)
                .slice(0, 5)
                .map((chart, idx) => (
                  <div className="mb-4" key={chart._id}>
                    {(chart.type === OPD || chart.type === IPD || chart.type === GENERAL) && (
                      <span
                        className={`badge mb-1 ${
                          chart.type === IPD ? "bg-primary" : "bg-success"
                        }`}
                      >
                        {chart.type === GENERAL ? OPD : chart.type}
                      </span>
                    )}
                    <Wrapper
                      hideDropDown
                      item={chart}
                      itemId={`${chart?.id?.prefix}${chart?.id?.patientId}-${chart?.id?.value}`}
                    >
                      {chart.chart === PRESCRIPTION && (
                        <>
                          {!isEditMode && hasCarryForwardableMedicines(chart) && (
                            <div className="d-flex justify-content-end mt-2 mb-2">
                              <Button
                                color="primary"
                                outline={!isStagedForCarryForward(chart)}
                                size="sm"
                                disabled={togglingCarryForwardId === chart._id}
                                onClick={() => handleToggleCarryForward(chart)}
                              >
                                {togglingCarryForwardId === chart._id ? (
                                  <Spinner size="sm" />
                                ) : isStagedForCarryForward(chart) ? (
                                  "Remove from Carry Forward"
                                ) : (
                                  "Add to Carry Forward"
                                )}
                              </Button>
                            </div>
                          )}
                          <PrescriptionChart
                            data={chart?.prescription}
                            baseDate={chart?.date || chart?.createdAt}
                            showDates
                            showOwner
                            currentUserId={currentUserId}
                            fallbackPrescriber={chart?.author}
                          />
                        </>
                      )}
                      {chart.chart === RELATIVE_VISIT && (
                        <div className="mt-4">
                          <RelativeVisit data={chart?.relativeVisit} />
                        </div>
                      )}
                      {chart.chart === DISCHARGE_SUMMARY && (
                        <div className="mt-4">
                          <DischargeSummary data={chart?.dischargeSummary} />
                        </div>
                      )}
                      {chart.chart === VITAL_SIGN && (
                        <div className="mt-4 mx-3">
                          <VitalSign data={chart.vitalSign} />
                        </div>
                      )}
                      {chart.chart === CLINICAL_NOTE && (
                        <div className="mt-4">
                          <ClinicalNote data={chart.clinicalNote} />
                        </div>
                      )}
                      {chart.chart === COUNSELLING_NOTE && (
                        <diV className="mt-4">
                          <CounsellingNote data={chart.counsellingNote} />
                        </diV>
                      )}
                      {chart.chart === LAB_REPORT && (
                        <LabReport
                          data={chart.labReport?.reports}
                          date={chart.labReport?.updatedAt}
                        />
                      )}
                      {chart.chart === DETAIL_ADMISSION && (
                        <div className="mt-4">
                          <DetailAdmission data={chart.detailAdmission} />
                        </div>
                      )}
                    </Wrapper>
                  </div>
                ))}
            </CardBody>
          </Card>
        )}
      </div>
    </React.Fragment>
  );
};

Prescription.propTypes = {
  drugs: PropTypes.array.isRequired,
  author: PropTypes.object.isRequired,
  patient: PropTypes.object.isRequired,
  chartDate: PropTypes.any.isRequired,
  editChartData: PropTypes.object,
  dataList: PropTypes.array,
  type: PropTypes.string.isRequired,
  appointment: PropTypes.object,
  patientLatestOPDPrescription: PropTypes.object,
  charts: PropTypes.array,
};

const mapStateToProps = (state) => ({
  drugs: state.Medicine.data,
  author: state.User.user,
  patient: state.Chart.chartForm?.patient,
  doctor: state.Chart.chartForm?.doctor,
  center: state.Chart.chartForm?.center,
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm?.data,
  shouldPrintAfterSave: state.Chart.chartForm.shouldPrintAfterSave,
  appointment: state.Chart.chartForm.appointment,
  type: state.Chart.chartForm.type,
  charts: state.Chart.charts,
  populatePreviousAppointment:
    state.Chart.chartForm.populatePreviousAppointment,
  patientLatestOPDPrescription: state.Chart.patientLatestOPDPrescription,
});

export default connect(mapStateToProps)(Prescription);