import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Label,
  Input,
  Spinner,
} from "reactstrap";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { toast } from "react-toastify";
import {
  getEmployeeId,
  getEmployeesBySearch,
} from "../../../helpers/backend_helper";
import Select from "react-select";
import { AlertTriangle } from "lucide-react";

const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const isECodeLike = (value) => {
  return /^[A-Za-z]+[A-Za-z0-9]*\d+[A-Za-z0-9]*$/.test(value);
};

const ApproveModal = ({
  isOpen,
  toggle,
  onSubmit,
  mode,           // NEW_JOINING | SALARY_ADVANCE | TECH_ISSUES | HIRING | TPM | INCENTIVES | SALARY
  targetName,     // optional: who/what this request is for, shown as a line in the modal
  actionType,
  setActionType,
  paymentType,
  setPaymentType,
  note,
  setNote,
  eCode,
  setECode,
  usersLinkedToEmployee,
  loading,
  designation,
  remarks,
  setRemarks,
  ecodePrefix,
}) => {
  const [approvedBy, setApprovedBy] = useState("");
  const [eCodeLoader, setECodeLoader] = useState(false);
  const handleAuthError = useAuthError();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [assignedHR, setAssignedHR] = useState(null);

  const generateEmployeeId = async () => {
    setECodeLoader(true);
    try {
      const response = await getEmployeeId({
        ...(ecodePrefix && { prefix: ecodePrefix }),
      });
      setECode(response.payload.value);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to generate employee id");
      }
    } finally {
      setECodeLoader(false);
    }
  };

  useEffect(() => {
    if (
      (mode === "NEW_JOINING" || mode === "TPM") &&
      actionType === "APPROVE"
    ) {
      generateEmployeeId();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, mode, ecodePrefix]);

  useEffect(() => {
    if (
      !isOpen &&
      (mode === "NEW_JOINING" || mode === "TPM") &&
      actionType === "APPROVE"
    ) {
      setECode("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, actionType]);

  const handleSubmit = () => {
    if (mode === "SALARY_ADVANCE" && actionType === "APPROVE" && !paymentType) {
      toast.warn("Please select a payment type.");
      return;
    }
    
    if (mode === "SALARY" && actionType === "UPDATE_REMARKS" && !remarks) {
      toast.warn("Please select a remarks");
      return;
    }

    if (
      mode === "NEW_JOINING_BIOMETRIC" &&
      actionType === "REJECT" &&
      !note.trim()
    ) {
      toast.warn("Reason is mandatory for rejection.");
      return;
    }
    onSubmit({
      note,
      approvedBy: mode === "TECH_ISSUES" ? approvedBy : undefined,
      paymentType: mode === "SALARY_ADVANCE" ? paymentType : undefined,
      remarks: (mode === "SALARY" && actionType === "UPDATE_REMARKS") ? remarks : undefined,
      action: actionType,
      eCode: mode === "NEW_JOINING" ? eCode : undefined,
      hr: assignedHR?.value,
    });


    if (mode === "SALARY_ADVANCE") {
      setPaymentType("");
    }
    if (mode !== "SALARY") {
      setNote("");
      setAssignedHR("");
    }
  };

  const fetchEmployees = async (searchText) => {
    // if (!searchText || searchText.length < 2) {
    //   setEmployees([]);
    //   return;
    // }

    try {
      setLoadingEmployees(true);

      const params = {
        type: "hr",
      };

      if (/^\d+$/.test(searchText) || isECodeLike(searchText)) {
        params.eCode = searchText;
      } else {
        params.name = searchText;
      }

      const response = await getEmployeesBySearch(params);

      const options =
        response?.data?.map((emp) => ({
          value: emp._id,
          label: `${emp.name} (${emp.eCode})`,
        })) || [];

      setEmployees(options);
    } catch (error) {
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (actionType === "APPROVE") {
      fetchEmployees();
    }
  }, [actionType]);

  const debouncedFetchEmployees = useMemo(() => {
    return debounce(fetchEmployees, 400);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      backdrop="static"
      keyboard={false}
    >
      <ModalHeader toggle={toggle}>
        {(mode === "EXIT_EMPLOYEES_EXIT_PENDING" || mode === "EXIT_EMPLOYEES_FNF_PENDING")
          ? "Action Required"
          : actionType === "APPROVE"
            ? "Approve Request"
            : actionType === "REJECT"
              ? "Reject Request"
              : mode === "SALARY"
                ? "Update Remarks"
                : "Action Required"}
      </ModalHeader >

      <ModalBody>
        {targetName && (
          <p className="text-muted mb-3">
            You are{" "}
            {actionType === "APPROVE"
              ? "approving"
              : actionType === "REJECT"
                ? "rejecting"
                : "actioning"}{" "}
            this request for <strong>{targetName}</strong>.
          </p>
        )}
        {(mode === "NEW_JOINING" || mode === "TPM") &&
          actionType === "APPROVE" && (
            <div className="mb-3">
              <Label htmlFor="eCode" className="fw-bold">
                ECode
              </Label>
              <div className="position-relative">
                <Input
                  id="eCode"
                  disabled
                  type="text"
                  value={eCode}
                  style={{ paddingRight: eCodeLoader ? "2.5rem" : undefined }}
                />
                {eCodeLoader && (
                  <Spinner
                    size="sm"
                    color="primary"
                    className="position-absolute"
                    style={{
                      right: "10px",
                      top: "35%",
                    }}
                  />
                )}
              </div>
            </div>
          )}
        {(mode === "LEAVE" || mode === "REGULARIZATION") ? (
          <div className="mb-3">
            <p className="mb-0">
              Are you sure you want to <strong>{actionType === "APPROVE" ? (mode === "REGULARIZATION" ? "regularize" : "approve") : "reject"}</strong> this {mode === "LEAVE" ? "leave" : "regularization"} request?
            </p>
          </div>
        ) : ((mode !== "SALARY") || (mode === "SALARY" && (actionType === "APPROVE" || actionType === "REJECT"))) && (
          <div className="mb-3">
            <Label htmlFor="note" className="fw-bold">
              {mode === "NEW_JOINING_BIOMETRIC" ? (
                <>
                  Reason{" "}
                  {actionType === "REJECT" && (
                    <span className="text-danger">*</span>
                  )}
                </>
              ) : (
                "Note (Optional)"
              )}
            </Label>
            <Input
              id="note"
              type="textarea"
              rows="3"
              value={note}
              placeholder={
                mode === "NEW_JOINING_BIOMETRIC"
                  ? actionType === "REJECT"
                    ? "Enter reason for rejection (required)"
                    : "Enter reason (optional)"
                  : "Write a note..."
              }
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        {actionType === "APPROVE" && mode === "HIRING" && (
          <div className="mb-3">
            <Label htmlFor="note" className="fw-bold">
              HR to be assigned
            </Label>
            <Select
              inputId="centerManager"
              placeholder="Search by name or employee code"
              isClearable
              isLoading={loadingEmployees}
              options={employees}
              onInputChange={(value, { action }) => {
                if (action === "input-change") {
                  setSearchText(value);
                  debouncedFetchEmployees(value);
                }
              }}
              onChange={(option) => setAssignedHR(option)}
              noOptionsMessage={() => {
                if (loadingEmployees) return "Searching employees...";
                if (searchText.length < 2)
                  return "Search with name or Ecode...";
                return "No employee found";
              }}
            />
          </div>
        )}
        {mode === "EXIT_EMPLOYEES_EXIT_PENDING" && (
          <div className="mb-3">
            <Label htmlFor="action" className="fw-bold">
              Action <span className="text-danger">*</span>
            </Label>
            <Select
              id="action"
              options={[
                { label: "Approve", value: "APPROVE" },
                { label: "Reject", value: "REJECT" },
              ]}
              placeholder="Select Action..."
              value={actionType}
              onChange={(option) => setActionType(option)}
              className="mt-2"
            />
          </div>
        )}

        {mode === "EXIT_EMPLOYEES_FNF_PENDING" && (
          <div className="mb-3">
            <Label htmlFor="action" className="fw-bold">
              Action <span className="text-danger">*</span>
            </Label>
            <Select
              id="action"
              options={[
                { label: "FNF Closed", value: "APPROVE" },
                { label: "Reject", value: "REJECT" },
                {
                  label: "Reject and Active Employee",
                  value: "REJECT_AND_ACTIVE_EMPLOYEE",
                },
              ]}
              placeholder="Select Action..."
              value={actionType}
              onChange={(option) => setActionType(option)}
              className="mt-2"
            />
          </div>
        )}

        {mode === "EXIT_EMPLOYEES_IT_PENDING" && actionType === "APPROVE" ? (
          usersLinkedToEmployee?.length > 0 ? (
            <div style={{ marginTop: "10px" }}>
              <p className="text-danger fw-bold">
                User(s) associated with this employee will be suspended:
              </p>

              <ul style={{ paddingLeft: "20px", marginTop: "5px" }}>
                {usersLinkedToEmployee.map((email, idx) => (
                  <li key={idx} className="text-muted">
                    {email}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                background: "#f8f9fa",
                borderRadius: "6px",
                border: "1px solid #e2e3e5",
              }}
            >
              <p className="m-0 text-secondary">
                <i className="bx bx-info-circle me-1"></i>
                No user accounts are linked with this employee.
              </p>
            </div>
          )
        ) : null}

        {mode === "HIRING" && designation && (
          <div className="d-flex align-items-start gap-2 small mt-2 text-body">
            <AlertTriangle size={14} className="text-warning mt-1" />
            <span>
              Approving this request will also {actionType?.toLowerCase()} the
              designation
              <strong> {designation}</strong>.
            </span>
          </div>
        )}

        {mode === "SALARY_ADVANCE" && actionType === "APPROVE" && (
          <div className="mb-3">
            <Label className="fw-bold">Payment Type *</Label>
            <Input
              type="select"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="">Select Payment Type</option>
              <option value="CASH">Cash</option>
              <option value="CENTRAL">Central</option>
            </Input>
          </div>
        )}

        {/* TECH_ISSUES: ApprovedBy */}
        {mode === "TECH_ISSUES" && (
          <div className="mb-3">
            <Label className="fw-bold">Confirmed By (Optional)</Label>
            <Input
              type="text"
              value={approvedBy}
              placeholder="Enter confirmer name..."
              onChange={(e) => setApprovedBy(e.target.value)}
            />
          </div>
        )}

        {/* SALARY - Update Remarks */}
        {mode === "SALARY" && actionType === "UPDATE_REMARKS" && (
          <div className="mb-3">
            <Label className="fw-bold">Remarks *</Label>
            <Input
              type="select"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            >
              <option value="">Select Remarks</option>
              <option value="OK">Ok</option>
              <option value="CASH">Cash</option>
              <option value="HOLD">Hold</option>
            </Input>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" className="text-white" onClick={toggle}>
          Cancel
        </Button>

        {mode === "EXIT_EMPLOYEES_EXIT_PENDING" ||
          mode === "EXIT_EMPLOYEES_FNF_PENDING" ? (
          <Button
            color="warning"
            className="text-white"
            disabled={!actionType || !actionType.value || loading}
            onClick={handleSubmit}
          >
            {loading ? <Spinner size={"sm"} /> : "Confirm"}
          </Button>
        ) : actionType === "APPROVE" ? (
          <Button
            color="success"
            className="text-white"
            disabled={
              ((mode === "NEW_JOINING" || mode === "TPM") && eCodeLoader) ||
              loading
            }
            onClick={handleSubmit}
          >
            {loading && actionType === "APPROVE" ? (
              <Spinner size={"sm"} />
            ) : (
              "Approve"
            )}
          </Button>
        ) : (mode === "SALARY" && actionType === "UPDATE_REMARKS") ? (
          <Button
            color="success"
            className="text-white"
            onClick={handleSubmit}>
            {loading ? <Spinner size={"sm"} /> : "Update"}
          </Button>
        ) : (
          <Button
            color="danger"
            className="text-white"
            onClick={handleSubmit}>
            {loading && actionType === "REJECT" ? <Spinner size={"sm"} /> : "Reject"}
          </Button>
        )}
      </ModalFooter>
    </Modal >
  );
};

export default ApproveModal;
