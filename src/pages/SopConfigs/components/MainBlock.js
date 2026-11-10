import React from "react";
import { Card, CardBody, CardHeader, Button, Label } from "reactstrap";
import ConditionRow from "./ConditionRow";
import { emptyConditionItem } from "../../../Components/constants/sopConstants";
import CenterDropdown from "../../Report/Components/Doctor/components/CenterDropDown";

const MainBlock = ({
  satisfyingCriteria,
  setSatisfyingCriteria,
  centerOptions = [],
  centersError,
  modelFieldsCache,
  fetchModelFields,
  isSubmitting,
  fieldErrors,
  isComplianceRule = false,
}) => {
  const handleCentersChange = (ids) => {
    setSatisfyingCriteria((prev) => ({ ...prev, centers: ids }));
  };
  const addCondition = () => {
    setSatisfyingCriteria((prev) => ({
      ...prev,
      conditions: [...prev.conditions, emptyConditionItem()],
    }));
  };

  const removeCondition = (idx) => {
    setSatisfyingCriteria((prev) => ({
      ...prev,
      conditions:
        prev.conditions.length === 1
          ? prev.conditions
          : prev.conditions.filter((_, i) => i !== idx),
    }));
  };

  const handleConditionChange = (idx, key, value) => {
    setSatisfyingCriteria((prev) => {
      const next = [...prev.conditions];
      next[idx] = { ...next[idx], [key]: value };
      return { ...prev, conditions: next };
    });
  };

  return (
    <Card className="mb-4 border-primary">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold text-primary">
          2. Satisfying Criteria
          {/* <small className="text-muted fw-normal ms-2">— optional, if empty all patients are counted</small> */}
        </span>
        <Button
          color="primary"
          size="sm"
          outline
          onClick={addCondition}
          disabled={isSubmitting}
        >
          + Add Condition
        </Button>
      </CardHeader>
      <CardBody>
        {/* Center applicability — the rule only fires for patients in these
            centers. Required (select one or many). */}
        <div className="mb-3 pb-3 border-bottom">
          <Label className="fw-semibold d-block mb-1">
            Applicable Centers <span className="text-danger">*</span>
          </Label>
          <small className="text-muted d-block mb-2">
            {isComplianceRule
              ? "This SOP only generates alerts for licences of the selected center(s)."
              : "This SOP only generates alerts for patients in the selected center(s)."}
          </small>
          <CenterDropdown
            options={centerOptions}
            value={satisfyingCriteria.centers || []}
            onChange={handleCentersChange}
            className=""
          />
          {centersError && (
            <div className="text-danger small mt-1">{centersError}</div>
          )}
        </div>

        {satisfyingCriteria.conditions.map((c, cIdx) => (
          <ConditionRow
            key={cIdx}
            condition={c}
            idx={cIdx}
            disableTrigger={true}
            isCriteria
            onChange={handleConditionChange}
            onRemove={removeCondition}
            isDisabled={isSubmitting}
            isOnly={satisfyingCriteria.conditions.length === 1}
            error={fieldErrors?.satisfyingCriteria?.conditions?.[cIdx]}
            modelFieldsCache={modelFieldsCache}
            onModelChange={fetchModelFields}
          />
        ))}
      </CardBody>
    </Card>
  );
};

export default MainBlock;
