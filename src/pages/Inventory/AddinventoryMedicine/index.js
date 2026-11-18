import axios from "axios";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Spinner } from "reactstrap";
import Select from "react-select";
import { getCenterHasStock } from "../../../helpers/backend_helper";

const normalizeLabel = (val) =>
  val ? val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const sharedStyles = {
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "24px",
    borderBottom: "2px solid #edf2f7",
    paddingBottom: "12px",
    textAlign: "center",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "8px",
    fontWeight: "600",
    fontSize: "13px",
    color: "#475467",
  },
  input: {
    minHeight: "42px",
    padding: "10px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: 1.4,
    backgroundColor: "#ffffff",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: "12px",
    marginTop: "6px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  select: {
    minHeight: "42px",
    padding: "10px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "white",
    appearance: "none",
  },
  section: {
    marginBottom: "20px",
    padding: "18px",
    border: "1px solid #eaecf0",
    borderRadius: "14px",
    backgroundColor: "#fcfcfd",
  },
  sectionHeading: {
    letterSpacing: "0.08em",
  },
};

const InputField = ({
  label,
  name,
  register,
  errors,
  type = "text",
  validation,
  isFullWidth = false,
  step,
  disabled = false,
}) => (
  <div
    style={{
      ...sharedStyles.formGroup,
      ...(isFullWidth ? sharedStyles.fullWidth : {}),
    }}
  >
    <label htmlFor={name} style={sharedStyles.label}>
      {label}
    </label>
    <input
      id={name}
      type={type}
      step={step || (type === "number" ? "any" : undefined)}
      {...register(name, validation)}
      style={sharedStyles.input}
      disabled={disabled}
    />
    {errors[name] && <p style={sharedStyles.errorText}>{errors[name].message}</p>}
  </div>
);

const AddinventoryMedicine = ({
  user,
  defaultValues = {},
  onSubmit,
  uploading = false,
}) => {
  const centerList = useSelector((state) => state.Center.data);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      medicineId: defaultValues.medicineId || "",
      code: defaultValues.code || "",
      medicineName: defaultValues.medicineName || "",
      brandName: defaultValues.medicineId?.brandName || defaultValues.brandName || "",
      genericName: defaultValues.medicineId?.genericName || defaultValues.genericName || "",
      form: defaultValues.medicineId?.form || defaultValues.form || "",
      baseUnit: defaultValues.medicineId?.baseUnit || defaultValues.baseUnit || "",
      purchaseUnit: defaultValues.medicineId?.purchaseUnit || defaultValues.purchaseUnit || "",
      category: defaultValues.medicineId?.category || defaultValues.category || "",
      storageType: defaultValues.medicineId?.storageType || defaultValues.storageType || "",
      scheduleType: defaultValues.medicineId?.scheduleType || defaultValues.scheduleType || "",
      unitType: defaultValues.unitType || "",
      Strength: defaultValues.Strength || "",
      stock: defaultValues.stock || "",
      // costprice: defaultValues.costprice || "",
      // value: defaultValues.value || "",
      mrp: defaultValues.mrp || "",
      purchasePrice: defaultValues.purchasePrice || "",
      SalesPrice: defaultValues.SalesPrice || "",
      company: defaultValues.company || "",
      manufacturer: defaultValues.manufacturer || "",
      RackNum: defaultValues.RackNum || "",
      Expiry: defaultValues.Expiry || "",
      Batch: defaultValues.Batch || "",
      Status: defaultValues.Status || "NORMAL",
    },
  });

  const isEditMode = !!defaultValues.medicineName;

  const submitHandler = (data) => {
    if (!selectedCenters.length) {
      alert("At least one valid center is required");
      return;
    }

    const zeroStockCenters = selectedCenters.filter((id) => {
      const stock = Number(centerStocks[id]) || 0;
      return stock === 0;
    });

    if (zeroStockCenters.length > 0) {
      const touchedCenters = zeroStockCenters.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {});
      setCenterStockTouched((prev) => ({ ...prev, ...touchedCenters }));
      return;
    }

    const isLiquidForm = watch("form") === "LIQUID_FORM";

    const centersPayload = selectedCenters.map((id) => {
      let stock = Number(centerStocks[id]) || 0;
      const unitType = centerStockUnits[id] || (isLiquidForm ? "PURCHASE" : "BASE");
      const hasConversion = medicineConversion?.baseQuantity && medicineConversion?.purchaseQuantity;

      if (isLiquidForm) {
        // LIQUID_FORM medicines store Pharmacy stock in the purchase unit
        // (e.g. bottle count), unlike every other form. A purchase-unit entry
        // is already in that unit, so it's saved as-is; a base-unit entry
        // (e.g. ml) is converted down to the exact (unrounded) purchase-unit
        // equivalent before saving, since the stored field is always
        // purchase-unit for this form.
        if (unitType === "BASE" && hasConversion) {
          stock = stock * (medicineConversion.purchaseQuantity / medicineConversion.baseQuantity);
        }
      } else if (unitType === "PURCHASE" && hasConversion) {
        stock = stock * (medicineConversion.baseQuantity / medicineConversion.purchaseQuantity);
      }

      return {
        centerId: id,
        stock: stock,
      };
    });
    onSubmit && onSubmit({ ...data, centers: centersPayload });
    // onSubmit && onSubmit({ ...data, centers: selectedCenters });
  };

  // --- Dropdown and selected centers state ---
  // --- Dropdown and selected centers state ---
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineValidLoader, setMedicineValidLoader] = useState(false);
  const [medicineSelected, setMedicineSelected] = useState(false);
  const [medicineValid, setMedicineValid] = useState(true);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [selectedCenters, setSelectedCenters] = useState(
    defaultValues.centers
      ? defaultValues.centers
        .map((c) => {
          return typeof c.centerId === "object"
            ? String(c.centerId._id)
            : String(c.centerId);
        })
        .filter((id) => user?.centerAccess?.includes(id))
      : []
  );
  const [centerStocks, setCenterStocks] = useState(() => {
    const map = {};
    if (defaultValues.centers) {
      defaultValues.centers.forEach((c) => {
        const id =
          typeof c.centerId === "object"
            ? String(c.centerId._id)
            : String(c.centerId);

        map[id] = c.stock ?? "";
      });
    }
    return map;
  });

  const [medicineConversion, setMedicineConversion] = useState(
    defaultValues.medicineId?.conversion || defaultValues.conversion || null
  );
  const [centerStockUnits, setCenterStockUnits] = useState(() => {
    const map = {};
    const isLiquid = (defaultValues.medicineId?.form || defaultValues.form) === "LIQUID_FORM";
    if (isLiquid && defaultValues.centers) {
      defaultValues.centers.forEach((c) => {
        const id =
          typeof c.centerId === "object" ? String(c.centerId._id) : String(c.centerId);
        map[id] = "PURCHASE";
      });
    }
    return map;
  });
  const [centerStockTouched, setCenterStockTouched] = useState({});
  const [centerStockError, setCenterStockError] = useState("");
  const [checkingCenterStock, setCheckingCenterStock] = useState(false);






  useEffect(() => {
    const verifyMedicineExists = async () => {
      if (!defaultValues?.medicineName) return;

      try {
        setMedicineValidLoader(true);
        const res = await axios.get("/medicine/", {
          params: { search: defaultValues.medicineName },
        });
        const payload = res?.payload || [];

        const found = payload.find(
          (m) =>
            m.name?.toLowerCase().trim() ===
            defaultValues.medicineName?.toLowerCase().trim()
        );

        if (!found) {
          setMedicineValid(false);
        } else {
          setMedicineQuery(defaultValues.medicineName);
          setMedicineSelected(true);
          setMedicineConversion(found.conversion || null);
          setValue("medicineName", defaultValues.medicineName);
          setValue("brandName", defaultValues.medicineId?.brandName || defaultValues.brandName || "");
          setValue("genericName", defaultValues.medicineId?.genericName || defaultValues.genericName || "");
          setValue("form", defaultValues.medicineId?.form || defaultValues.form || "");
          setValue("baseUnit", defaultValues.medicineId?.baseUnit || defaultValues.baseUnit || "");
          setValue("purchaseUnit", defaultValues.medicineId?.purchaseUnit || defaultValues.purchaseUnit || "");
          setValue("category", defaultValues.medicineId?.category || defaultValues.category || "");
          setValue("storageType", defaultValues.medicineId?.storageType || defaultValues.storageType || "");
          setValue("scheduleType", defaultValues.medicineId?.scheduleType || defaultValues.scheduleType || "");
          setValue("unitType", defaultValues.unitType || "");
          setValue("Strength", defaultValues.Strength || "");
          setValue("purchasePrice", defaultValues.purchasePrice || "");
        }
      } catch (err) {
        setMedicineValid(false);
      } finally {
        setMedicineValidLoader(false);
      }
    };

    verifyMedicineExists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);



  const handleMedicineSearch = async (query) => {
    setMedicineQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingMedicines(true);
    try {
      const res = await axios.get("/medicine/", {
        params: {
          search: query,
          excludePending: true,
        },
      });
      const payload = res?.payload || [];
      setSearchResults(payload);
    } catch (err) {
    } finally {
      setLoadingMedicines(false);
      setMedicineDropdownOpen(true);
    }
  };


  useEffect(() => {
    if (isEditMode && !hasUserTyped) return;

    const delayDebounce = setTimeout(() => {
      if (medicineQuery.trim()) {
        handleMedicineSearch(medicineQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicineQuery, hasUserTyped]);

  const handleSelectMedicine = (medicine) => {
    setValue("medicineId", medicine._id);
    setValue("medicineName", medicine.name);
    setMedicineConversion(medicine.conversion || null);
    setValue("brandName", medicine.brandName || "");
    setValue("genericName", medicine.genericName || "");
    setValue("form", medicine.form || "");
    setValue("baseUnit", medicine.baseUnit || "");
    setValue("purchaseUnit", medicine.purchaseUnit || "");
    setValue("category", medicine.category || "");
    setValue("storageType", medicine.storageType || "");
    setValue("scheduleType", medicine.scheduleType || "");
    setValue("unitType", medicine.unit || medicine.baseUnit || "");
    setValue("Strength", medicine.strength || "");
    setValue("purchasePrice", medicine.unitPrice || "");

    setMedicineQuery(medicine.name);
    setMedicineDropdownOpen(false);
    setMedicineSelected(true);
  };




  const allowedCenters = centerList || [];

  const handleCenterChange = async (selectedOptions) => {
    const requestedIds = (selectedOptions || []).map((opt) => opt.value);
    setCenterStockError("");

    // Find removed centers and delete their stocks & units
    const removedIds = selectedCenters.filter((id) => !requestedIds.includes(id));
    if (removedIds.length > 0) {
      setCenterStocks((prev) => {
        const copy = { ...prev };
        removedIds.forEach((id) => delete copy[id]);
        return copy;
      });
      setCenterStockUnits((prev) => {
        const copy = { ...prev };
        removedIds.forEach((id) => delete copy[id]);
        return copy;
      });
    }

    let addedIds = requestedIds.filter((id) => !selectedCenters.includes(id));

    let newSelectedIds = requestedIds;
    if (addedIds.length > 0 && !isEditMode) {
      setCheckingCenterStock(true);
      try {
        const noStockIds = [];
        for (const id of addedIds) {
          try {
            const res = await getCenterHasStock(id);
            if (!res?.hasStock) noStockIds.push(id);
          } catch (err) {
            noStockIds.push(id);
          }
        }
        if (noStockIds.length > 0) {
          const names = noStockIds
            .map((id) => allowedCenters.find((c) => String(c._id) === id)?.title || id)
            .join(", ");
          setCenterStockError(
            `${names} ${noStockIds.length > 1 ? "have" : "has"} no existing stock in inventory. Use bulk upload to add their first stock before adding medicine one at a time.`
          );
          newSelectedIds = requestedIds.filter((id) => !noStockIds.includes(id));
          addedIds = addedIds.filter((id) => !noStockIds.includes(id));
        }
      } finally {
        setCheckingCenterStock(false);
      }
    }

    // Find added centers and initialize them
    if (addedIds.length > 0) {
      setCenterStocks((prev) => {
        const copy = { ...prev };
        addedIds.forEach((id) => {
          if (copy[id] === undefined) copy[id] = "";
        });
        return copy;
      });
      setCenterStockUnits((prev) => {
        const copy = { ...prev };
        const defaultUnit = watch("form") === "LIQUID_FORM" ? "PURCHASE" : "BASE";
        addedIds.forEach((id) => {
          if (copy[id] === undefined) copy[id] = defaultUnit;
        });
        return copy;
      });
    }

    setSelectedCenters(newSelectedIds);
  };


  if (medicineValidLoader) {
    return (
      <div className="text-center py-4">
        <Spinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      {
        medicineValid && (<h2 style={sharedStyles.title}>
          {defaultValues?.medicineName
            ? "Edit Medicine Details"
            : "Add New Medicine"}
        </h2>)
      }

      {!medicineValid ? (
        <div className="text-center py-5">
          <i className="ri-error-warning-line fs-1 text-danger"></i>
          <h5 className="mt-3 text-danger">Medicine no longer exists in master list</h5>
          <p className="text-muted">Please add it to the master medicine list first before editing.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submitHandler)}>

          {/* Section: Medicine Search */}
          <div style={sharedStyles.section}>
            <p className="fw-semibold text-muted fs-12 text-uppercase mb-2" style={sharedStyles.sectionHeading}>Medicine</p>
            <div style={{ position: "relative" }}>
              <label className="fs-12 text-muted mb-1">Medicine Name</label>
              <input
                id="medicineName"
                type="text"
                placeholder="Search medicine..."
                value={medicineQuery}
                onChange={(e) => {
                  setMedicineQuery(e.target.value);
                  if (isEditMode) setHasUserTyped(true);
                }}
                className="form-control form-control-sm"
                autoComplete="off"
              />
              {medicineDropdownOpen && (!isEditMode || hasUserTyped) && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, width: "100%",
                  backgroundColor: "white", border: "1px solid #e2e8f0",
                  borderRadius: 8, maxHeight: 220, overflowY: "auto",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.1)", zIndex: 9999, marginTop: 4,
                }}>
                  {loadingMedicines ? (
                    <div className="p-3 text-muted fs-13">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-muted fs-13">No medicines found</div>
                  ) : (
                    searchResults.map((med) => (
                      <div
                        key={med._id}
                        onClick={() => handleSelectMedicine(med)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-3 py-2 border-bottom"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <span className="fw-semibold">{med.name}</span>{" "}
                        {(med.strength || med.unit) && (
                          <span className="text-muted fs-12">({[med.strength, med.unit].filter(Boolean).join(" ")})</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              {errors.medicineName && <p style={sharedStyles.errorText}>{errors.medicineName.message}</p>}
            </div>
          </div>

          {/* Section: Medicine Info (read-only) */}
          {medicineSelected && (
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p className="fw-semibold text-muted fs-12 text-uppercase mb-3" style={{ letterSpacing: "0.08em" }}>Medicine Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 20px" }}>
                {[
                  // { label: "Brand Name", name: "brandName" },
                  { label: "Generic Name", name: "genericName" },
                  { label: "Form", name: "form" },
                  { label: "Base Unit", name: "baseUnit" },
                  { label: "Purchase Unit", name: "purchaseUnit" },
                  { label: "Strength", name: "Strength" },
                  { label: "Category", name: "category" },
                  { label: "Storage Type", name: "storageType" },
                  { label: "Schedule Type", name: "scheduleType" },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="fs-12 text-muted mb-1">{label}</label>
                    <input {...register(name)} disabled className="form-control form-control-sm bg-white d-none" />
                    <input readOnly className="form-control form-control-sm bg-white" value={normalizeLabel(watch(name))} />
                  </div>
                ))}
                {medicineConversion?.baseQuantity && medicineConversion?.purchaseQuantity && (
                  <div>
                    <label className="fs-12 text-muted mb-1">Conversion</label>
                    <input 
                      readOnly 
                      className="form-control form-control-sm bg-white" 
                      value={`${medicineConversion.purchaseQuantity} ${normalizeLabel(watch("purchaseUnit"))} = ${medicineConversion.baseQuantity} ${normalizeLabel(watch("baseUnit"))}`} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Centers */}
          <div style={sharedStyles.section}>
            <p className="fw-semibold text-muted fs-12 text-uppercase mb-2" style={sharedStyles.sectionHeading}>Centers & Stock</p>
            <div>
              <label className="fs-12 text-muted mb-1">Select Centers</label>
              <Select
                isMulti
                name="centers"
                placeholder="Choose centers..."
                options={(allowedCenters || []).map((c) => ({ value: String(c._id), label: c.title }))}
                value={selectedCenters.map((id) => {
                  const c = allowedCenters.find((x) => String(x._id) === id) || defaultValues.centers?.find((x) => String(typeof x.centerId === "object" ? x.centerId._id : x.centerId) === id)?.centerId;
                  return { value: id, label: c?.title || id };
                })}
                onChange={handleCenterChange}
                classNamePrefix="react-select"
                isDisabled={uploading || !medicineSelected || checkingCenterStock}
              />
              {checkingCenterStock && <p className="fs-12 text-muted mt-1">Checking center stock...</p>}
              {centerStockError && <p style={sharedStyles.errorText}>{centerStockError}</p>}
            </div>

            {/* Center wise stock */}
            {selectedCenters.length > 0 && (
              <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {selectedCenters.map((id) => {
                  const centerInfo =
                    allowedCenters.find((x) => String(x._id) === id) ||
                    defaultValues.centers?.find((c) => {
                      const cid = typeof c.centerId === "object" ? c.centerId._id : c.centerId;
                      return String(cid) === id;
                    })?.centerId;
                  const rawStockStr = centerStocks[id] ?? "";
                  let stockNum = Number(rawStockStr) || 0;
                  const isLiquidForm = watch("form") === "LIQUID_FORM";
                  // The stored stock for LIQUID_FORM medicines is always a
                  // purchase-unit quantity (e.g. bottle count), so that's the
                  // correct default unit to show/edit it as — defaulting to
                  // "BASE" here would mislabel the existing value and, if
                  // saved unchanged, silently re-convert and corrupt it.
                  const unitType = centerStockUnits[id] || (isLiquidForm ? "PURCHASE" : "BASE");
                  let convertedStock = stockNum;
                  const hasConversion = medicineConversion?.baseQuantity && medicineConversion?.purchaseQuantity;
                  if (isLiquidForm) {
                    if (unitType === "BASE" && hasConversion) {
                      convertedStock = stockNum * (medicineConversion.purchaseQuantity / medicineConversion.baseQuantity);
                    }
                  } else if (unitType === "PURCHASE" && hasConversion) {
                    convertedStock = stockNum * (medicineConversion.baseQuantity / medicineConversion.purchaseQuantity);
                  }

                  return (
                    <div key={id}>
                      <label className="fs-12 text-muted mb-1">{centerInfo?.title || "Center"}</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number" min="0" step="any"
                          value={rawStockStr}
                          onChange={(e) => {
                            setCenterStocks((prev) => ({ ...prev, [id]: e.target.value }));
                            if (centerStockTouched[id] === undefined) {
                              setCenterStockTouched((prev) => ({ ...prev, [id]: true }));
                            }
                          }}
                          onBlur={() => setCenterStockTouched((prev) => ({ ...prev, [id]: true }))}
                          className="form-control w-50"
                          placeholder="Stock"
                          style={{
                            borderColor: centerStockTouched[id] && stockNum === 0 ? "#e53e3e" : "",
                          }}
                        />
                        <select
                          className="form-select w-50"
                          value={unitType}
                          onChange={(e) => setCenterStockUnits((prev) => ({ ...prev, [id]: e.target.value }))}
                        >
                          <option value="BASE">{normalizeLabel(watch("baseUnit")) || "Base Unit"}</option>
                          <option value="PURCHASE">{normalizeLabel(watch("purchaseUnit")) || "Purchase Unit"}</option>
                        </select>
                      </div>
                      {centerStockTouched[id] && stockNum === 0 && (
                        <p style={sharedStyles.errorText}>Stock quantity cannot be 0</p>
                      )}
                      {rawStockStr !== "" && stockNum !== 0 && (
                        <div className="fs-12 text-dark mt-1 fw-medium" style={{ fontSize: "11px" }}>
                          Total Stock: {convertedStock}{" "}
                          {isLiquidForm
                            ? normalizeLabel(watch("purchaseUnit")) || "Unit"
                            : normalizeLabel(watch("baseUnit")) || "Unit"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Inventory Details */}
          <div style={sharedStyles.section}>
            <p className="fw-semibold text-muted fs-12 text-uppercase mb-3" style={sharedStyles.sectionHeading}>Inventory Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <InputField label="Code" name="code" register={register} errors={errors} />
              <InputField label="Unit Type" name="unitType" register={register} errors={errors} disabled={true} />
              {/* <InputField label="Cost Price" name="costprice" type="number" step="any" validation={{ required: "Cost Price is required", min: { value: 0, message: "Must be non-negative" } }} />
              <InputField label="Value" name="value" type="number" step="any" validation={{ required: "Value is required", min: { value: 0, message: "Must be non-negative" } }} /> */}
              <InputField label="M.R.P" name="mrp" register={register} errors={errors} type="number" step="any" validation={{ required: "MRP is required", min: { value: 0, message: "Must be non-negative" } }} />
              <InputField label="Purchase Price" name="purchasePrice" register={register} errors={errors} type="number" step="any" validation={{ min: { value: 0, message: "Must be non-negative" } }} />
              <InputField label="Sales Price" name="SalesPrice" register={register} errors={errors} type="number" step="any" validation={{ required: "Sales Price is required", min: { value: 0, message: "Must be non-negative" } }} />
              <InputField label="Expiry Date" name="Expiry" register={register} errors={errors} type="date" />
              <InputField label="Batch Number" name="Batch" register={register} errors={errors} />
              <InputField label="Company" name="company" register={register} errors={errors} validation={{ required: "Company is required" }} />
              <InputField label="Manufacturer" name="manufacturer" register={register} errors={errors} />
              <InputField label="Rack Number" name="RackNum" register={register} errors={errors} />
              <div style={sharedStyles.formGroup}>
                <label htmlFor="Status" style={sharedStyles.label}>Status</label>
                <select id="Status" {...register("Status", { required: "Status is required" })} style={sharedStyles.select}>
                  <option value="NORMAL">Normal</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                  <option value="OUTOFSTOCK">Out of Stock</option>
                </select>
                {errors.Status && <p style={sharedStyles.errorText}>{errors.Status.message}</p>}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              disabled={uploading}
              className="btn btn-primary px-4"
            >
              {uploading ? "Saving..." : defaultValues?.medicineName ? "Update Medicine" : "Add Medicine"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddinventoryMedicine;
