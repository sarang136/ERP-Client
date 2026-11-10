import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Input, Button, Row, Col, Label } from "reactstrap";
import CreatableSelect from "react-select/creatable";
import {
  GENDER_OPTIONS,
  OPERATOR_OPTIONS,
  VALUELESS_OPERATORS,
  TARGET_OPTIONS,
  TRIGGER_OPTIONS,
  OPERATORS_BY_TYPE,
  BOOLEAN_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  PERIOD_OPTIONS,
  PER_OPTIONS,
  emptyBand,
  SEVERITY_THRESHOLD_OPTIONS,
  ANY_LAB_TEST_OPTION,
  RELATIVE_DAY_OPERATORS,
  CHANGE_DIRECTION_OPTIONS,
  CHANGE_COMPARATOR_OPTIONS,
  CHANGE_UNIT_OPTIONS,
  CHANGE_PERIOD_UNIT_OPTIONS,
  CRITERIA_ONLY_FIELD_TYPES,
  TARGET_ONLY_FIELD_TYPES,
  COMPLIANCE_MODEL,
  DAYS_BEFORE_OPERATOR,
  ALERT_DAYS_BEFORE_OPTIONS,
  ALERT_DAYS_BEFORE_MAX,
  alertDaysBeforeLabel,
} from "../../../Components/constants/sopConstants";
import { getICDCodes, sopGetLabTests } from "../../../helpers/backend_helper";

// Cache lab-test catalogue at module scope — same across all ConditionRow
// instances in a session. Loaded lazily the first time a row needs it.
let _labTestsPromise = null;
const loadLabTests = () => {
  if (!_labTestsPromise) {
    _labTestsPromise = sopGetLabTests()
      .then(
        (res) =>
          res?.data || res || { tests: [], panels: [], severityThresholds: [] },
      )
      .catch(() => ({ tests: [], panels: [], severityThresholds: [] }));
  }
  return _labTestsPromise;
};

const ICD_FIELDS = new Set([
  "provisional_diagnosis",
  "doctorSignature.provisionaldiagnosis",
]);

const ConditionRow = ({
  condition,
  idx,
  onChange,
  onRemove,
  isDisabled,
  disableTrigger = false,
  // True for Satisfying Criteria rows (MainBlock). Criteria-only fields are
  // offered there and hidden from target-block rows.
  isCriteria = false,
  isOnly,
  error,
  modelFieldsCache,
  onModelChange,
}) => {
  const [icdOptions, setIcdOptions] = useState([]);
  const [isLoadingIcd, setIsLoadingIcd] = useState(false);
  const [labTests, setLabTests] = useState([]);
  const [labPanels, setLabPanels] = useState([]);

  const fieldOptions = modelFieldsCache[condition.model?.value] || [];
  // What the Field dropdown offers. Lookups below keep using the full list, so
  // a condition saved before this filter still displays its field.
  const pickableFieldOptions = isCriteria
    ? fieldOptions.filter((f) => !TARGET_ONLY_FIELD_TYPES.has(f.type))
    : fieldOptions.filter((f) => !CRITERIA_ONLY_FIELD_TYPES.has(f.type));
  const selectedField = fieldOptions.find((f) => f.value === condition.field);
  const fieldType = selectedField?.type || "String";
  const fieldEnumOpts = selectedField?.enumValues || null;

  const isFieldExists = condition.field === "FIELD_EXISTS";
  const isProvisional = ICD_FIELDS.has(condition.field);
  const isGender = condition.field === "gender";
  const isBloodGroup = condition.field === "detailAdmission.bloodGroup";
  const isBoolean = fieldType === "Boolean";
  const isFlaggedItems = fieldType === "FlaggedItemArray";
  const isConsecutiveLow = condition.operator?.value === "CONSECUTIVE_LOW";
  const isChangeOverPeriod = condition.operator?.value === "CHANGE_OVER_PERIOD";
  const isDelayed = condition.triggerType?.value === "DELAYED";
  const isFrequency = condition.schedule?.period?.value === "FREQUENCY";
  // Compliance (centre licence) conditions: checked by the daily licence sweep,
  // so no trigger / schedule controls. Valid till fires "N days before".
  const isCompliance = condition.model?.value === COMPLIANCE_MODEL;
  const isDaysBefore = condition.operator?.value === DAYS_BEFORE_OPERATOR;
  const hasEnum =
    !!fieldEnumOpts && !isGender && !isProvisional && !isBloodGroup;

  const allowedOps = isFlaggedItems
    ? ["ARRAY_ANY_MATCHES"]
    : isBoolean
      ? ["EQUALS"]
      : isFieldExists
        ? []
        : OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.String;

  const filteredOps = OPERATOR_OPTIONS.filter((op) =>
    allowedOps.includes(op.value),
  );
  const valueless = VALUELESS_OPERATORS.has(condition.operator?.value);

  useEffect(() => {
    if (isProvisional && icdOptions.length === 0) fetchIcd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition.field]);

  useEffect(() => {
    if (!isFlaggedItems) return;
    let cancelled = false;
    loadLabTests().then((data) => {
      if (cancelled) return;
      setLabTests(Array.isArray(data?.tests) ? data.tests : []);
      setLabPanels(Array.isArray(data?.panels) ? data.panels : []);
    });
    return () => {
      cancelled = true;
    };
  }, [isFlaggedItems]);

  const fetchIcd = async () => {
    setIsLoadingIcd(true);
    try {
      const res = await getICDCodes();
      const dataArray = Array.isArray(res) ? res : res.data || [];
      setIcdOptions(
        dataArray.map((i) => ({
          value: i._id,
          // Code first, then the name — matching how the diagnosis is picked
          // everywhere else (AdmitPatient, DoctorSignature, Prescription), so
          // the same diagnosis reads the same way when authoring a rule as it
          // does on the admission. The code is the part users search by.
          label: `${i.code} - ${i.text}`,
        })),
      );
    } catch (err) {
    } finally {
      setIsLoadingIcd(false);
    }
  };

  const handleModelChange = (selected) => {
    onChange(idx, "model", selected);
    onChange(idx, "field", "");
    onChange(idx, "value", []);
    onChange(idx, "operator", { value: "EXISTS", label: "EXISTS" });
    onChange(idx, "arrayMatch", null);
    onChange(idx, "alertDaysBefore", []);
    // Licence conditions are only ever checked by the daily sweep.
    if (selected?.value === COMPLIANCE_MODEL) {
      onChange(idx, "triggerType", TRIGGER_OPTIONS[1]);
    }
    if (selected?.value) onModelChange(selected.value);
  };

  const handleFieldChange = (selected) => {
    const newField = selected?.value || "";
    const newType =
      fieldOptions.find((f) => f.value === newField)?.type || "String";
    onChange(idx, "field", newField);
    onChange(idx, "value", []);
    // Valid till: the only operator is "Days before", seeded with 30 days.
    if (newType === "ComplianceExpiry") {
      onChange(idx, "operator", {
        value: DAYS_BEFORE_OPERATOR,
        label: "Days before (alert)",
      });
      onChange(idx, "triggerType", TRIGGER_OPTIONS[1]);
      onChange(
        idx,
        "alertDaysBefore",
        condition.alertDaysBefore?.length ? condition.alertDaysBefore : [30],
      );
      onChange(idx, "arrayMatch", null);
      onChange(idx, "changeMatch", null);
      return;
    }
    onChange(idx, "alertDaysBefore", []);
    if (newType === "FlaggedItemArray") {
      onChange(idx, "operator", {
        value: "ARRAY_ANY_MATCHES",
        label: "ARRAY ANY MATCHES",
      });
      onChange(idx, "arrayMatch", {
        keyField: "canonicalName",
        keyValue: "",
        compareField: "severity",
        comparator: "SEVERITY",
      });
    } else {
      onChange(
        idx,
        "operator",
        newField === "FIELD_EXISTS"
          ? { value: "EXISTS", label: "EXISTS" }
          : newType === "Boolean"
            ? { value: "EQUALS", label: "EQUALS" }
            : { value: "EQUALS", label: "EQUALS" },
      );
      onChange(idx, "arrayMatch", null);
    }
    // A field change always resets the operator above, so the trend side-car
    // can never still apply — clear it, mirroring arrayMatch.
    onChange(idx, "changeMatch", null);
    if (ICD_FIELDS.has(newField)) fetchIcd();
  };
  // FlaggedItemArray supports two modes, set via arrayMatch.comparator:
  //   SEVERITY (default) — Test + severity bucket (existing behaviour).
  //   GREATER_THAN / LESS_THAN / *_OR_EQUAL / BETWEEN — Test + numeric ULN
  //     multiplier (or other numeric compareField) + threshold value(s).
  // The mode toggle drives which sub-editor renders.
  // Labels are basis-agnostic — what the number means (× ULN, × LLN or an
  // absolute value) is chosen separately in COMPARE_BASIS_OPTIONS below.
  const MODE_OPTIONS = [
    { value: "SEVERITY", label: "By severity" },
    { value: "GREATER_THAN", label: "Numeric  >" },
    { value: "GREATER_THAN_OR_EQUAL", label: "Numeric  ≥" },
    { value: "LESS_THAN", label: "Numeric  <" },
    { value: "LESS_THAN_OR_EQUAL", label: "Numeric  ≤" },
    { value: "BETWEEN", label: "Numeric  between (low ≤ x ≤ high)" },
    {
      value: "BETWEEN_EXCLUSIVE_LOW",
      label: "Numeric  band (low < x ≤ high)",
    },
  ];

  // What the threshold is measured against. Tiering tables written as "× ULN"
  // use the default; eGFR and other DOWN_ONLY tests have no ULN at all and are
  // authored either against their lower limit or as a plain absolute value.
  const COMPARE_BASIS_OPTIONS = [
    { value: "ulnMultiplier", label: "× ULN (upper limit)", bound: "uln" },
    { value: "llnMultiplier", label: "× LLN (lower limit)", bound: "lln" },
    { value: "numericValue", label: "Absolute value", bound: null },
  ];

  const BAND_COMPARATORS = new Set(["BETWEEN", "BETWEEN_EXCLUSIVE_LOW"]);

  const renderFlaggedItemsEditor = () => {
    const comparator = condition.arrayMatch?.comparator || "SEVERITY";
    const isSeverityMode = comparator === "SEVERITY";

    const compareField =
      condition.arrayMatch?.compareField ||
      (isSeverityMode ? "severity" : "ulnMultiplier");
    const basis =
      COMPARE_BASIS_OPTIONS.find((b) => b.value === compareField) ||
      COMPARE_BASIS_OPTIONS[0];

    // Test options:
    //   Severity mode keeps the wildcard ("Any test").
    //   Numeric modes only offer tests for which the chosen basis exists — a
    //   "× ULN" comparison against a test with uln=null can never match, so
    //   offering it would just produce a silently dead rule. "Absolute value"
    //   needs no bound, so every test qualifies there. This is what makes eGFR
    //   (uln=null, lln=60) authorable: pick × LLN or Absolute value.
    const testsForMode = isSeverityMode
      ? labTests
      : labTests.filter((t) => !basis.bound || t[basis.bound] != null);
    const testOpts = [
      ...(isSeverityMode ? [ANY_LAB_TEST_OPTION] : []),
      ...testsForMode.map((t) => ({
        value: t.id,
        label: t.display || t.id,
        uln: t.uln,
        lln: t.lln,
        unit: t.unit,
      })),
    ];

    // keyValue is one id, "*", or a list of ids (a panel). Normalise to an array
    // so the multi-select works for every shape, including rules authored before
    // panels existed.
    const keyValueArr = Array.isArray(condition.arrayMatch?.keyValue)
      ? condition.arrayMatch.keyValue
      : condition.arrayMatch?.keyValue
        ? [condition.arrayMatch.keyValue]
        : [];
    const isWildcardSelected = keyValueArr[0] === ANY_LAB_TEST_OPTION.value;
    const selectedTests = isWildcardSelected
      ? [ANY_LAB_TEST_OPTION]
      : testOpts.filter((o) => keyValueArr.includes(o.value));
    // The × ULN hint only means something for a single test — each test has its
    // own ULN, so there is no one figure to show for a panel.
    const selectedTest = selectedTests.length === 1 ? selectedTests[0] : null;

    // Panels fill the selection in one click; they are not stored, so switching
    // panel just replaces the ids.
    const panelOpts = labPanels.map((p) => ({
      value: p.id,
      label: p.display,
      tests: p.tests,
    }));
    const activePanel =
      panelOpts.find(
        (p) =>
          p.tests.length === keyValueArr.length &&
          p.tests.every((t) => keyValueArr.includes(t)),
      ) || null;
    const selectedSeverity =
      SEVERITY_THRESHOLD_OPTIONS.find(
        (o) => o.value === condition.value?.[0],
      ) || null;
    const selectedMode =
      MODE_OPTIONS.find((o) => o.value === comparator) || MODE_OPTIONS[0];

    // Switching mode wipes test/value so we never leave stale state (e.g. a
    // severity token in `value` while the comparator is GREATER_THAN, which
    // the server validator would reject).
    const handleModeChange = (next) => {
      const nextComparator = next?.value || "SEVERITY";
      const isNextSeverity = nextComparator === "SEVERITY";
      onChange(idx, "arrayMatch", {
        keyField: "canonicalName",
        keyValue: "",
        // Switching between two numeric modes keeps the chosen basis; only a
        // move to or from severity mode forces it.
        compareField: isNextSeverity
          ? "severity"
          : isSeverityMode
            ? "ulnMultiplier"
            : compareField,
        comparator: nextComparator,
      });
      onChange(idx, "value", []);
    };

    // Changing the basis can invalidate the selected test (eGFR has no ULN),
    // so clear the selection rather than leave a rule the server will reject.
    const handleBasisChange = (next) => {
      onChange(idx, "arrayMatch", {
        keyField: "canonicalName",
        keyValue: "",
        compareField: next?.value || "ulnMultiplier",
        comparator,
      });
      onChange(idx, "value", []);
    };

    const baseArrayMatch = () =>
      condition.arrayMatch || {
        keyField: "canonicalName",
        compareField: isSeverityMode ? "severity" : "ulnMultiplier",
        comparator,
      };

    // Stores a bare string for a single test (and for "*"), an array for a
    // panel — so a one-test condition round-trips exactly as it always has.
    const setKeyValue = (ids) =>
      onChange(idx, "arrayMatch", {
        ...baseArrayMatch(),
        keyValue: ids.length === 1 ? ids[0] : ids,
      });

    const handleTestChange = (selection) => {
      const picked = Array.isArray(selection) ? selection : [];
      // "Any test" is exclusive — it already means every test.
      const wildcard = picked.find((p) => p.value === ANY_LAB_TEST_OPTION.value);
      setKeyValue(wildcard ? [wildcard.value] : picked.map((p) => p.value));
    };

    const handlePanelChange = (p) => setKeyValue(p?.tests ? [...p.tests] : []);

    // Derived hint for numeric mode: "3 × 40 IU/L = 120 IU/L" so the rule
    // author can sanity-check the threshold in real-world units. Only shown
    // for a multiplier basis on a single test — an absolute value is already in
    // real units, and a panel has no single bound to multiply by.
    const hint = (() => {
      if (isSeverityMode || !selectedTest) return null;
      const bound = basis.bound ? selectedTest[basis.bound] : null;
      if (!bound) return null;
      const label = basis.bound.toUpperCase();
      const a = Number(condition.value?.[0]);
      if (BAND_COMPARATORS.has(comparator)) {
        const b = Number(condition.value?.[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
        return `≈ ${(a * bound).toFixed(2)} – ${(b * bound).toFixed(2)} ${selectedTest.unit}`;
      }
      if (!Number.isFinite(a)) return null;
      return `≈ ${(a * bound).toFixed(2)} ${selectedTest.unit}  (${label} = ${bound} ${selectedTest.unit})`;
    })();

    // Placeholder wording follows the basis: "× ULN", "× LLN" or the test's
    // own unit when comparing an absolute value.
    const unitHint = basis.bound
      ? `× ${basis.bound.toUpperCase()}`
      : selectedTest?.unit || "value";

    return (
      <div>
        <Select
          options={MODE_OPTIONS}
          value={selectedMode}
          onChange={handleModeChange}
          isDisabled={isDisabled}
          placeholder="Mode..."
        />
        {!isSeverityMode && (
          <div className="mt-1">
            <Select
              options={COMPARE_BASIS_OPTIONS}
              value={basis}
              onChange={handleBasisChange}
              isDisabled={isDisabled}
              placeholder="Compare against..."
            />
          </div>
        )}
        {panelOpts.length > 0 && (
          <div className="mt-1">
            <Select
              options={panelOpts}
              value={activePanel}
              onChange={handlePanelChange}
              isDisabled={isDisabled}
              isClearable
              placeholder="Or pick a panel..."
            />
          </div>
        )}
        <div className="mt-1">
          <Select
            isMulti
            options={testOpts}
            value={selectedTests}
            onChange={handleTestChange}
            isDisabled={isDisabled || testOpts.length === 0}
            placeholder={
              testOpts.length === 0
                ? "Loading tests..."
                : isSeverityMode
                  ? "Select test(s)..."
                  : `Select test(s) (${unitHint})...`
            }
          />
          {selectedTests.length > 1 && (
            <small className="text-muted">
              Fires when <strong>any</strong> of these breaches the threshold.
            </small>
          )}
        </div>
        {isSeverityMode ? (
          <div className="mt-1">
            <Select
              options={SEVERITY_THRESHOLD_OPTIONS}
              value={selectedSeverity}
              onChange={(s) => onChange(idx, "value", s ? [s.value] : [])}
              isDisabled={isDisabled}
              placeholder="Severity ≥ ..."
            />
          </div>
        ) : BAND_COMPARATORS.has(comparator) ? (
          <Row className="g-1 mt-1">
            <Col xs={6}>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder={`low ${unitHint}`}
                value={condition.value?.[0] ?? ""}
                onChange={(e) =>
                  onChange(idx, "value", [
                    e.target.value,
                    condition.value?.[1] ?? "",
                  ])
                }
                disabled={isDisabled}
              />
            </Col>
            <Col xs={6}>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder={`high ${unitHint}`}
                value={condition.value?.[1] ?? ""}
                onChange={(e) =>
                  onChange(idx, "value", [
                    condition.value?.[0] ?? "",
                    e.target.value,
                  ])
                }
                disabled={isDisabled}
              />
            </Col>
          </Row>
        ) : (
          <div className="mt-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder={`${unitHint} (e.g. 3)`}
              value={condition.value?.[0] ?? ""}
              onChange={(e) => onChange(idx, "value", [e.target.value])}
              disabled={isDisabled}
            />
          </div>
        )}
        {hint && <small className="text-muted d-block mt-1">{hint}</small>}
      </div>
    );
  };

  // FREQUENCY band table — "N documents per period over a day range". Each row
  // mirrors a clinical-policy line (e.g. From 5 · To 30 · 2 · per week). Empty
  // "To day" + the onwards toggle means "from this day until discharge".
  const setBands = (bands) =>
    onChange(idx, "schedule", { ...condition.schedule, bands });

  const renderFrequencyBands = () => {
    const bands = condition.schedule?.bands || [];
    return (
      <Col md={12} className="mt-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <Label className="small text-muted mb-0">
            Frequency bands — N documents per period within a day range
          </Label>
          <Button
            type="button"
            size="sm"
            color="secondary"
            outline
            onClick={() => setBands([...bands, emptyBand()])}
            disabled={isDisabled}
          >
            + Add band
          </Button>
        </div>
        {bands.length === 0 && (
          <small className="text-muted d-block">
            e.g. From 5 · To 30 · 2 · per week.
          </small>
        )}
        {bands.map((band, bi) => {
          const updateBand = (patch) =>
            setBands(bands.map((x, i) => (i === bi ? { ...x, ...patch } : x)));
          return (
            <Row className="g-1 mb-1 align-items-center" key={bi}>
              <Col xs={2}>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="From day"
                  value={band.fromDay ?? ""}
                  onChange={(e) =>
                    updateBand({
                      fromDay: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  disabled={isDisabled}
                />
              </Col>
              <Col xs={2}>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="To day"
                  value={band.onwards ? "" : (band.toDay ?? "")}
                  onChange={(e) =>
                    updateBand({ toDay: e.target.value.replace(/[^\d]/g, "") })
                  }
                  disabled={isDisabled || band.onwards}
                />
              </Col>
              <Col xs={2} className="d-flex align-items-center">
                <div className="form-check mb-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`onwards-${idx}-${bi}`}
                    checked={!!band.onwards}
                    disabled={isDisabled}
                    onChange={(e) =>
                      updateBand(
                        e.target.checked
                          ? { onwards: true, toDay: "" }
                          : { onwards: false },
                      )
                    }
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`onwards-${idx}-${bi}`}
                  >
                    onwards
                  </label>
                </div>
              </Col>
              <Col xs={2}>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Times"
                  value={band.times ?? ""}
                  onChange={(e) =>
                    updateBand({ times: e.target.value.replace(/[^\d]/g, "") })
                  }
                  disabled={isDisabled}
                />
              </Col>
              <Col xs={3}>
                <Select
                  options={PER_OPTIONS}
                  value={band.per || PER_OPTIONS[1]}
                  onChange={(v) => updateBand({ per: v })}
                  isDisabled={isDisabled}
                />
              </Col>
              <Col xs={1}>
                <Button
                  type="button"
                  color="danger"
                  outline
                  size="sm"
                  onClick={() => setBands(bands.filter((_, i) => i !== bi))}
                  disabled={isDisabled}
                >
                  ×
                </Button>
              </Col>
            </Row>
          );
        })}
      </Col>
    );
  };

  // DAYS_BEFORE (Compliance Valid till): the alert firing days, furthest
  // first. Quick picks, or type any whole number 0–365 and press Enter.
  const renderFiringDays = () => {
    const days = Array.isArray(condition.alertDaysBefore)
      ? condition.alertDaysBefore
      : [];
    const valid = (n) =>
      Number.isInteger(n) && n >= 0 && n <= ALERT_DAYS_BEFORE_MAX;
    const setDays = (list) =>
      onChange(
        idx,
        "alertDaysBefore",
        [...new Set(list.map(Number).filter(valid))].sort((a, b) => b - a),
      );
    return (
      <CreatableSelect
        isMulti
        options={ALERT_DAYS_BEFORE_OPTIONS}
        value={days.map((n) => ({
          value: Number(n),
          label: alertDaysBeforeLabel(n),
        }))}
        onChange={(sel) => setDays((sel || []).map((o) => o.value))}
        onCreateOption={(input) => setDays([...days, String(input).trim()])}
        isValidNewOption={(input) => {
          const t = String(input || "").trim();
          return /^\d+$/.test(t) && valid(Number(t));
        }}
        formatCreateLabel={(input) => `Add: ${alertDaysBeforeLabel(input)}`}
        placeholder="Pick or type days (e.g. 30)"
        isDisabled={isDisabled}
      />
    );
  };

  const renderValue = () => {
    if (isDaysBefore) return renderFiringDays();
    if (isFlaggedItems) return renderFlaggedItemsEditor();

    // CONSECUTIVE_LOW: two inputs — threshold (value[0]) and consecutive count.
    if (isConsecutiveLow) {
      return (
        <div>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="Threshold (score below this)"
            value={condition.value?.[0] ?? ""}
            onChange={(e) => onChange(idx, "value", [e.target.value])}
            disabled={isDisabled}
          />
          <div className="mt-1">
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Consecutive count (e.g. 3)"
              value={condition.consecutiveMatch?.count ?? ""}
              onChange={(e) =>
                onChange(idx, "consecutiveMatch", {
                  ...(condition.consecutiveMatch || {}),
                  count: e.target.value.replace(/[^\d]/g, ""),
                })
              }
              disabled={isDisabled}
            />
          </div>
          <small className="text-muted d-block mt-1">
            Alert fires when the last {condition.consecutiveMatch?.count || "N"}{" "}
            assessments all score below {condition.value?.[0] || "threshold"}
          </small>
        </div>
      );
    }

    // CHANGE_OVER_PERIOD: direction + comparator + unit + period length, then
    // one or two positive thresholds. Thresholds are always entered positive —
    // the direction carries the sign server-side.
    if (isChangeOverPeriod) {
      const cm = condition.changeMatch || {};
      const patch = (next) => onChange(idx, "changeMatch", { ...cm, ...next });

      const pick = (options, value, fallbackIdx = 0) =>
        options.find((o) => o.value === value) || options[fallbackIdx];

      const comparator = cm.comparator || "GREATER_THAN_OR_EQUAL";
      const isBetween = comparator === "BETWEEN";

      return (
        <div>
          <Row className="g-1">
            <Col xs={5}>
              <Select
                options={CHANGE_DIRECTION_OPTIONS}
                value={pick(CHANGE_DIRECTION_OPTIONS, cm.direction)}
                onChange={(o) => patch({ direction: o?.value || "EITHER" })}
                isDisabled={isDisabled}
              />
            </Col>
            <Col xs={7}>
              <Select
                options={CHANGE_COMPARATOR_OPTIONS}
                value={pick(CHANGE_COMPARATOR_OPTIONS, comparator)}
                onChange={(o) => {
                  // Clear the operands so a stale high value can't survive a
                  // BETWEEN -> single-operand switch.
                  patch({ comparator: o?.value || "GREATER_THAN_OR_EQUAL" });
                  onChange(idx, "value", []);
                }}
                isDisabled={isDisabled}
              />
            </Col>
          </Row>

          {isBetween ? (
            <Row className="g-1 mt-1">
              <Col xs={6}>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="low"
                  value={condition.value?.[0] ?? ""}
                  onChange={(e) =>
                    onChange(idx, "value", [
                      e.target.value,
                      condition.value?.[1] ?? "",
                    ])
                  }
                  disabled={isDisabled}
                />
              </Col>
              <Col xs={6}>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="high"
                  value={condition.value?.[1] ?? ""}
                  onChange={(e) =>
                    onChange(idx, "value", [
                      condition.value?.[0] ?? "",
                      e.target.value,
                    ])
                  }
                  disabled={isDisabled}
                />
              </Col>
            </Row>
          ) : (
            <div className="mt-1">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Amount (e.g. 5)"
                value={condition.value?.[0] ?? ""}
                onChange={(e) => onChange(idx, "value", [e.target.value])}
                disabled={isDisabled}
              />
            </div>
          )}

          <Row className="g-1 mt-1">
            <Col xs={5}>
              <Select
                options={CHANGE_UNIT_OPTIONS}
                value={pick(CHANGE_UNIT_OPTIONS, cm.unit)}
                onChange={(o) => patch({ unit: o?.value || "ABSOLUTE" })}
                isDisabled={isDisabled}
              />
            </Col>
            <Col xs={3}>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="every"
                value={cm.periodCount ?? ""}
                onChange={(e) =>
                  patch({ periodCount: e.target.value.replace(/[^\d]/g, "") })
                }
                disabled={isDisabled}
              />
            </Col>
            <Col xs={4}>
              <Select
                options={CHANGE_PERIOD_UNIT_OPTIONS}
                value={pick(CHANGE_PERIOD_UNIT_OPTIONS, cm.periodUnit, 2)}
                onChange={(o) => patch({ periodUnit: o?.value || "MONTH" })}
                isDisabled={isDisabled}
              />
            </Col>
          </Row>

          <small className="text-muted d-block mt-1">
            Periods run from the admission date. Each period compares its first
            and last reading and alerts separately.
          </small>
        </div>
      );
    }

    // Relative-date operators (e.g. OLDER_THAN_DAYS) take a plain number of
    // days, not a date. Stored as a single-element array to match the other
    // numeric value editors.
    if (RELATIVE_DAY_OPERATORS.has(condition.operator?.value)) {
      return (
        <Input
          type="number"
          min="1"
          step="1"
          placeholder="days (e.g. 90)"
          value={condition.value?.[0] ?? ""}
          onChange={(e) => onChange(idx, "value", [e.target.value])}
          disabled={isDisabled}
        />
      );
    }
    if (isProvisional) {
      return (
        <Select
          isMulti
          options={icdOptions}
          isLoading={isLoadingIcd}
          value={
            Array.isArray(condition.value)
              ? icdOptions.filter((o) => condition.value.includes(o.value))
              : []
          }
          onChange={(s) =>
            onChange(idx, "value", s ? s.map((x) => x.value) : [])
          }
          isDisabled={isDisabled}
          placeholder="Select diagnoses..."
        />
      );
    }

    if (isBloodGroup) {
      return (
        <Select
          options={BLOOD_GROUP_OPTIONS}
          value={
            BLOOD_GROUP_OPTIONS.find((o) => o.value === condition.value?.[0]) ||
            null
          }
          onChange={(s) => onChange(idx, "value", s ? [s.value] : [])}
          isDisabled={isDisabled}
          placeholder="Select blood group..."
        />
      );
    }

    if (isGender) {
      return (
        <Select
          options={GENDER_OPTIONS}
          value={
            Array.isArray(condition.value) && condition.value.length === 2
              ? { value: "Both", label: "Both" }
              : GENDER_OPTIONS.find((o) => o.value === condition.value?.[0]) ||
                null
          }
          onChange={(s) => {
            if (!s) return onChange(idx, "value", []);
            onChange(
              idx,
              "value",
              s.value === "Both" ? ["Male", "Female"] : [s.value],
            );
          }}
          isDisabled={isDisabled}
          placeholder="Select gender..."
        />
      );
    }

    if (isBoolean) {
      return (
        <Select
          options={BOOLEAN_OPTIONS}
          value={
            BOOLEAN_OPTIONS.find((o) => o.value === condition.value?.[0]) ||
            null
          }
          onChange={(s) => onChange(idx, "value", s ? [s.value] : [])}
          isDisabled={isDisabled}
          placeholder="Select..."
        />
      );
    }

    if (hasEnum) {
      return (
        <Select
          options={fieldEnumOpts}
          value={
            fieldEnumOpts.find((o) => o.value === condition.value?.[0]) || null
          }
          onChange={(s) => onChange(idx, "value", s ? [s.value] : [])}
          isDisabled={isDisabled}
          placeholder="Select..."
        />
      );
    }

    return (
      <Input
        placeholder={fieldType === "Number" ? "e.g. 160" : "Enter value"}
        type={fieldType === "Number" ? "number" : "text"}
        value={
          Array.isArray(condition.value)
            ? (condition.value[0] ?? "")
            : condition.value || ""
        }
        onChange={(e) => onChange(idx, "value", e.target.value)}
        disabled={isDisabled}
      />
    );
  };

  return (
    <>
      <Row className="align-items-end mb-2">
        <Col md={2}>
          <Label className="small text-muted mb-1">Model</Label>
          <Select
            options={TARGET_OPTIONS}
            value={condition.model}
            onChange={handleModelChange}
            isDisabled={isDisabled}
            placeholder="Model..."
          />
        </Col>

        <Col md={2}>
          <Label className="small text-muted mb-1">Field</Label>
          <Select
            options={pickableFieldOptions}
            value={
              fieldOptions.find((f) => f.value === condition.field) || null
            }
            onChange={handleFieldChange}
            isDisabled={isDisabled || !condition.model}
            placeholder={
              condition.model ? "Select field" : "Select model first"
            }
          />
        </Col>

        <Col md={2}>
          <Label className="small text-muted mb-1">Operator</Label>
          <Select
            options={filteredOps}
            value={
              filteredOps.find((o) => o.value === condition.operator?.value) ||
              null
            }
            onChange={(v) => {
              onChange(idx, "operator", v);
              // Seed the trend side-car when switching to CHANGE_OVER_PERIOD,
              // clear it when switching away, so a stale direction can't ride
              // along on an unrelated operator.
              onChange(
                idx,
                "changeMatch",
                v?.value === "CHANGE_OVER_PERIOD"
                  ? {
                      direction: condition.changeMatch?.direction || "EITHER",
                      comparator:
                        condition.changeMatch?.comparator ||
                        "GREATER_THAN_OR_EQUAL",
                      unit: condition.changeMatch?.unit || "ABSOLUTE",
                      periodUnit: condition.changeMatch?.periodUnit || "MONTH",
                      periodCount: condition.changeMatch?.periodCount || 1,
                    }
                  : null,
              );
            }}
            isDisabled={isDisabled || isFieldExists}
          />
        </Col>

        {!disableTrigger && !isCompliance && (
          <Col md={isDelayed ? 1 : 2}>
            <Label className="small text-muted mb-1">Trigger</Label>
            <Select
              options={TRIGGER_OPTIONS}
              value={condition.triggerType}
              onChange={(v) => {
                onChange(idx, "triggerType", v);
                if (v?.value !== "DELAYED") onChange(idx, "deadlineHours", "");
              }}
              isDisabled={isDisabled}
            />
          </Col>
        )}

        {!valueless && !isFieldExists && (
          <Col md={isDaysBefore ? 5 : 3}>
            <Label className="small text-muted mb-1">
              {isDaysBefore ? "Alert firing day(s) — before Valid till" : "Value"}
            </Label>
            {renderValue()}
          </Col>
        )}

        <Col md={1}>
          <Button
            type="button"
            color="danger"
            outline
            size="sm"
            onClick={() => onRemove(idx)}
            disabled={isDisabled || isOnly}
          >
            ×
          </Button>
        </Col>
      </Row>

      {isDaysBefore && (
        <small className="text-muted d-block mb-2">
          Checked every morning at 4:00 AM. Each firing day alerts once per
          licence term (a late upload still gets it); if several are reached at
          once only the nearest fires. "On expiry day" also alerts once for a
          licence that has already expired. Skipped while a renewal is underway.
        </small>
      )}

      {/* DELAYED-only: schedule controls (Period + Days + Interval + Grace).
          Not for licence conditions — the compliance sweep has no cadence. */}
      {isDelayed && !isCompliance && (
        <Row className="align-items-end mb-3 p-2 border rounded bg-light mx-0">
          <Col md={3}>
            <Label className="small text-muted mb-1">Cycle</Label>
            <Select
              options={PERIOD_OPTIONS}
              value={condition.schedule?.period || PERIOD_OPTIONS[0]}
              onChange={(v) =>
                onChange(idx, "schedule", { ...condition.schedule, period: v })
              }
              isDisabled={isDisabled}
            />
          </Col>

          {condition.schedule?.period?.value === "DAYS" && (
            <Col md={4}>
              <Label className="small text-muted mb-1">
                Days (e.g. 1, 3, 7)
              </Label>
              <CreatableSelect
                isMulti
                isClearable
                placeholder="Type a day number and press Enter..."
                options={[]}
                value={(condition.schedule?.days || []).map((d) => ({
                  value: d,
                  label: `Day ${d}`,
                }))}
                onChange={(selected) => {
                  const nums = (selected || [])
                    .map((o) => Number(o.value))
                    .filter((n) => Number.isInteger(n) && n >= 0);
                  onChange(idx, "schedule", {
                    ...condition.schedule,
                    days: [...new Set(nums)].sort((a, b) => a - b),
                  });
                }}
                onCreateOption={(input) => {
                  const n = Number(String(input).trim());
                  if (!Number.isInteger(n) || n < 0) return;
                  const next = [
                    ...new Set([...(condition.schedule?.days || []), n]),
                  ].sort((a, b) => a - b);
                  onChange(idx, "schedule", {
                    ...condition.schedule,
                    days: next,
                  });
                }}
                isValidNewOption={(input) =>
                  /^\d+$/.test(String(input || "").trim())
                }
                formatCreateLabel={(input) => `Add Day ${input}`}
                isDisabled={isDisabled}
              />
              {(condition.schedule?.days || []).length > 0 && (
                <div className="form-check mt-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`daysOnwards-${idx}`}
                    checked={!!condition.schedule?.daysOnwards}
                    disabled={isDisabled}
                    onChange={(e) =>
                      onChange(idx, "schedule", {
                        ...condition.schedule,
                        daysOnwards: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`daysOnwards-${idx}`}
                  >
                    Day {Math.max(...condition.schedule.days)} onwards (then due
                    every day until discharge)
                  </label>
                </div>
              )}
            </Col>
          )}

          {/* Hours field — label & semantics shift with Period:
                DEADLINE   → "Deadline (h)" — one-time check at admission + N
                CONTINUOUS → "Interval (h)" — every N hours
                DAYS       → "Sub-interval (h)" — optional, per-day sub-cadence
              Hidden for FREQUENCY (it uses the band table instead).
          */}
          {!isFrequency && (
            <Col md={2}>
              <Label className="small text-muted mb-1">
                {condition.schedule?.period?.value === "DEADLINE"
                  ? "Deadline (h)"
                  : condition.schedule?.period?.value === "CONTINUOUS"
                    ? "Interval (h)"
                    : "Sub-interval (h)"}
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder={
                  condition.schedule?.period?.value === "DAYS"
                    ? "optional"
                    : "required"
                }
                value={condition.schedule?.intervalHours ?? ""}
                onChange={(e) =>
                  onChange(idx, "schedule", {
                    ...condition.schedule,
                    intervalHours: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                disabled={isDisabled}
              />
            </Col>
          )}

          {!isFrequency && (
            <Col md={2}>
              <Label className="small text-muted mb-1">Grace (h)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={condition.schedule?.graceHours ?? 0}
                onChange={(e) =>
                  onChange(idx, "schedule", {
                    ...condition.schedule,
                    graceHours: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                disabled={isDisabled}
              />
            </Col>
          )}

          {isFrequency && renderFrequencyBands()}
        </Row>
      )}

      {/* DELAYED-only: optional discontinue gate — suppress this "missing
          assessment" reminder once the patient's recent scores are stable
          (monitoring legitimately discontinued). */}
      {isDelayed && !isCompliance && (
        <div className="mb-3 p-2 border rounded bg-light mx-0">
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id={`discoGate-${idx}`}
              checked={!!condition.discontinueGate}
              disabled={isDisabled}
              onChange={(e) =>
                onChange(
                  idx,
                  "discontinueGate",
                  e.target.checked
                    ? { count: "", criteria: [{ field: "", threshold: "" }] }
                    : null,
                )
              }
            />
            <label
              className="form-check-label small fw-bold"
              htmlFor={`discoGate-${idx}`}
            >
              Suppress this reminder when monitoring is discontinued (patient
              stable)
            </label>
          </div>

          {condition.discontinueGate && (
            <>
              <Row className="align-items-end g-2 mb-2 mx-0">
                <Col md={3}>
                  <Label className="small text-muted mb-1">
                    Last N assessments
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 2"
                    value={condition.discontinueGate.count ?? ""}
                    onChange={(e) =>
                      onChange(idx, "discontinueGate", {
                        ...condition.discontinueGate,
                        count: e.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                    disabled={isDisabled}
                  />
                </Col>
              </Row>

              {(condition.discontinueGate.criteria || []).map((cr, cIdx) => (
                <Row className="align-items-end g-2 mb-1 mx-0" key={cIdx}>
                  <Col md={5}>
                    <Label className="small text-muted mb-1">
                      Field (score)
                    </Label>
                    <Select
                      options={fieldOptions}
                      value={
                        fieldOptions.find((f) => f.value === cr.field) || null
                      }
                      onChange={(v) => {
                        const criteria = [
                          ...condition.discontinueGate.criteria,
                        ];
                        criteria[cIdx] = {
                          ...criteria[cIdx],
                          field: v?.value || "",
                        };
                        onChange(idx, "discontinueGate", {
                          ...condition.discontinueGate,
                          criteria,
                        });
                      }}
                      isDisabled={isDisabled || !condition.model}
                      placeholder={
                        condition.model ? "Select field" : "Select model first"
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Label className="small text-muted mb-1">
                      Below (threshold)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 8"
                      value={cr.threshold ?? ""}
                      onChange={(e) => {
                        const criteria = [
                          ...condition.discontinueGate.criteria,
                        ];
                        criteria[cIdx] = {
                          ...criteria[cIdx],
                          threshold: e.target.value,
                        };
                        onChange(idx, "discontinueGate", {
                          ...condition.discontinueGate,
                          criteria,
                        });
                      }}
                      disabled={isDisabled}
                    />
                  </Col>
                  <Col md={3}>
                    <Button
                      type="button"
                      color="danger"
                      outline
                      size="sm"
                      disabled={
                        isDisabled ||
                        (condition.discontinueGate.criteria || []).length <= 1
                      }
                      onClick={() => {
                        const criteria =
                          condition.discontinueGate.criteria.filter(
                            (_, i) => i !== cIdx,
                          );
                        onChange(idx, "discontinueGate", {
                          ...condition.discontinueGate,
                          criteria,
                        });
                      }}
                    >
                      ×
                    </Button>
                  </Col>
                </Row>
              ))}

              <Button
                type="button"
                color="secondary"
                outline
                size="sm"
                className="mt-1"
                disabled={isDisabled}
                onClick={() =>
                  onChange(idx, "discontinueGate", {
                    ...condition.discontinueGate,
                    criteria: [
                      ...(condition.discontinueGate.criteria || []),
                      { field: "", threshold: "" },
                    ],
                  })
                }
              >
                + Add criterion
              </Button>

              <small className="text-muted d-block mt-2">
                Reminder is skipped when the last{" "}
                {condition.discontinueGate.count || "N"} assessments of{" "}
                {condition.model?.label || "this model"} all score below the
                threshold on every criterion (a higher score auto-resumes it).
              </small>
            </>
          )}
        </div>
      )}

      {error && <small className="text-danger d-block mb-2">{error}</small>}
    </>
  );
};

export default ConditionRow;
