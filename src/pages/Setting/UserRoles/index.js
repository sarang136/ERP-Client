/**
 * Settings screen for the job roles offered on the user form (User.role —
 * DOCTOR, NURSE, RMO, ...). Not the same as Roles & Permissions, which manages
 * access roles.
 *
 * A role's value is fixed once created (users store it, and code compares
 * against it); only the label can change. Inactive roles drop out of the user
 * form but users already on them keep them. A role can only be deleted when no
 * user has it.
 *
 * Each role also says whether its users record a professional registration
 * (compliance T32): Not needed / Optional / Required, and for which profession.
 * Optional or Required shows the Professional Registration section on the user
 * form; Required refuses to save a user without one for that profession.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
} from "reactstrap";
import { toast } from "react-toastify";

import { usePermissions } from "../../../Components/Hooks/useRoles";
import {
  deleteJobRole,
  editJobRole,
  getJobRoles,
  postJobRole,
} from "../../../helpers/backend_helper";
import {
  PROFESSION_LABELS,
  PROFESSION_OPTIONS,
  REGISTRATION_REQUIREMENT,
  REGISTRATION_REQUIREMENT_OPTIONS,
} from "../../../Components/constants/professionalRegistration";

const { NOT_NEEDED, REQUIRED } = REGISTRATION_REQUIREMENT;
const requirementLabel = (value) =>
  REGISTRATION_REQUIREMENT_OPTIONS.find((o) => o.value === value)?.label;

// Same rule as the server (roleValueFromName): shown as a preview only.
const roleValue = (name) =>
  String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const UserRoles = () => {
  const navigate = useNavigate();

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { loading: permissionLoader, hasPermission } = usePermissions(token);

  const canRead = hasPermission("SETTING", "USERROLESSETTING", "READ");
  const canWrite = hasPermission("SETTING", "USERROLESSETTING", "WRITE");
  const canDelete = hasPermission("SETTING", "USERROLESSETTING", "DELETE");

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // { role: null } = add, { role } = edit
  const [form, setForm] = useState(null);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState(NOT_NEEDED);
  const [profession, setProfession] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getJobRoles();
      setRoles(res?.payload || []);
    } catch (err) {
      toast.error(err?.message || "Could not load user roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (role = null) => {
    setForm({ role });
    setName(role?.name || "");
    setRegistration(role?.registration || NOT_NEEDED);
    setProfession(role?.profession || "");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      registration,
      profession: registration === NOT_NEEDED ? null : profession,
    };
    try {
      if (form.role) {
        await editJobRole(form.role._id, data);
        toast.success("Role updated");
      } else {
        await postJobRole(data);
        toast.success("Role added");
      }
      setForm(null);
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not save the role");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (role) => {
    setBusyId(role._id);
    try {
      await editJobRole(role._id, { isActive: !role.isActive });
      setRoles((list) =>
        list.map((r) =>
          r._id === role._id ? { ...r, isActive: !role.isActive } : r,
        ),
      );
    } catch (err) {
      toast.error(err?.message || "Could not update the role");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    const role = toDelete;
    setBusyId(role._id);
    try {
      await deleteJobRole(role._id);
      toast.success("Role deleted");
      setToDelete(null);
      setRoles((list) => list.filter((r) => r._id !== role._id));
    } catch (err) {
      toast.error(err?.message || "Could not delete the role");
    } finally {
      setBusyId(null);
    }
  };

  if (permissionLoader || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center w-100 py-5">
        <Spinner color="primary" />
      </div>
    );
  }

  if (!canRead) {
    navigate("/unauthorized");
    return null;
  }

  const term = search.trim().toLowerCase();
  const shown = roles.filter(
    (r) =>
      !term ||
      r.name.toLowerCase().includes(term) ||
      r.value.toLowerCase().includes(term),
  );
  const newValue = roleValue(name);
  const duplicate =
    !form?.role && newValue && roles.some((r) => r.value === newValue);
  const needsProfession = registration !== NOT_NEEDED && !profession;

  return (
    <Container fluid className="p-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">User Roles</h4>
          <p className="text-muted mb-0">
            The roles offered in the Role dropdown when adding or editing a
            user. Inactive roles are hidden from that dropdown; users who
            already have them keep them.
          </p>
        </div>
        {canWrite && (
          <Button color="success" className="text-white" onClick={() => openForm()}>
            <i className="ri-add-fill me-1 align-bottom"></i> Add Role
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          <Input
            className="mb-3"
            style={{ maxWidth: 320 }}
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="table-responsive">
            <Table className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Professional registration</th>
                  <th className="text-center">Users</th>
                  <th className="text-center">Active</th>
                  {(canWrite || canDelete) && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((role) => (
                  <tr key={role._id}>
                    <td>
                      {role.name}
                      {!role.isActive && (
                        <Badge color="light" className="text-muted ms-2">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td>
                      <code>{role.value}</code>
                    </td>
                    <td>
                      {role.registration && role.registration !== NOT_NEEDED ? (
                        <span
                          className={`badge ${
                            role.registration === REQUIRED
                              ? "bg-soft-danger text-danger"
                              : "bg-soft-info text-info"
                          }`}
                        >
                          {requirementLabel(role.registration)} ·{" "}
                          {PROFESSION_LABELS[role.profession] || role.profession}
                        </span>
                      ) : (
                        <span className="text-muted">Not needed</span>
                      )}
                    </td>
                    <td className="text-center">{role.userCount}</td>
                    <td className="text-center">
                      <div className="form-check form-switch d-inline-block mb-0">
                        <Input
                          type="switch"
                          role="switch"
                          className="form-check-input"
                          checked={role.isActive}
                          disabled={!canWrite || busyId === role._id}
                          onChange={() => toggleActive(role)}
                        />
                      </div>
                    </td>
                    {(canWrite || canDelete) && (
                      <td className="text-end text-nowrap">
                        {canWrite && (
                          <Button
                            size="sm"
                            color="light"
                            className="me-2"
                            onClick={() => openForm(role)}
                          >
                            <i className="ri-pencil-line align-bottom"></i> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            color="danger"
                            outline
                            disabled={role.userCount > 0 || busyId === role._id}
                            title={
                              role.userCount > 0
                                ? "Users have this role — make it inactive instead"
                                : "Delete role"
                            }
                            onClick={() => setToDelete(role)}
                          >
                            <i className="ri-delete-bin-line align-bottom"></i>
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {roles.length ? "No roles match your search" : "No roles yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={!!form} toggle={() => setForm(null)} centered>
        <Form onSubmit={save}>
          <ModalHeader toggle={() => setForm(null)}>
            {form?.role ? "Edit Role" : "Add Role"}
          </ModalHeader>
          <ModalBody>
            <Label htmlFor="user-role-name">
              Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="user-role-name"
              placeholder="e.g. Pharmacist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={!!duplicate}
              autoFocus
            />
            {duplicate && <FormFeedback>This role already exists</FormFeedback>}
            <div className="form-text">
              {form?.role ? (
                <>
                  Saved on users as <code>{form.role.value}</code> — that does
                  not change.
                </>
              ) : (
                <>
                  Will be saved on users as{" "}
                  <code>{newValue || "—"}</code>. This can't be changed later.
                </>
              )}
            </div>

            <Label htmlFor="user-role-registration" className="mt-3">
              Professional registration
            </Label>
            <Input
              id="user-role-registration"
              type="select"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            >
              {REGISTRATION_REQUIREMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Input>
            <div className="form-text">
              {registration === NOT_NEEDED
                ? "No registration section on the user form."
                : registration === REQUIRED
                  ? "A user on this role can't be saved without a registration for this profession."
                  : "The user form shows the registration section; filling it is optional."}
            </div>

            {registration !== NOT_NEEDED && (
              <>
                <Label htmlFor="user-role-profession" className="mt-3">
                  Profession <span className="text-danger">*</span>
                </Label>
                <Input
                  id="user-role-profession"
                  type="select"
                  value={profession}
                  invalid={needsProfession}
                  onChange={(e) => setProfession(e.target.value)}
                >
                  <option value="">Select profession</option>
                  {PROFESSION_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Input>
                <FormFeedback>Select the profession</FormFeedback>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={saving || !newValue || duplicate || needsProfession}
            >
              {saving ? <Spinner size="sm" /> : "Save"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={!!toDelete} toggle={() => setToDelete(null)} centered>
        <ModalHeader toggle={() => setToDelete(null)}>Delete Role</ModalHeader>
        <ModalBody>
          Delete <strong>{toDelete?.name}</strong>? No user has this role.
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button color="danger" onClick={remove} disabled={busyId === toDelete?._id}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default UserRoles;
