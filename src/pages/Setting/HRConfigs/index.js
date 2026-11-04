import React, { useEffect, useState } from "react";
import { Row, Col, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import {
  getDepartments,
  addDepartments,
  addPositions,
  getPositions,
} from "../../../helpers/backend_helper";
import PositionsOverviewCard from "./components/PositionsOverviewCard";
import AddPositionsCard from "./components/AddPositionsCard";
import DepartmentsCard from "./components/DepartmentsCard";
import CompaniesCard from "./components/CompaniesCard";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { useNavigate } from "react-router-dom";

const HrConfigurations = () => {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [addingDept, setAddingDept] = useState(false);
  const navigate = useNavigate();

  const [positionRows, setPositionRows] = useState([
    { department: "", names: "" },
  ]);
  const [addingPositions, setAddingPositions] = useState(false);

  const [positionsData, setPositionsData] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const [deptSearch, setDeptSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const {
    loading: permissionLoader,
    hasPermission,
  } = usePermissions(token);
  const hasUserPermission = hasPermission(
    "SETTING",
    "HRCONFIGURATIONSSETTING",
    "READ",
  );

  const hasRead = hasPermission("SETTING", "HRCONFIGURATIONSSETTING", "READ");
  const hasWrite = hasPermission("SETTING", "HRCONFIGURATIONSSETTING", "WRITE");
  const hasDelete = hasPermission(
    "SETTING",
    "HRCONFIGURATIONSSETTING",
    "DELETE",
  );
  const isReadOnly = hasRead && !hasWrite && !hasDelete;

  const fetchDepartments = async () => {
    try {
      setDeptLoading(true);
      const res = await getDepartments({ version: 2 });
      setDepartments(res?.data || []);
    } catch {
      toast.error("Failed to fetch departments");
    } finally {
      setDeptLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setPositionsLoading(true);
      const res = await getPositions();
      setPositionsData(res?.data || []);
    } catch {
      toast.error("Failed to fetch positions");
    } finally {
      setPositionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchPositions();
  }, []);

  if (permissionLoader) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: 300 }}
      >
        <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
      </div>
    );
  }

  if (!hasUserPermission) {
    navigate("/unauthorized");
    return null;
  }

  const handleAddDepartment = async () => {
    const trimmed = newDeptName.trim();
    if (!trimmed) {
      toast.error("Department name is required");
      return;
    }
    try {
      setAddingDept(true);
      await addDepartments({ names: [trimmed] });
      toast.success(`Department "${trimmed}" added successfully`);
      setNewDeptName("");
      await fetchDepartments();
    } catch (err) {
      toast.error(err?.message || "Failed to add department");
    } finally {
      setAddingDept(false);
    }
  };

  const addPositionRow = () => {
    setPositionRows((prev) => [...prev, { department: "", names: "" }]);
  };

  const removePositionRow = (idx) => {
    setPositionRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePositionRow = (idx, field, value) => {
    setPositionRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddPositions = async () => {
    const valid = positionRows.filter(
      (row) => row.department && row.names.trim(),
    );

    if (!valid.length) {
      toast.error("Please fill at least one department and positions");
      return;
    }

    const payload = valid.map((row) => ({
      department: row.department,
      names: row.names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
    }));

    if (payload.some((p) => !p.names.length)) {
      toast.error("Some rows have no valid position names");
      return;
    }

    try {
      setAddingPositions(true);
      await addPositions(payload);
      toast.success("Positions added successfully");
      setPositionRows([{ department: "", names: "" }]);
      await fetchPositions();
    } catch (err) {
      toast.error(err?.message || "Failed to add positions");
    } finally {
      setAddingPositions(false);
    }
  };

  const flatPositions = positionsData.flatMap((p) =>
    (p.positions || [])
      .filter((pos) => !pos.deleted && pos.version === 2)
      .map((pos) => ({
        _id: pos._id,
        positionName: pos.name,
        department: p.department?.department || "—",
      })),
  );

  const filteredDepartments = departments.filter((d) =>
    d.department.toLowerCase().includes(deptSearch.toLowerCase()),
  );

  const filteredPositions = flatPositions.filter(
    (p) =>
      p.positionName.toLowerCase().includes(positionSearch.toLowerCase()) ||
      p.department.toLowerCase().includes(positionSearch.toLowerCase()),
  );

  return (
    <div className="container-fluid px-3 py-4">
      <div className="mb-4">
        <h4 className="fw-semibold mb-1">HR Configurations</h4>
        <p className="text-muted small mb-0">
          Manage departments and positions for your organization
        </p>
      </div>

      <Row className="g-4">
        <Col md={5}>
          <DepartmentsCard
            departments={departments}
            deptLoading={deptLoading}
            newDeptName={newDeptName}
            setNewDeptName={setNewDeptName}
            addingDept={addingDept}
            handleAddDepartment={handleAddDepartment}
            deptSearch={deptSearch}
            setDeptSearch={setDeptSearch}
            filteredDepartments={filteredDepartments}
            hasWrite={hasWrite}
          />
        </Col>
        <Col md={7}>
          <AddPositionsCard
            departments={departments}
            deptLoading={deptLoading}
            positionRows={positionRows}
            addingPositions={addingPositions}
            addPositionRow={addPositionRow}
            removePositionRow={removePositionRow}
            updatePositionRow={updatePositionRow}
            handleAddPositions={handleAddPositions}
            readOnly={isReadOnly}
          />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <PositionsOverviewCard
            positionsLoading={positionsLoading}
            flatPositions={flatPositions}
            filteredPositions={filteredPositions}
            positionSearch={positionSearch}
            setPositionSearch={setPositionSearch}
            hasWrite={hasWrite}
          />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <CompaniesCard hasWrite={hasWrite} hasDelete={hasDelete} />
        </Col>
      </Row>
    </div>
  );
};

export default HrConfigurations;
