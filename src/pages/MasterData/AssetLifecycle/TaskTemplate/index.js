import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  getTaskTemplateCategories,
  createTaskTemplateCategory,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { errText, moneyOrDash, useBusy } from "../shared/assetUi";
import useConfirm from "../shared/useConfirm";
import "../../UnitOfMeasurement/uom.scss";

const INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "dropdown", label: "Dropdown" },
  { value: "image", label: "Image Capture" },
  { value: "video", label: "Video Capture" },
  { value: "scanner", label: "Scanner" },
];

const emptyItem = () => ({
  label: "",
  description: "",
  inputType: "text",
  required: false,
  placeholder: "",
  maxLength: "",
  optionsText: "",
});
const emptySection = () => ({ sectionName: "", items: [emptyItem()] });

const durationText = (m) => {
  const mins = Number(m) || 0;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TaskTemplate = () => {
  const handleAuthError = useAuthError();
  const [confirm, confirmDialog] = useConfirm();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "TASK_TEMPLATE", "WRITE");
  const canDelete = hasPermission("MASTERDATA", "TASK_TEMPLATE", "DELETE");

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [busy, runBusy] = useBusy();
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [sections, setSections] = useState([emptySection()]);
  const [submitting, setSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const fetchCategories = () => {
    getTaskTemplateCategories()
      .then((res) => setCategories(res?.data || []))
      .catch((error) => {
        if (!handleAuthError(error)) {
          toast.error(errText(error, "Couldn't load categories."));
        }
      });
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTaskTemplates({ search: debouncedSearch })
      .then((res) => {
        if (!cancelled) setTemplates(res?.data || []);
      })
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) {
          toast.error(errText(error, "Couldn't load task templates."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, refreshFlag]);

  const openModal = () => {
    setTemplateName("");
    setCategoryId("");
    setActive(true);
    setDescription("");
    setDurationHours(0);
    setDurationMinutes(30);
    setEstimatedCost(0);
    setSections([emptySection()]);
    setModalOpen(true);
  };

  const updateSection = (sIdx, field, value) => {
    setSections((prev) =>
      prev.map((s, i) => (i === sIdx ? { ...s, [field]: value } : s)),
    );
  };
  const addSection = () => setSections((prev) => [...prev, emptySection()]);
  const removeSection = (sIdx) =>
    setSections((prev) => prev.filter((_, i) => i !== sIdx));

  const updateItem = (sIdx, iIdx, field, value) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sIdx
          ? s
          : {
              ...s,
              items: s.items.map((it, j) =>
                j === iIdx ? { ...it, [field]: value } : it,
              ),
            },
      ),
    );
  };
  const addItem = (sIdx) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sIdx ? s : { ...s, items: [...s.items, emptyItem()] },
      ),
    );
  };
  const removeItem = (sIdx, iIdx) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sIdx ? s : { ...s, items: s.items.filter((_, j) => j !== iIdx) },
      ),
    );
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setNewCategoryName("");
    setNewCategoryDesc("");
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return toast.error("Enter a category name");
    setSavingCategory(true);
    try {
      const res = await createTaskTemplateCategory({
        name: newCategoryName,
        description: newCategoryDesc,
      });
      toast.success("Category added successfully");
      fetchCategories();
      if (res?.data?._id) setCategoryId(res.data._id);
      setCategoryModalOpen(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(errText(error, "Couldn't add category."));
      }
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSubmit = async () => {
    if (!templateName.trim() || !categoryId) {
      return toast.error("Fill in Template Name and Category");
    }
    const invalidSection = sections.find((s) => !s.sectionName.trim());
    if (invalidSection) return toast.error("Every section needs a name");
    const invalidItem = sections.find((s) =>
      s.items.some((it) => !it.label.trim()),
    );
    if (invalidItem) return toast.error("Every checklist item needs a label");
    const parseOptions = (it) =>
      it.inputType === "dropdown"
        ? it.optionsText
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
    const noOptions = sections.some((s) =>
      s.items.some((it) => it.inputType === "dropdown" && !parseOptions(it).length),
    );
    if (noOptions) {
      return toast.error("Dropdown items need at least one option");
    }

    setSubmitting(true);
    try {
      await createTaskTemplate({
        templateName,
        categoryId,
        active,
        description,
        estimatedDurationMinutes:
          Number(durationHours) * 60 + Number(durationMinutes),
        estimatedCost: Number(estimatedCost),
        sections: sections.map((s) => ({
          ...s,
          items: s.items.map(({ optionsText, ...it }) => ({
            ...it,
            maxLength: it.maxLength !== "" ? Number(it.maxLength) : undefined,
            options: it.inputType === "dropdown" ? parseOptions({ ...it, optionsText }) : undefined,
          })),
        })),
      });
      toast.success("Task template created successfully");
      setModalOpen(false);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(errText(error, "Something went wrong"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete task template",
      message: "Delete this task template? This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return undefined;
    return runBusy(async () => {
      try {
        await deleteTaskTemplate(id);
        toast.success("Task template deleted successfully");
        setRefreshFlag((f) => f + 1);
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(errText(error, "Couldn't delete."));
        }
      }
    });
  };

  const handleToggleActive = (template) =>
    runBusy(async () => {
      try {
        const res = await updateTaskTemplate(template._id, {
          active: !template.active,
        });
        toast.success("Task template updated");
        setDetailModal({
          ...template,
          ...(res?.data || {}),
          categoryId: template.categoryId,
          active: res?.data?.active ?? !template.active,
        });
        setRefreshFlag((f) => f + 1);
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(errText(error, "Couldn't update."));
        }
      }
    });

  const columns = [
    {
      name: "Template Name",
      selector: (row) => row.templateName,
      sortable: true,
    },
    {
      name: "Category",
      cell: (row) => (
        <span className="uom-cell-muted">{row.categoryId?.name || "—"}</span>
      ),
    },
    {
      name: "Sections",
      width: "90px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.sections?.length || 0}</span>
      ),
    },
    {
      name: "Est. Duration",
      width: "120px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {durationText(row.estimatedDurationMinutes)}
        </span>
      ),
    },
    {
      name: "Status",
      width: "100px",
      cell: (row) => (
        <span
          className={`uom-status-pill ${row.active ? "status-active" : "status-inactive"}`}
        >
          <span className="dot"></span> {row.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "150px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setDetailModal(row)}>
            View
          </Button>
          {canDelete && (
            <Button
              size="sm"
              color="light"
              disabled={busy}
              onClick={() => handleDelete(row._id)}
            >
              <i className="bx bx-trash text-danger"></i>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Task Templates</h4>
          <p>Manage reusable maintenance checklists for work orders</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> Create Template
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={templates}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No task templates yet</div>
          }
        />
      </div>

      {confirmDialog}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-1">Create Task Template</h5>
          <p className="text-muted small mb-3">
            Build a reusable maintenance checklist
          </p>

          <h6 className="fw-semibold mb-3">Basic Information</h6>
          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Template Name <span className="text-danger">*</span>
              </Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Category <span className="text-danger">*</span>
              </Label>
              <div className="d-flex gap-2" style={{ width: "100%" }}>
                <div style={{ flex: "1 1 0%", minWidth: 0, maxWidth: "100%" }}>
                  <Input
                    type="select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">Select or search category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Input>
                </div>
                <Button
                  color="light"
                  type="button"
                  style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
                  onClick={() => setCategoryModalOpen(true)}
                >
                  <i className="bx bx-plus"></i> Add
                </Button>
              </div>
            </Col>
          </Row>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              id="templateActiveSwitch"
            />
            <label className="form-check-label" htmlFor="templateActiveSwitch">
              Active
            </label>
          </div>

          <Label>Description</Label>
          <Input
            type="textarea"
            rows={2}
            className="mb-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Row>
            <Col md={6} className="mb-4">
              <Label>Estimated Duration</Label>
              <Row>
                <Col xs={6}>
                  <Input
                    type="number"
                    min={0}
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="h"
                  />
                </Col>
                <Col xs={6}>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="m"
                  />
                </Col>
              </Row>
            </Col>
            <Col md={6} className="mb-4">
              <Label>Estimated Cost (INR ₹)</Label>
              <Input
                type="number"
                min={0}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </Col>
          </Row>

          <h6 className="fw-semibold mb-3">Checklist Sections</h6>
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="uom-table-card p-3 mb-3">
              <div className="d-flex gap-2 mb-3 align-items-end">
                <div style={{ flex: 1 }}>
                  <Label className="small">
                    Section Name <span className="text-danger">*</span>
                  </Label>{" "}
                  <Input
                    value={section.sectionName}
                    onChange={(e) =>
                      updateSection(sIdx, "sectionName", e.target.value)
                    }
                    placeholder="e.g. Electrical Checks"
                  />
                </div>
                <Button
                  color="light"
                  disabled={sections.length === 1}
                  onClick={() => removeSection(sIdx)}
                >
                  <i className="bx bx-trash text-danger"></i>
                </Button>
              </div>

              {section.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="p-2 mb-2"
                  style={{ background: "#fafbfc", borderRadius: 8 }}
                >
                  <Row>
                    <Col md={3} className="mb-2">
                      <Label className="small">
                        Item Label <span className="text-danger">*</span>
                      </Label>
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "label", e.target.value)
                        }
                      />
                    </Col>
                    <Col md={3} className="mb-2">
                      <Label className="small">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "description", e.target.value)
                        }
                      />
                    </Col>
                    <Col md={2} className="mb-2">
                      <Label className="small">Input Type</Label>
                      <Input
                        type="select"
                        value={item.inputType}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "inputType", e.target.value)
                        }
                      >
                        {INPUT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={2} className="mb-2">
                      <Label className="small">Placeholder</Label>
                      <Input
                        value={item.placeholder}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "placeholder", e.target.value)
                        }
                      />
                    </Col>
                    <Col md={2} className="mb-2">
                      <Label className="small">Max Length</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.maxLength}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "maxLength", e.target.value)
                        }
                      />
                    </Col>
                    {item.inputType === "dropdown" && (
                      <Col md={12} className="mb-2">
                        <Label className="small">
                          Options (comma separated){" "}
                          <span className="text-danger">*</span>
                        </Label>
                        <Input
                          value={item.optionsText}
                          placeholder="e.g. OK, Needs repair, Replace"
                          onChange={(e) =>
                            updateItem(sIdx, iIdx, "optionsText", e.target.value)
                          }
                        />
                      </Col>
                    )}
                  </Row>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.required}
                        onChange={(e) =>
                          updateItem(sIdx, iIdx, "required", e.target.checked)
                        }
                        id={`req-${sIdx}-${iIdx}`}
                      />
                      <label
                        className="form-check-label small"
                        htmlFor={`req-${sIdx}-${iIdx}`}
                      >
                        Required
                      </label>
                    </div>
                    <Button
                      size="sm"
                      color="light"
                      disabled={section.items.length === 1}
                      onClick={() => removeItem(sIdx, iIdx)}
                    >
                      <i className="bx bx-x text-danger"></i> Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button color="light" size="sm" onClick={() => addItem(sIdx)}>
                <i className="bx bx-plus me-1"></i> Add Item to Section
              </Button>
            </div>
          ))}

          <div className="mb-4">
            <Button color="light" size="sm" onClick={addSection}>
              <i className="bx bx-plus me-1"></i> Add Section
            </Button>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              color="light"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create Template"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={categoryModalOpen}
        toggle={closeCategoryModal}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Add New Category</h5>
          <Label>
            Category Name <span className="text-danger">*</span>
          </Label>
          <Input
            className="mb-3"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Label>Description (Optional)</Label>
          <Input
            type="textarea"
            rows={2}
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              color="light"
              onClick={closeCategoryModal}
              disabled={savingCategory}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSaveCategory}
              disabled={savingCategory}
            >
              {savingCategory ? "Saving..." : "Add Category"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={!!detailModal}
        toggle={() => setDetailModal(null)}
        centered
        size="md"
      >
        <ModalBody className="p-0">
          {detailModal && (
            <>
              {/* Header strip */}
              <div
                className="p-4 pb-3"
                style={{ borderBottom: "1px solid #f1f3f5" }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{detailModal.templateName}</h5>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span
                        className="text-muted"
                        style={{
                          fontSize: 13,
                          background: "#f5f6fa",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {detailModal.categoryId?.name || "No category"}
                      </span>
                      <span
                        className={`uom-status-pill ${detailModal.active ? "status-active" : "status-inactive"}`}
                      >
                        <span className="dot"></span>{" "}
                        {detailModal.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Est. Cost
                    </div>
                    <div className="fs-5 fw-bold text-primary">
                      {detailModal.estimatedCost > 0
                        ? moneyOrDash(detailModal.estimatedCost)
                        : "—"}
                    </div>
                  </div>
                </div>
                {detailModal.description && (
                  <p className="text-muted small mt-2 mb-0">
                    {detailModal.description}
                  </p>
                )}
                <div className="d-flex align-items-center gap-1 text-muted small mt-2">
                  <i className="bx bx-time-five"></i>
                  Est. {durationText(detailModal.estimatedDurationMinutes)}
                </div>
              </div>

              {/* Checklist sections */}
              <div
                className="px-4 py-3"
                style={{ maxHeight: 420, overflowY: "auto" }}
              >
                {(detailModal.sections || []).map((section, idx) => (
                  <div key={idx} className="mb-3">
                    <div
                      className="fw-semibold mb-2 d-flex align-items-center gap-2"
                      style={{ fontSize: 14 }}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#eef2ff",
                          color: "#4f46e5",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ minWidth: 0, wordBreak: "break-word" }}>
                        {section.sectionName}
                      </span>
                    </div>
                    <div className="d-flex flex-column gap-2 ps-4">
                      {(section.items || []).map((item, i) => (
                        <div
                          key={i}
                          className="d-flex justify-content-between align-items-center p-2"
                          style={{
                            background: "#fafbfc",
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ minWidth: 0, wordBreak: "break-word" }}>
                            {item.label}
                            {item.required && (
                              <span className="text-danger"> *</span>
                            )}
                          </span>
                          <span
                            className="text-muted text-capitalize"
                            style={{
                              fontSize: 11,
                              background: "#f0f1f5",
                              padding: "2px 8px",
                              borderRadius: 20,
                            }}
                          >
                            {item.inputType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="d-flex justify-content-between align-items-center p-3"
                style={{ borderTop: "1px solid #f1f3f5" }}
              >
                {canCreate ? (
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!detailModal.active}
                      disabled={busy}
                      onChange={() => handleToggleActive(detailModal)}
                      id="detailActiveSwitch"
                    />
                    <label
                      className="form-check-label"
                      htmlFor="detailActiveSwitch"
                    >
                      Active
                    </label>
                  </div>
                ) : (
                  <span></span>
                )}
                <Button color="light" onClick={() => setDetailModal(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default TaskTemplate;
