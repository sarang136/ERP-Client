import React, { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import {
  Card,
  CardBody,
  CardHeader,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
} from "reactstrap";
import {
  SEVERITY_OPTIONS,
  VALUELESS_OPERATORS,
  TARGET_OPTIONS,
  OPERATOR_OPTIONS,
  TRIGGER_OPTIONS,
  PERIOD_OPTIONS,
  PER_OPTIONS,
  MEDICINE_INTAKE_OPTIONS,
  MEDICINE_PRIORITY_OPTIONS,
  MEDICINE_CATEGORY_OPTIONS,
  emptyConditionItem,
  emptyTargetBlock,
  emptyForm,
  SOP_CATEGORY_OPTIONS,
  COMPLIANCE_MODEL,
  DAYS_BEFORE_OPERATOR,
  ALERT_DAYS_BEFORE_MAX,
  COMPLIANCE_TEMPLATE_HINT,
  hasComplianceCondition,
} from "../../../Components/constants/sopConstants";
import ConditionRow from "./ConditionRow";
import MainBlock from "./MainBlock";
import RoutingCard from "./RoutingCard";
import SuggestedMedicinesSection from "./medicines/SuggestedMedicinesSection";
import SOPDocumentSection from "./SOPDocumentSection";
import { sopGetFieldsByModel } from "../../../helpers/backend_helper";

// Convert a single stored condition (DB shape) into the form's UI shape.
const findOpt = (options, val) => options.find((o) => o.value === val) || null;
const hydrateSchedule = (s) => {
  if (!s) {
    return {
      period: PERIOD_OPTIONS[0],
      days: [],
      daysOnwards: false,
      intervalHours: "",
      graceHours: 0,
      bands: [],
    };
  }
  return {
    period: findOpt(PERIOD_OPTIONS, s.period) || PERIOD_OPTIONS[0],
    days: Array.isArray(s.days) ? s.days.filter((n) => Number.isFinite(n)) : [],
    daysOnwards: !!s.daysOnwards,
    intervalHours: s.intervalHours != null ? String(s.intervalHours) : "",
    graceHours: s.graceHours != null ? Number(s.graceHours) : 0,
    // FREQUENCY bands → UI rows (toDay null = "onwards").
    bands: Array.isArray(s.bands)
      ? s.bands.map((b) => ({
          fromDay: b.fromDay != null ? String(b.fromDay) : "",
          toDay: b.toDay != null ? String(b.toDay) : "",
          times: b.times != null ? String(b.times) : "",
          per: findOpt(PER_OPTIONS, b.per) || PER_OPTIONS[1],
          onwards: b.toDay == null,
        }))
      : [],
  };
};

const hydrateCondition = (c) => ({
  model: findOpt(TARGET_OPTIONS, c.model),
  field: c.field || "",
  operator: findOpt(OPERATOR_OPTIONS, c.operator) || {
    value: "EXISTS",
    label: "EXISTS",
  },
  triggerType: findOpt(TRIGGER_OPTIONS, c.triggerType) || TRIGGER_OPTIONS[0],
  deadlineHours: c.deadlineHours != null ? String(c.deadlineHours) : "",
  value: Array.isArray(c.value) ? c.value : c.value != null ? [c.value] : [],
  schedule: hydrateSchedule(c.schedule),
  // DAYS_BEFORE (Compliance Valid till) — the alert firing days.
  alertDaysBefore: Array.isArray(c.alertDaysBefore)
    ? c.alertDaysBefore.map(Number).filter((n) => Number.isFinite(n))
    : [],
  arrayMatch: c.arrayMatch
    ? {
        keyField: c.arrayMatch.keyField || "",
        keyValue: c.arrayMatch.keyValue ?? "",
        compareField: c.arrayMatch.compareField || "",
        comparator: c.arrayMatch.comparator || "SEVERITY",
      }
    : null,
  consecutiveMatch: c.consecutiveMatch
    ? {
        count:
          c.consecutiveMatch.count != null
            ? String(c.consecutiveMatch.count)
            : "",
      }
    : null,
  // Mongoose defaults changeMatch.direction to EITHER on every saved condition,
  // so only treat the side-car as present when the operator actually uses it —
  // otherwise an unrelated condition would hydrate a stray direction.
  changeMatch:
    c.operator === "CHANGE_OVER_PERIOD"
      ? {
          direction: c.changeMatch?.direction || "EITHER",
          comparator: c.changeMatch?.comparator || "GREATER_THAN_OR_EQUAL",
          unit: c.changeMatch?.unit || "ABSOLUTE",
          periodUnit: c.changeMatch?.periodUnit || "MONTH",
          periodCount:
            c.changeMatch?.periodCount != null
              ? String(c.changeMatch.periodCount)
              : "1",
        }
      : null,
  // Treat the gate as "on" only when it carries at least one criterion. Mongoose
  // initializes `discontinueGate` to `{ criteria: [] }` on every saved condition
  // (the criteria array path defaults to []), so a present-but-empty gate must
  // hydrate to null — otherwise the checkbox looks ticked and validation errors.
  discontinueGate: c.discontinueGate?.criteria?.length
    ? {
        count:
          c.discontinueGate.count != null
            ? String(c.discontinueGate.count)
            : "",
        criteria: (c.discontinueGate.criteria || []).map((cr) => ({
          field: cr.field || "",
          threshold: cr.threshold != null ? String(cr.threshold) : "",
        })),
      }
    : null,
});

// Builds an AsyncSelect option from a stored medicine doc + snapshot.
// Re-uses the same shape as the AsyncSelect loader so the search input
// displays the selected medicine on edit-mode hydration.
const buildMedicineOption = (medicineId, snap) => {
  if (!medicineId) return null;
  const s = snap || {};
  const label =
    [s.type, s.name, s.strength, s.unit].filter(Boolean).join(" ") ||
    "(Medicine)";
  return {
    value: typeof medicineId === "string" ? medicineId : medicineId.toString(),
    label,
    snapshot: s,
  };
};

const hydrateMedicine = (m) => ({
  id: m._id?.toString?.() || `${Date.now()}-${Math.random()}`,
  medicine: buildMedicineOption(m.medicine, m.medicineSnapshot),
  medicineSnapshot: m.medicineSnapshot || {
    name: "",
    type: "",
    strength: "",
    unit: "",
  },
  dosageAndFrequency: {
    morning: m.dosageAndFrequency?.morning || "",
    evening: m.dosageAndFrequency?.evening || "",
    night: m.dosageAndFrequency?.night || "",
    unit: m.dosageAndFrequency?.unit || "",
  },
  applicableDays: Array.isArray(m.applicableDays)
    ? m.applicableDays.filter((n) => Number.isInteger(n) && n >= 0)
    : [],
  instructions: m.instructions || "",
  intake:
    findOpt(MEDICINE_INTAKE_OPTIONS, m.intake) || MEDICINE_INTAKE_OPTIONS[1],
  priority:
    findOpt(MEDICINE_PRIORITY_OPTIONS, m.priority) ||
    MEDICINE_PRIORITY_OPTIONS[0],
  category:
    findOpt(MEDICINE_CATEGORY_OPTIONS, m.category) ||
    MEDICINE_CATEGORY_OPTIONS[0],
  rationale: m.rationale || "",
});

const SOPForm = ({
  onSubmit,
  isSubmitting = false,
  onCancel,
  initialValues = null,
  submitLabel = "Create SOP Rule",
  submittingLabel = "Creating...",
  // Document state is owned by the parent (SaveRule). In create mode the
  // pending file rides with the rule submit; in edit mode the parent handles
  // upload/delete via separate calls.
  pendingDocument = null,
  onPendingDocumentChange,
  onUploadDocument,
  onRemoveDocument,
  isRemovingDocument = false,
  isUploadingDocument = false,
}) => {
  const [form, setForm] = useState(emptyForm());
  const [satisfyingCriteria, setSatisfyingCriteria] = useState({
    conditions: [emptyConditionItem()],
    centers: [],
  });

  // Center options scoped to the user's access — same source the alerts filter
  // and finance report use. The rule's centers gate which patients it applies to.
  const allCenters = useSelector((s) => s.Center?.data);
  const centerAccess = useSelector((s) => s.User?.centerAccess);
  const centerOptions = (allCenters || [])
    .filter((c) => (centerAccess || []).map((a) => a?._id || a).includes(c._id))
    .map((c) => ({ _id: c._id, title: c.title }));
  const [targetBlocks, setTargetBlocks] = useState([emptyTargetBlock()]);
  const [suggestedMedicines, setSuggestedMedicines] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState(null);
  const [modelFieldsCache, setModelFieldsCache] = useState({});

  // A compliance rule watches the centre licence register, not patients: it
  // uses only the Compliance model, has the Compliance category, notifies roles
  // or named users (no admission care team) and suggests no medicines.
  const isComplianceRule =
    hasComplianceCondition(satisfyingCriteria.conditions) ||
    targetBlocks.some((b) => hasComplianceCondition(b.conditions));

  useEffect(() => {
    if (isComplianceRule) {
      setForm((prev) =>
        prev.category === "COMPLIANCE" ? prev : { ...prev, category: "COMPLIANCE" },
      );
    }
  }, [isComplianceRule]);

  const clearError = (key) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleField = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError(name);
  }, []);

  const fetchModelFields = useCallback(
    async (modelName) => {
      if (!modelName || modelFieldsCache[modelName]) return;
      try {
        const res = await sopGetFieldsByModel(modelName);
        const fields = res?.data?.fields || res?.fields || [];
        setModelFieldsCache((prev) => ({
          ...prev,
          [modelName]: fields?.map((f) => ({
            value: f.path,
            label: f.label,
            type: f.type,
            enumValues: f.options,
          })),
        }));
      } catch {
        setTopError(`Failed to load fields for ${modelName}`);
      }
    },
    [modelFieldsCache],
  );

  // Edit mode: when initialValues is provided, seed every piece of state
  // from the stored rule. Per-block fields (severity, routing, action
  // guidance, reference) hydrate INSIDE each block.
  useEffect(() => {
    if (!initialValues) return;

    setForm({
      ruleName: initialValues.ruleName || "",
      protocol: initialValues.protocol || "",
      category: initialValues.category || "",
      isActive: initialValues.isActive !== false,
    });

    const sc = initialValues.satisfyingCriteria?.conditions?.length
      ? {
          conditions:
            initialValues.satisfyingCriteria.conditions.map(hydrateCondition),
          centers: initialValues.satisfyingCriteria.centers || [],
        }
      : {
          conditions: [emptyConditionItem()],
          centers: initialValues.satisfyingCriteria?.centers || [],
        };
    setSatisfyingCriteria(sc);

    const blocks = initialValues.targetBlocks?.length
      ? initialValues.targetBlocks.map((b) => ({
          id: b._id?.toString() || `${Date.now()}-${Math.random()}`,
          name: b.name || "",
          alertTemplate: b.alertTemplate || "",
          conditions: b.conditions?.length
            ? b.conditions.map(hydrateCondition)
            : [emptyConditionItem()],
          severity:
            findOpt(SEVERITY_OPTIONS, b.severity) || SEVERITY_OPTIONS[1],
          actionGuidance: b.actionGuidance || "",
          referenceSection: b.referenceSection || "",
          selectedRoles: b.routing?.notifyRoles || [],
          selectedUsers: b._specificUsersDetailed || [],
          notifyAdmissionDoctor: b.routing?.notifyAdmissionDoctor || false,
          notifyAdmissionPsychologist:
            b.routing?.notifyAdmissionPsychologist || false,
        }))
      : [emptyTargetBlock()];
    setTargetBlocks(blocks);

    const meds = Array.isArray(initialValues.suggestedMedicines)
      ? initialValues.suggestedMedicines.map(hydrateMedicine)
      : [];
    setSuggestedMedicines(meds);

    // Prefetch field metadata for every unique model referenced.
    const models = new Set();
    sc.conditions.forEach((c) => c.model?.value && models.add(c.model.value));
    blocks.forEach((b) =>
      b.conditions.forEach((c) => c.model?.value && models.add(c.model.value)),
    );
    models.forEach((m) => fetchModelFields(m));
    // Re-hydrate ONLY when a new rule is loaded (initialValues changes).
    // Do NOT add fetchModelFields here: it's recreated whenever
    // modelFieldsCache updates, so including it re-runs this effect every time
    // a model's fields load — which would reset targetBlocks to the saved rule
    // and wipe any newly added (unsaved) blocks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleTargetConditionChange = (blockIdx, condIdx, key, value) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      const conds = [...next[blockIdx].conditions];
      conds[condIdx] = { ...conds[condIdx], [key]: value };
      next[blockIdx] = { ...next[blockIdx], conditions: conds };
      return next;
    });
  };

  const handleTargetBlockField = (blockIdx, key, value) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      next[blockIdx] = { ...next[blockIdx], [key]: value };
      return next;
    });
    if (
      key === "severity" ||
      key === "selectedRoles" ||
      key === "selectedUsers"
    ) {
      clearError("targetBlocks");
    }
  };

  const handleBlockRoleToggle = (blockIdx, roleName) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      const cur = next[blockIdx].selectedRoles || [];
      next[blockIdx] = {
        ...next[blockIdx],
        selectedRoles: cur.includes(roleName)
          ? cur.filter((r) => r !== roleName)
          : [...cur, roleName],
      };
      return next;
    });
    clearError("targetBlocks");
  };

  const handleBlockUsersChange = (blockIdx, selected) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      next[blockIdx] = { ...next[blockIdx], selectedUsers: selected || [] };
      return next;
    });
    clearError("targetBlocks");
  };

  const handleBlockSpecialRoutingToggle = (blockIdx, field, checked) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      next[blockIdx] = { ...next[blockIdx], [field]: checked };
      return next;
    });
    clearError("targetBlocks");
  };

  const addTargetBlock = () =>
    setTargetBlocks((prev) => [...prev, emptyTargetBlock()]);
  const removeTargetBlock = (idx) =>
    setTargetBlocks((prev) => prev.filter((_, i) => i !== idx));

  const addConditionToBlock = (blockIdx) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      next[blockIdx] = {
        ...next[blockIdx],
        conditions: [...next[blockIdx].conditions, emptyConditionItem()],
      };
      return next;
    });
  };

  const removeConditionFromBlock = (blockIdx, condIdx) => {
    setTargetBlocks((prev) => {
      const next = [...prev];
      next[blockIdx].conditions =
        next[blockIdx].conditions.length === 1
          ? next[blockIdx].conditions
          : next[blockIdx].conditions.filter((_, i) => i !== condIdx);
      return next;
    });
  };

  const resetForm = useCallback(() => {
    setForm(emptyForm());
    setSatisfyingCriteria({ conditions: [emptyConditionItem()], centers: [] });
    setTargetBlocks([emptyTargetBlock()]);
    setSuggestedMedicines([]);
    setFieldErrors({});
    setTopError(null);
  }, []);

  const formatSchedule = (s) => {
    if (!s?.period?.value) return undefined;
    const period = s.period.value;
    const interval =
      s.intervalHours !== "" && s.intervalHours != null
        ? Number(s.intervalHours)
        : undefined;
    const grace =
      s.graceHours !== "" && s.graceHours != null ? Number(s.graceHours) : 0;

    const out = { period, graceHours: grace };

    if (period === "DEADLINE") {
      // One-shot: admission + intervalHours = check window.
      if (interval != null && interval > 0) out.intervalHours = interval;
    } else if (period === "CONTINUOUS") {
      // Recurring: every intervalHours from admission until discharge/now.
      if (interval != null && interval > 0) out.intervalHours = interval;
    } else if (period === "DAYS") {
      out.days = Array.isArray(s.days)
        ? s.days
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 0)
            .sort((a, b) => a - b)
        : [];
      // "onwards": due every day after the highest listed day.
      out.daysOnwards = !!s.daysOnwards;
      // intervalHours is optional for DAYS — if set, sub-divides each day.
      if (interval != null && interval > 0) out.intervalHours = interval;
    } else if (period === "FREQUENCY") {
      // Rate-over-range bands. Empty / onwards "To day" → toDay: null.
      out.bands = (Array.isArray(s.bands) ? s.bands : [])
        .map((b) => ({
          fromDay: Number(b.fromDay),
          toDay:
            b.onwards || b.toDay === "" || b.toDay == null
              ? null
              : Number(b.toDay),
          times: Number(b.times),
          per: b.per?.value || b.per || "WEEK",
        }))
        .filter((b) => Number.isFinite(b.fromDay) && Number.isFinite(b.times));
    }

    return out;
  };

  // Converts a UI medicine into the server-shape: option objects → enum strings,
  // snapshot kept verbatim, optional free-text fields dropped if blank.
  const formatMedicine = (m) => {
    const d = m.dosageAndFrequency || {};
    return {
      medicine: m.medicine?.value,
      medicineSnapshot: m.medicineSnapshot || undefined,
      dosageAndFrequency: {
        morning: (d.morning || "").trim(),
        evening: (d.evening || "").trim(),
        night: (d.night || "").trim(),
        unit: (d.unit || "").trim(),
      },
      applicableDays: Array.isArray(m.applicableDays) ? m.applicableDays : [],
      instructions: m.instructions?.trim() || undefined,
      intake: m.intake?.value,
      priority: m.priority?.value,
      category: m.category?.value,
      rationale: m.rationale?.trim() || undefined,
    };
  };

  const formatCondition = (c) => {
    const isCompliance = c.model?.value === COMPLIANCE_MODEL;
    const out = {
      model: c.model?.value,
      field: c.field,
      operator: c.operator?.value,
      // Licence conditions are only ever checked by the daily sweep.
      triggerType: isCompliance ? "DELAYED" : c.triggerType?.value || "IMMEDIATE",
    };

    // Valid till "Days before": the firing days are the whole condition — no
    // value, no schedule.
    if (c.operator?.value === DAYS_BEFORE_OPERATOR) {
      out.alertDaysBefore = (c.alertDaysBefore || []).map(Number);
      return out;
    }

    if (c.triggerType?.value === "DELAYED" && c.deadlineHours) {
      out.deadlineHours = Number(c.deadlineHours);
    }

    if (!VALUELESS_OPERATORS.has(c.operator?.value)) {
      if (Array.isArray(c.value)) {
        out.value = c.value;
      } else {
        const n = Number(c.value);
        out.value = [c.value !== "" && !isNaN(n) ? n : c.value];
      }
    }

    // ARRAY_ANY_MATCHES carries its compositional shape in arrayMatch — the
    // server validator + evaluator both look here for {keyField, keyValue,
    // compareField, comparator}. comparator drives severity-vs-numeric mode;
    // omitting it makes the server default to SEVERITY and reject a numeric
    // compareField like "ulnMultiplier". Skipped for every other operator.
    if (c.operator?.value === "ARRAY_ANY_MATCHES" && c.arrayMatch) {
      out.arrayMatch = {
        keyField: c.arrayMatch.keyField,
        keyValue: c.arrayMatch.keyValue,
        compareField: c.arrayMatch.compareField,
        comparator: c.arrayMatch.comparator || "SEVERITY",
      };
    }

    // CONSECUTIVE_LOW carries the consecutive count in consecutiveMatch.
    if (c.operator?.value === "CONSECUTIVE_LOW" && c.consecutiveMatch) {
      out.consecutiveMatch = {
        count: Number(c.consecutiveMatch.count),
      };
    }

    // CHANGE_OVER_PERIOD carries direction/comparator/unit and the period
    // length in changeMatch. Thresholds stay in value[0] (and value[1] for
    // BETWEEN) and are always positive — direction carries the sign.
    if (c.operator?.value === "CHANGE_OVER_PERIOD") {
      out.changeMatch = {
        direction: c.changeMatch?.direction || "EITHER",
        comparator: c.changeMatch?.comparator || "GREATER_THAN_OR_EQUAL",
        unit: c.changeMatch?.unit || "ABSOLUTE",
        periodUnit: c.changeMatch?.periodUnit || "MONTH",
        periodCount: Number(c.changeMatch?.periodCount) || 1,
      };
    }

    // Optional discontinue-gate on a DELAYED cadence condition — suppresses the
    // missing-assessment alert once the patient's recent scores are stable.
    if (c.discontinueGate?.criteria?.length) {
      out.discontinueGate = {
        count: Number(c.discontinueGate.count),
        criteria: c.discontinueGate.criteria.map((cr) => ({
          field: cr.field,
          threshold: Number(cr.threshold),
        })),
      };
    }

    // Schedule is only meaningful for DELAYED conditions, and only when the
    // user picked a non-default pattern. Never for licence conditions.
    if (c.triggerType?.value === "DELAYED" && !isCompliance) {
      const sched = formatSchedule(c.schedule);
      if (sched) out.schedule = sched;
    }

    return out;
  };

  const validate = () => {
    const errs = {};
    if (!form.ruleName.trim()) errs.ruleName = "Rule name is required";
    if (!form.category) errs.category = "Select a category";
    if (!satisfyingCriteria.centers?.length)
      errs.satisfyingCriteriaCenters = "Select at least one center";

    let hasTargetErrors = false;
    const targetErrors = targetBlocks.map((block) => {
      const bErr = { conditions: [] };
      block.conditions.forEach((c, cIdx) => {
        if (!c.model) {
          bErr.conditions[cIdx] = "Model is required";
          hasTargetErrors = true;
        } else if (!c.field) {
          bErr.conditions[cIdx] = "Field is required";
          hasTargetErrors = true;
        } else if (isComplianceRule && c.model.value !== COMPLIANCE_MODEL) {
          bErr.conditions[cIdx] =
            "A compliance rule can only use the Compliance model — make this a separate rule";
          hasTargetErrors = true;
        } else if (c.operator?.value === DAYS_BEFORE_OPERATOR) {
          const days = c.alertDaysBefore || [];
          if (!days.length) {
            bErr.conditions[cIdx] = "Add at least one alert firing day";
            hasTargetErrors = true;
          } else if (
            days.some(
              (d) =>
                !Number.isInteger(Number(d)) ||
                Number(d) < 0 ||
                Number(d) > ALERT_DAYS_BEFORE_MAX,
            )
          ) {
            bErr.conditions[cIdx] = `Firing days must be whole numbers from 0 to ${ALERT_DAYS_BEFORE_MAX}`;
            hasTargetErrors = true;
          }
        } else if (c.model.value === COMPLIANCE_MODEL && !c.value?.[0]) {
          bErr.conditions[cIdx] = "Pick a value";
          hasTargetErrors = true;
        } else if (c.operator?.value === "ARRAY_ANY_MATCHES") {
          if (!c.arrayMatch?.keyValue) {
            bErr.conditions[cIdx] = "Pick a test for this condition";
            hasTargetErrors = true;
          } else if (!c.value?.[0]) {
            bErr.conditions[cIdx] = "Pick a severity threshold";
            hasTargetErrors = true;
          }
        } else if (
          c.operator?.value === "OLDER_THAN_DAYS" ||
          c.operator?.value === "OLDER_THAN_HOURS"
        ) {
          const n = Number(c.value?.[0]);
          if (!Number.isFinite(n) || n <= 0) {
            bErr.conditions[cIdx] = `Enter a positive number of ${
              c.operator.value === "OLDER_THAN_HOURS" ? "hours" : "days"
            }`;
            hasTargetErrors = true;
          }
        } else if (c.operator?.value === "CONSECUTIVE_LOW") {
          const threshold = Number(c.value?.[0]);
          if (!Number.isFinite(threshold)) {
            bErr.conditions[cIdx] = "Enter a numeric threshold";
            hasTargetErrors = true;
          }
          const count = Number(c.consecutiveMatch?.count);
          if (!Number.isFinite(count) || count < 1) {
            bErr.conditions[cIdx] = "Consecutive count must be >= 1";
            hasTargetErrors = true;
          }
        } else if (c.operator?.value === "CHANGE_OVER_PERIOD") {
          // Thresholds are always positive — the direction carries the sign.
          const low = Number(c.value?.[0]);
          const count = Number(c.changeMatch?.periodCount);
          if (!Number.isFinite(low) || low <= 0) {
            bErr.conditions[cIdx] = "Enter a positive change amount";
            hasTargetErrors = true;
          } else if (c.changeMatch?.comparator === "BETWEEN") {
            // Checked explicitly: the flagged-items editor only validates the
            // low operand, so an empty high field reaches the server.
            const high = Number(c.value?.[1]);
            if (!Number.isFinite(high)) {
              bErr.conditions[cIdx] = "Enter both ends of the range";
              hasTargetErrors = true;
            } else if (low > high) {
              bErr.conditions[cIdx] = "Range low must be ≤ high";
              hasTargetErrors = true;
            }
          }
          if (!hasTargetErrors && (!Number.isInteger(count) || count < 1)) {
            bErr.conditions[cIdx] = "Period must be a whole number ≥ 1";
            hasTargetErrors = true;
          }
        } else if (
          c.triggerType?.value === "DELAYED" &&
          c.schedule?.period?.value === "FREQUENCY"
        ) {
          const bands = c.schedule?.bands || [];
          const bad = bands.some(
            (b) =>
              !(Number(b.fromDay) >= 0) ||
              !(Number(b.times) >= 1) ||
              (!b.onwards &&
                b.toDay !== "" &&
                b.toDay != null &&
                Number(b.toDay) < Number(b.fromDay)),
          );
          if (bands.length === 0) {
            bErr.conditions[cIdx] = "Add at least one frequency band";
            hasTargetErrors = true;
          } else if (bad) {
            bErr.conditions[cIdx] =
              "Each band needs From day, Times ≥ 1, and To ≥ From (or onwards)";
            hasTargetErrors = true;
          }
        }

        // Optional discontinue-gate — validate independently of the operator
        // chain above (it's an add-on to a DELAYED cadence condition).
        // Only validate the gate when it's actually enabled (has ≥1 criterion);
        // an empty {criteria: []} (Mongoose default on every saved condition)
        // means the gate is off and must not raise a false "count" error.
        if (c.discontinueGate?.criteria?.length && !bErr.conditions[cIdx]) {
          const gcount = Number(c.discontinueGate.count);
          const criteria = c.discontinueGate.criteria;
          if (!Number.isFinite(gcount) || gcount < 1) {
            bErr.conditions[cIdx] = "Discontinue gate: count must be ≥ 1";
            hasTargetErrors = true;
          } else if (
            criteria.some(
              (cr) => !cr.field || !Number.isFinite(Number(cr.threshold)),
            )
          ) {
            bErr.conditions[cIdx] =
              "Discontinue gate: each criterion needs a field and numeric threshold";
            hasTargetErrors = true;
          }
        }
      });
      // A compliance block fires from exactly one "Valid till — Days before".
      if (isComplianceRule) {
        const expiryIdx = block.conditions
          .map((c, i) => (c.operator?.value === DAYS_BEFORE_OPERATOR ? i : -1))
          .filter((i) => i >= 0);
        if (expiryIdx.length === 0 && !bErr.conditions[0]) {
          bErr.conditions[0] =
            'This block needs a "Valid till — Days before" condition';
          hasTargetErrors = true;
        } else if (expiryIdx.length > 1 && !bErr.conditions[expiryIdx[1]]) {
          bErr.conditions[expiryIdx[1]] = "Only one Valid till condition per block";
          hasTargetErrors = true;
        }
      }
      if (!block.name?.trim()) {
        bErr.name = "Rule name is required";
        hasTargetErrors = true;
      }
      if (!block.severity?.value) {
        bErr.severity = "Severity is required";
        hasTargetErrors = true;
      }
      // The admission care-team toggles are hidden (and not sent) on a
      // compliance rule, so they can't count towards its routing.
      const hasRouting =
        (block.selectedRoles?.length || 0) +
          (block.selectedUsers?.length || 0) +
          (!isComplianceRule && block.notifyAdmissionDoctor ? 1 : 0) +
          (!isComplianceRule && block.notifyAdmissionPsychologist ? 1 : 0) >
        0;
      if (!hasRouting) {
        bErr.routing = isComplianceRule
          ? "Pick at least one role or specific user"
          : "Add at least one notification channel";
        hasTargetErrors = true;
      }
      return bErr;
    });
    if (hasTargetErrors) errs.targetBlocks = targetErrors;

    // Satisfying Criteria on a compliance rule: licence filters only, each
    // with a value. (Empty rows are dropped on submit.)
    if (isComplianceRule) {
      const scErrors = satisfyingCriteria.conditions.map((c) => {
        if (!c.model || !c.field) return undefined;
        if (c.model.value !== COMPLIANCE_MODEL)
          return "A compliance rule can only use the Compliance model";
        if (!c.value?.[0]) return "Pick a value";
        return undefined;
      });
      if (scErrors.some(Boolean))
        errs.satisfyingCriteria = { conditions: scErrors };
      if (form.category !== "COMPLIANCE")
        errs.category = "A compliance rule's category must be Compliance";
    } else if (form.category === "COMPLIANCE") {
      errs.category =
        "The Compliance category is for rules on the Compliance model";
    }

    let hasMedErrors = false;
    const medErrors = suggestedMedicines.map((m) => {
      const mErr = {};
      if (!m.medicine?.value) {
        mErr.medicine = "Medicine is required";
        hasMedErrors = true;
      }
      const d = m.dosageAndFrequency || {};
      const hasAnyDose =
        (d.morning && d.morning.trim()) ||
        (d.evening && d.evening.trim()) ||
        (d.night && d.night.trim());
      if (!hasAnyDose) {
        mErr.dose = "Enter at least one dose (Morning / Evening / Night)";
        hasMedErrors = true;
      }
      if (!d.unit || !d.unit.trim()) {
        mErr.unit = "Unit is required";
        hasMedErrors = true;
      }
      if (!m.intake?.value) {
        mErr.intake = "Intake is required";
        hasMedErrors = true;
      }
      return mErr;
    });
    if (hasMedErrors) errs.suggestedMedicines = medErrors;

    return { valid: !Object.keys(errs).length, errors: errs };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTopError(null);

    const { valid, errors } = validate();
    if (!valid) {
      setFieldErrors(errors);
      setTopError("Please fix the highlighted fields before submitting");
      return;
    }
    setFieldErrors({});

    const validSCConditions = satisfyingCriteria.conditions.filter(
      (c) => c.model && c.field,
    );

    const payload = {
      ruleName: form.ruleName.trim(),
      category: form.category,
      isActive: form.isActive,
      targetBlocks: targetBlocks.map((block) => ({
        name: block.name?.trim(),
        alertTemplate: block.alertTemplate?.trim() || undefined,
        conditions: block.conditions
          .filter((c) => c.model && c.field)
          .map(formatCondition),
        severity: block.severity?.value,
        actionGuidance: block.actionGuidance?.trim() || undefined,
        referenceSection: block.referenceSection?.trim() || undefined,
        routing: {
          ...(block.selectedRoles?.length && {
            notifyRoles: block.selectedRoles,
          }),
          ...(block.selectedUsers?.length && {
            notifySpecificUsers: block.selectedUsers.map((u) => u.value),
          }),
          ...(!isComplianceRule &&
            block.notifyAdmissionDoctor && { notifyAdmissionDoctor: true }),
          ...(!isComplianceRule &&
            block.notifyAdmissionPsychologist && {
              notifyAdmissionPsychologist: true,
            }),
        },
      })),
    };

    // Always send satisfyingCriteria so the rule's centers persist even when
    // there are no filter conditions.
    payload.satisfyingCriteria = {
      centers: satisfyingCriteria.centers || [],
      ...(validSCConditions.length > 0 && {
        conditions: validSCConditions.map(formatCondition),
      }),
    };

    if (suggestedMedicines.length > 0 && !isComplianceRule) {
      payload.suggestedMedicines = suggestedMedicines.map(formatMedicine);
    }

    if (form.protocol.trim()) payload.protocol = form.protocol.trim();

    try {
      const response = await onSubmit(payload);
      if (response) resetForm();
    } catch (err) {

      setTopError(err?.message || "Submission failed");
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {topError && (
        <Alert color="danger" toggle={() => setTopError(null)}>
          {topError}
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader className="fw-semibold">1. Basic Info</CardHeader>
        <CardBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="ruleName">
                  SOP Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="ruleName"
                  name="ruleName"
                  value={form.ruleName}
                  onChange={handleField}
                  invalid={!!fieldErrors.ruleName}
                  disabled={isSubmitting}
                />
                {fieldErrors.ruleName && (
                  <small className="text-danger">{fieldErrors.ruleName}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="sopCategory">
                  SOP Category <span className="text-danger">*</span>
                </Label>
                <Select
                  inputId="sopCategory"
                  options={SOP_CATEGORY_OPTIONS}
                  value={
                    SOP_CATEGORY_OPTIONS.find((o) => o.value === form.category) ||
                    null
                  }
                  onChange={(opt) =>
                    setForm((prev) => ({ ...prev, category: opt?.value || "" }))
                  }
                  isDisabled={isSubmitting}
                  placeholder="Select category..."
                />
                {fieldErrors.category && (
                  <small className="text-danger">{fieldErrors.category}</small>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="protocol">Protocol</Label>
                <Input
                  id="protocol"
                  name="protocol"
                  value={form.protocol}
                  onChange={handleField}
                  disabled={isSubmitting}
                />
              </FormGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <MainBlock
        satisfyingCriteria={satisfyingCriteria}
        setSatisfyingCriteria={setSatisfyingCriteria}
        centerOptions={centerOptions}
        centersError={fieldErrors.satisfyingCriteriaCenters}
        modelFieldsCache={modelFieldsCache}
        fetchModelFields={fetchModelFields}
        isSubmitting={isSubmitting}
        fieldErrors={fieldErrors}
        isComplianceRule={isComplianceRule}
      />

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold mb-0">3. Target Blocks</h5>
          <Button
            color="primary"
            size="sm"
            onClick={addTargetBlock}
            disabled={isSubmitting}
          >
            + Add Block
          </Button>
        </div>

        {targetBlocks.map((block, bIdx) => {
          const blockErrors = fieldErrors.targetBlocks?.[bIdx] || {};
          return (
            <Card key={block.id} className="mb-3 border-secondary">
              <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Block {bIdx + 1}</span>
                {targetBlocks.length > 1 && (
                  <Button
                    type="button"
                    color="danger"
                    size="sm"
                    outline
                    onClick={() => removeTargetBlock(bIdx)}
                    disabled={isSubmitting}
                  >
                    Remove Block
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {/* Rule Name — block label, shown in alert UI as "Rule" */}
                <FormGroup>
                  <Label>
                    Rule Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    value={block.name || ""}
                    onChange={(e) =>
                      handleTargetBlockField(bIdx, "name", e.target.value)
                    }
                    invalid={!!blockErrors.name}
                    placeholder="e.g. Severe-SBP180"
                    disabled={isSubmitting}
                  />
                  {blockErrors.name && (
                    <small className="text-danger">{blockErrors.name}</small>
                  )}
                </FormGroup>

                {/* Severity + Alert Template — top row per block */}
                <Row>
                  <Col md={3}>
                    <FormGroup>
                      <Label>
                        Severity <span className="text-danger">*</span>
                      </Label>
                      <Select
                        options={SEVERITY_OPTIONS}
                        value={block.severity}
                        onChange={(v) =>
                          handleTargetBlockField(bIdx, "severity", v)
                        }
                        isDisabled={isSubmitting}
                      />
                      {blockErrors.severity && (
                        <small className="text-danger">
                          {blockErrors.severity}
                        </small>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={9}>
                    <FormGroup>
                      <Label>Alert Template</Label>
                      <Input
                        type="textarea"
                        rows="2"
                        placeholder={
                          isComplianceRule
                            ? "{complianceType} for {centre} expires on {validTill} — {daysLeft} left"
                            : "Patient {patient.name} — {field.value}"
                        }
                        value={block.alertTemplate}
                        onChange={(e) =>
                          handleTargetBlockField(
                            bIdx,
                            "alertTemplate",
                            e.target.value,
                          )
                        }
                        disabled={isSubmitting}
                      />
                      {isComplianceRule && (
                        <small className="text-muted d-block mt-1">
                          Optional. You can use {COMPLIANCE_TEMPLATE_HINT}.
                          Left empty, the alert reads e.g. &ldquo;Fire NOC for
                          Pune expires on 15 Dec 2026 — 30 days left
                          (FIRE/PUN/1040).&rdquo;
                        </small>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                {/* Conditions */}
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Label className="fw-bold mb-0">
                      Conditions <span className="text-danger">*</span>
                    </Label>
                    <Button
                      type="button"
                      color="secondary"
                      size="sm"
                      outline
                      onClick={() => addConditionToBlock(bIdx)}
                      disabled={isSubmitting}
                    >
                      + Add Condition
                    </Button>
                  </div>
                  {block.conditions.map((c, cIdx) => (
                    <ConditionRow
                      key={cIdx}
                      condition={c}
                      idx={cIdx}
                      onChange={(idx, key, val) =>
                        handleTargetConditionChange(bIdx, idx, key, val)
                      }
                      onRemove={(idx) => removeConditionFromBlock(bIdx, idx)}
                      isDisabled={isSubmitting}
                      isOnly={block.conditions.length === 1}
                      error={blockErrors.conditions?.[cIdx]}
                      modelFieldsCache={modelFieldsCache}
                      onModelChange={fetchModelFields}
                    />
                  ))}
                </div>

                {/* Per-block Routing */}
                <div className="mt-3">
                  <RoutingCard
                    selectedRoles={block.selectedRoles || []}
                    onRoleToggle={(roleName) =>
                      handleBlockRoleToggle(bIdx, roleName)
                    }
                    selectedUsers={block.selectedUsers || []}
                    onUsersChange={(sel) => handleBlockUsersChange(bIdx, sel)}
                    notifyAdmissionDoctor={block.notifyAdmissionDoctor}
                    notifyAdmissionPsychologist={
                      block.notifyAdmissionPsychologist
                    }
                    onSpecialRoutingToggle={(field, checked) =>
                      handleBlockSpecialRoutingToggle(bIdx, field, checked)
                    }
                    idPrefix={bIdx}
                    routingError={blockErrors.routing}
                    isSubmitting={isSubmitting}
                    hideAdmissionToggles={isComplianceRule}
                  />
                </div>

                {/* Per-block Alert Details (optional) */}
                <Row className="mt-2">
                  <Col md={8}>
                    <FormGroup>
                      <Label>Action Guidance (optional)</Label>
                      <Input
                        type="textarea"
                        rows="2"
                        value={block.actionGuidance || ""}
                        onChange={(e) =>
                          handleTargetBlockField(
                            bIdx,
                            "actionGuidance",
                            e.target.value,
                          )
                        }
                        disabled={isSubmitting}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Reference Section</Label>
                      <Input
                        value={block.referenceSection || ""}
                        onChange={(e) =>
                          handleTargetBlockField(
                            bIdx,
                            "referenceSection",
                            e.target.value,
                          )
                        }
                        disabled={isSubmitting}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {!isComplianceRule && (
        <SuggestedMedicinesSection
          medicines={suggestedMedicines}
          onChange={setSuggestedMedicines}
          isSubmitting={isSubmitting}
          errors={fieldErrors.suggestedMedicines || []}
        />
      )}

      <SOPDocumentSection
        mode={initialValues ? "edit" : "create"}
        document={initialValues?.document || null}
        pendingFile={pendingDocument}
        onPendingFileChange={onPendingDocumentChange}
        onUploadFile={onUploadDocument}
        onRemoveExisting={onRemoveDocument}
        isSubmitting={isSubmitting}
        isRemoving={isRemovingDocument}
        isUploading={isUploadingDocument}
      />

      <div className="d-flex justify-content-end gap-2">
        {onCancel && (
          <Button
            type="button"
            color="secondary"
            outline
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          color="secondary"
          outline
          onClick={resetForm}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" color="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </Form>
  );
};

export default SOPForm;
