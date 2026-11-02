import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Label,
  Spinner,
  Badge,
  Table,
} from "reactstrap";
import { toast } from "react-toastify";
import DeleteModal from "../../../../Components/Common/DeleteModal";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../../../helpers/backend_helper";

const CompaniesCard = ({ hasWrite, hasDelete }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newEcodePrefix, setNewEcodePrefix] = useState("");
  const [newTPMEcodePrefix, setNewTPMEcodePrefix] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingEcodePrefix, setEditingEcodePrefix] = useState("");
  const [editingTPMEcodePrefix, setEditingTPMEcodePrefix] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    company: null,
  });

  const closeConfirmModal = () =>
    setConfirmModal({ isOpen: false, type: null, company: null });

  const hasActions = hasWrite || hasDelete;

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await getCompanies({ includeInactive: true });
      setCompanies(res?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async () => {
    const trimmed = newCompanyName.trim();
    const ecodePrefix = newEcodePrefix.trim();
    const TPMEcodePrefix = newTPMEcodePrefix.trim();
    if (!trimmed) {
      toast.error("Company name is required");
      return;
    }
    if (!ecodePrefix || !TPMEcodePrefix) {
      toast.error("Ecode prefix and TPM ecode prefix are required");
      return;
    }
    try {
      setAdding(true);
      await createCompany({
        name: trimmed,
        ecodePrefix,
        TPMEcodePrefix,
      });
      toast.success(`Company "${trimmed}" added successfully`);
      setNewCompanyName("");
      setNewEcodePrefix("");
      setNewTPMEcodePrefix("");
      await fetchCompanies();
    } catch (err) {
      toast.error(err?.message || "Failed to add company");
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteCompany = (company) =>
    setConfirmModal({ isOpen: true, type: "delete", company });

  const confirmToggleActive = (company) =>
    setConfirmModal({ isOpen: true, type: "toggle", company });

  const handleDeleteCompany = async () => {
    const company = confirmModal.company;
    if (!company) return;
    try {
      setDeletingId(company._id);
      await deleteCompany(company._id);
      toast.success(`Company "${company.name}" deleted successfully`);
      closeConfirmModal();
      await fetchCompanies();
    } catch (err) {
      toast.error(err?.message || "Failed to delete company");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async () => {
    const company = confirmModal.company;
    if (!company) return;
    try {
      setTogglingId(company._id);
      await updateCompany(company._id, { active: !company.active });
      toast.success(
        `Company "${company.name}" marked ${
          company.active ? "Inactive" : "Active"
        }`,
      );
      closeConfirmModal();
      await fetchCompanies();
    } catch (err) {
      toast.error(err?.message || "Failed to update company status");
    } finally {
      setTogglingId(null);
    }
  };

  const startEdit = (company) => {
    setEditingId(company._id);
    setEditingName(company.name);
    setEditingEcodePrefix(company.ecodePrefix || "");
    setEditingTPMEcodePrefix(company.TPMEcodePrefix || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingEcodePrefix("");
    setEditingTPMEcodePrefix("");
  };

  const saveEdit = async (company) => {
    const trimmedName = editingName.trim();
    const trimmedEcodePrefix = editingEcodePrefix.trim();
    const trimmedTPMEcodePrefix = editingTPMEcodePrefix.trim();
    if (!trimmedName) {
      toast.error("Company name is required");
      return;
    }
    if (!trimmedEcodePrefix || !trimmedTPMEcodePrefix) {
      toast.error("Ecode prefix and TPM ecode prefix are required");
      return;
    }

    const changes = {};
    if (trimmedName !== company.name) changes.name = trimmedName;
    if (trimmedEcodePrefix !== company.ecodePrefix)
      changes.ecodePrefix = trimmedEcodePrefix;
    if (trimmedTPMEcodePrefix !== company.TPMEcodePrefix)
      changes.TPMEcodePrefix = trimmedTPMEcodePrefix;

    if (Object.keys(changes).length === 0) {
      cancelEdit();
      return;
    }

    try {
      setSavingEdit(true);
      await updateCompany(company._id, changes);
      toast.success("Company updated successfully");
      cancelEdit();
      await fetchCompanies();
    } catch (err) {
      toast.error(err?.message || "Failed to update company");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-white border-bottom py-3 px-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 32,
              height: 32,
              background: "#e8f4ff",
              color: "#0a66c2",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <i className="ri-building-2-line" />
          </div>
          <div>
            <h6 className="mb-0 fw-semibold">Companies</h6>
            <p className="text-muted mb-0" style={{ fontSize: 12 }}>
              Manage companies employees can be assigned to
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="px-4 py-3">
        <div className="mb-4">
          <Label className="fw-medium small mb-1">Company Name</Label>
          <div className="d-flex gap-2 flex-wrap">
            <Input
              placeholder="e.g. Acme Pvt Ltd"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCompany();
              }}
              disabled={adding}
              style={{ flex: "2 1 220px" }}
            />
            <Input
              placeholder="Ecode Prefix (e.g. JRC)"
              value={newEcodePrefix}
              onChange={(e) => setNewEcodePrefix(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCompany();
              }}
              disabled={adding}
              style={{ flex: "1 1 160px" }}
            />
            <Input
              placeholder="TPM Ecode Prefix (e.g. TC)"
              value={newTPMEcodePrefix}
              onChange={(e) => setNewTPMEcodePrefix(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCompany();
              }}
              disabled={adding}
              style={{ flex: "1 1 160px" }}
            />
            {hasWrite && (
              <Button
                color="primary"
                className="text-white px-3"
                style={{ whiteSpace: "nowrap" }}
                onClick={handleAddCompany}
                disabled={
                  adding ||
                  !newCompanyName.trim() ||
                  !newEcodePrefix.trim() ||
                  !newTPMEcodePrefix.trim()
                }
              >
                {adding ? <Spinner size="sm" /> : "Add"}
              </Button>
            )}
          </div>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: 11 }}>
            Ecode Prefix is used for regular employees (e.g. JRC001), TPM
            Ecode Prefix for vendor/temporary employees (e.g. TC001)
          </p>
        </div>

        <div>
          <Label className="fw-medium small mb-2 d-flex align-items-center gap-2">
            Existing Companies
            {!loading && (
              <Badge color="secondary" pill>
                {companies.length}
              </Badge>
            )}
          </Label>

          {loading ? (
            <div className="d-flex align-items-center gap-2 py-3">
              <Spinner size="sm" color="primary" />
              <span className="text-muted small">Loading companies...</span>
            </div>
          ) : companies.length === 0 ? (
            <div
              className="text-center py-4 rounded"
              style={{ background: "#f8f9fa" }}
            >
              <i
                className="ri-building-2-line text-muted"
                style={{ fontSize: 28 }}
              />
              <p className="text-muted small mb-0 mt-2">No companies yet</p>
            </div>
          ) : (
            <>
              <div className="mb-2 position-relative" style={{ maxWidth: 320 }}>
                <i
                  className="ri-search-line position-absolute text-muted"
                  style={{
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14,
                    pointerEvents: "none",
                  }}
                />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 32, fontSize: 13 }}
                />
              </div>
              <div
                className="border rounded"
                style={{ maxHeight: 320, overflowY: "auto" }}
              >
                <Table size="sm" className="mb-0">
                  <thead
                    style={{
                      background: "#f8f9fa",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    <tr>
                      <th className="px-3 py-2 small fw-semibold text-muted border-0">
                        #
                      </th>
                      <th className="px-3 py-2 small fw-semibold text-muted border-0">
                        Company
                      </th>
                      <th className="px-3 py-2 small fw-semibold text-muted border-0">
                        Ecode Prefix
                      </th>
                      <th className="px-3 py-2 small fw-semibold text-muted border-0">
                        TPM Ecode Prefix
                      </th>
                      <th className="px-3 py-2 small fw-semibold text-muted border-0">
                        Status
                      </th>
                      {hasActions && (
                        <th className="px-3 py-2 small fw-semibold text-muted border-0 text-end">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={hasActions ? 6 : 5}
                          className="px-3 py-3 text-center text-muted small"
                        >
                          No companies match "{search}"
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company, idx) => {
                        const isEditing = editingId === company._id;
                        return (
                          <tr key={company._id}>
                            <td className="px-3 py-2 small text-muted">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 small fw-medium">
                              {isEditing ? (
                                <Input
                                  bsSize="sm"
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(company);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  disabled={savingEdit}
                                />
                              ) : (
                                company.name
                              )}
                            </td>
                            <td className="px-3 py-2 small text-muted">
                              {isEditing ? (
                                <Input
                                  bsSize="sm"
                                  value={editingEcodePrefix}
                                  onChange={(e) =>
                                    setEditingEcodePrefix(
                                      e.target.value.toUpperCase(),
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(company);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  disabled={savingEdit}
                                  style={{ minWidth: 100 }}
                                />
                              ) : (
                                company.ecodePrefix
                              )}
                            </td>
                            <td className="px-3 py-2 small text-muted">
                              {isEditing ? (
                                <Input
                                  bsSize="sm"
                                  value={editingTPMEcodePrefix}
                                  onChange={(e) =>
                                    setEditingTPMEcodePrefix(
                                      e.target.value.toUpperCase(),
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(company);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  disabled={savingEdit}
                                  style={{ minWidth: 100 }}
                                />
                              ) : (
                                company.TPMEcodePrefix
                              )}
                            </td>
                            <td className="px-3 py-2 small">
                              <Badge
                                color={company.active ? "success" : "secondary"}
                                pill
                              >
                                {company.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            {hasActions && (
                              <td className="px-3 py-2 small text-end">
                                <div className="d-flex justify-content-end align-items-center gap-2">
                                  {hasWrite && isEditing ? (
                                    <>
                                      <Button
                                        color="link"
                                        className="text-success p-0"
                                        style={{ fontSize: 12 }}
                                        disabled={savingEdit}
                                        onClick={() => saveEdit(company)}
                                      >
                                        {savingEdit ? (
                                          <Spinner size="sm" />
                                        ) : (
                                          "Save"
                                        )}
                                      </Button>
                                      <Button
                                        color="link"
                                        className="text-muted p-0"
                                        style={{ fontSize: 12 }}
                                        disabled={savingEdit}
                                        onClick={cancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    hasWrite && (
                                      <>
                                        <Button
                                          color="link"
                                          className="text-primary p-0"
                                          title="Edit"
                                          onClick={() => startEdit(company)}
                                        >
                                          <i className="ri-pencil-line" style={{ fontSize: 15 }} />
                                        </Button>
                                        <Button
                                          color="link"
                                          className={
                                            company.active
                                              ? "text-warning p-0"
                                              : "text-success p-0"
                                          }
                                          style={{ fontSize: 12, whiteSpace: "nowrap" }}
                                          disabled={togglingId === company._id}
                                          onClick={() => confirmToggleActive(company)}
                                        >
                                          {togglingId === company._id ? (
                                            <Spinner size="sm" />
                                          ) : company.active ? (
                                            "Deactivate"
                                          ) : (
                                            "Activate"
                                          )}
                                        </Button>
                                      </>
                                    )
                                  )}
                                  {hasDelete && !isEditing && (
                                    <Button
                                      color="link"
                                      className="text-danger p-0"
                                      style={{ fontSize: 12 }}
                                      disabled={deletingId === company._id}
                                      onClick={() => confirmDeleteCompany(company)}
                                    >
                                      {deletingId === company._id ? (
                                        <Spinner size="sm" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </div>
      </CardBody>

      <DeleteModal
        show={confirmModal.isOpen}
        onCloseClick={closeConfirmModal}
        onDeleteClick={
          confirmModal.type === "delete" ? handleDeleteCompany : handleToggleActive
        }
        messsage={
          confirmModal.type === "delete"
            ? `Are you sure you want to delete "${confirmModal.company?.name}"?`
            : `Are you sure you want to mark "${confirmModal.company?.name}" as ${
                confirmModal.company?.active ? "Inactive" : "Active"
              }?`
        }
        buttonMessage={
          confirmModal.type === "delete" ? "Yes, Delete It!" : "Yes, Change It!"
        }
      />
    </Card>
  );
};

export default CompaniesCard;
