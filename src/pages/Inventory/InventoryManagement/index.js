import React, { useEffect, useState, useRef, useMemo } from "react";
import { display } from "../../../utils/display";
import {
  Search,
  LayoutGrid,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardBody,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";
import AddinventoryMedicine from "../AddinventoryMedicine";
import { Button } from "../Components/Button";
import Select from "react-select";
import CompactDataGrid from "../Components/CompactDataGrid";
import RefreshButton from "../../../Components/Common/RefreshButton";
import { AnalyticsView } from "../views/AnalyticView";
import { StatusBadge } from "../Components/StatusBadge";
import BulkImportModal from "../Components/BulkImportModal";
import { toast } from "react-toastify";
import axios from "axios";
import Barcode from "react-barcode";
import { useDispatch, useSelector } from "react-redux";
import { fetchMedicines } from "../../../store/actions";
import { saveAs } from "file-saver";
import Givemedicine from "../GiveMedicine";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { downloadInventoryTemplate } from "../../../utils/downloadInventoryTemplate";
import { normalizeUnderscores } from "../../../utils/normalizeUnderscore";
import { capitalizeWords } from "../../../utils/toCapitalize";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDualUnitStock } from "../../../utils/pharmacyStockDisplay";
import { formatTwoDecimals } from "../../../utils/numberFormat";
import FailedMedicines from "../Components/FailedMedicines";
import { useMediaQuery } from "../../../Components/Hooks/useMediaQuery";
import { useAuthError } from "../../../Components/Hooks/useAuthError";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.User);
  const { loading: centralMedicineLoading, data: centralMedicines, totalPages: centralMedicineTotalPages, totalCount: centralMedicineTotalCount } = useSelector((state) => state.Medicine);
  const isMobile = useMediaQuery("(max-width: 1000px)");
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission } = usePermissions(token);
  const handleAuthError = useAuthError();
  const [view, setView] = useState("table");
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [modalOpengive, setModalOpengive] = useState(false);
  const [modalOpenFailedMedicineList, setModalOpenFailedMedicineList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qfilter, setQfilter] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const [medicines, setMedicines] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [printloading, setPrintLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showCentralMedicine, setShowCentralMedicine] = useState(false);
  const abortRef = useRef(null);



  const centerOptions = [
    ...(user?.userCenters?.length > 1
      ? [{
        value: "ALL",
        label: "All Centers",
        isDisabled: false,
      }]
      : []
    ),
    ...(
      user?.userCenters?.map(center => {
        return {
          value: center._id || center.id,
          label: center.title || "Unknown Center"
        };
      }) || []
    )
  ];

  const selectedCenterOption = centerOptions.find(
    opt => opt.value === selectedCenter
  ) || centerOptions[0];


  useEffect(() => {
    if (
      selectedCenter !== "ALL" &&
      !user?.userCenters?.some(c => c._id === selectedCenter)
    ) {
      setSelectedCenter("ALL");
      setCurrentPage(1);
    }
  }, [selectedCenter, user?.userCenters]);


  const centers =
    selectedCenter === "ALL"
      ? user?.userCenters?.map(c => c._id) || []
      : [selectedCenter];

  const toggleDropdown = (id) => {
    setDropdownOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    setModalOpen(true);
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setModalOpen(true);
  };

  const handleGiveMedicine = () => {
    setModalOpengive(true);
  };

  const handleFormSubmit = async (data) => {
    try {

      const payload = {
        ...data,
        updatedBy: editingMedicine?._id
          ? user?.user?._id || user?._id || null
          : undefined,
        createdBy: !editingMedicine?._id
          ? user?.user?._id || user?._id || null
          : undefined,
      };

      let res;

      if (editingMedicine && editingMedicine._id) {
        res = await axios.patch(`/pharmacy/${editingMedicine._id}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
        });
        toast.success(res?.data?.message || "Medicine updated successfully");
      } else {
        res = await axios.post("/pharmacy/", payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        toast.success(res?.data?.message || "Medicine added successfully");
      }

      // Close modal and refresh list
      setModalOpen(false);
      fetchInventoryMedicines({
        page: currentPage,
        limit: pageSize,
        q: debouncedSearch,
        fillter: qfilter,
        centers
      });
    } catch (error) {
      if (!handleAuthError({ statusCode: error?.response?.status })) {
        toast.error(
          error.response?.data?.message ||
          "Failed to save medicine. Please try again."
        );
      }
    }
  };

  const handleBulkImport = async (mappedData) => {
    fetchInventoryMedicines({
      page: 1,
      limit: pageSize,
      q: debouncedSearch,
      fillter: qfilter,
      centers,
    });
    setCurrentPage(1);
    setBulkOpen(false);
    toast.success(`Imported rows successfully.`);
  };

  // Fetch inventory medicines
  async function fetchInventoryMedicines({
    page = currentPage,
    limit = pageSize,
    q = "",
    fillter = "",
    // center,
    centers,
  } = {}) {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) { }
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // If no centers are selected, show empty results instead of querying all
    if (!centers || centers.length === 0) {
      setMedicines([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: q || undefined,
        fillter: fillter || undefined,
        centers: centers?.join(",") || undefined,
      };

      // if (center) {
      //   params.center = center;
      // } else if (user?.centerAccess) {
      //   params.centers = user.centerAccess;
      // }
      const response = await axios.get("/pharmacy/", {
        params,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      const body = response || {};
      setMedicines(Array.isArray(body.data) ? body.data : []);
      setTotalItems(Number(body.total ?? 0));
      setTotalPages(Number(body.pages ?? 1));
      setCurrentPage(Number(body.page ?? page));
    } catch (err) {
      const cancelled =
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED";
      if (cancelled) return;
      if (!handleAuthError(err)) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to fetch medicines");
      }
    } finally {
      setLoading(false);
    }
  }

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);



  // Fetch when page, size, search, filter or selectedCenter change
  useEffect(() => {
    if (showCentralMedicine) {
      dispatch(fetchMedicines({ page: currentPage, limit: pageSize, search: debouncedSearch }))
    } else {
      fetchInventoryMedicines({
        page: currentPage,
        limit: pageSize,
        q: debouncedSearch,
        fillter: qfilter,
        centers
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showCentralMedicine,
    currentPage,
    pageSize,
    debouncedSearch,
    qfilter,
    selectedCenter,
    user?.userCenters,
  ]);




  const goToPage = (page) => {
    if (page === "..." || page === currentPage) return;

    const maxPages = showCentralMedicine
      ? centralMedicineTotalPages || 1
      : totalPages || 1;

    const target = Math.max(1, Math.min(maxPages, page));
    setCurrentPage(target);
  };


  // useEffect(() => {
  //   dispatch(fetchCenters({ centerIds: user?.centerAccess }));
  // }, [dispatch, user?.centerAccess]);


  const handleViewChange = () => {
    setShowCentralMedicine((prev) => {
      const newMode = !prev;
      setSearchQuery("");
      setDebouncedSearch("");
      setQfilter("");
      setSelectedCenter("ALL");
      setCurrentPage(1);

      return newMode;
    });
  }




  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get("/medicine", {
        params: { limit: 100000 },
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const medicines = Array.isArray(response?.payload)
        ? response.payload
        : [];
      const approvedMedicines = medicines.filter(
        (m) => String(m?.status || "").trim().toUpperCase() === "APPROVED"
      );
      await downloadInventoryTemplate(
        approvedMedicines.length === 0 ? "NO_MEDICINE" : "TEMPLATE",
        approvedMedicines
      );
    } catch (err) {
      toast.error("Failed to download template");
    }
  };

  const handleExportExcel = async () => {
    try {
      setPrintLoading(true);

      const endpoint = showCentralMedicine
        ? "/medicine/export/master"
        : "/pharmacy/export";

      const params = showCentralMedicine
        ? { search: debouncedSearch || undefined }
        : {
          search: debouncedSearch || undefined,
          fillter: qfilter || undefined,
          centers: centers?.join(",") || undefined,
        };

      const response = await axios.get(endpoint, {
        params,
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const filenamePrefix = showCentralMedicine
        ? "Master_Medicine_Export"
        : "Pharmacy_Export";

      saveAs(
        blob,
        `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      toast.success(
        showCentralMedicine
          ? "Master Medicine List exported successfully"
          : "Inventory exported successfully"
      );
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error("Failed to export Excel file");
      }
    } finally {
      setPrintLoading(false);
    }
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  const conversionLabel = (baseUnit, purchaseUnit, conversion) =>
    baseUnit && purchaseUnit && conversion?.baseQuantity && conversion?.purchaseQuantity
      ? `${conversion.purchaseQuantity} ${normalizeUnderscores(purchaseUnit)} = ${conversion.baseQuantity} ${normalizeUnderscores(baseUnit)}`
      : "-";

  const stockDisplay = (stock, medicine) =>
    formatDualUnitStock(stock, medicine) ?? display(stock);

  // Columns for the Master Medicine List grid (CompactDataGrid shape —
  // key/header/align/minWidth/render — not the old custom Table component).
  const centralMedicineColumns = [
    { key: "id", header: "ID", minWidth: 90, render: (m) => display(m?.id) },
    {
      key: "name",
      header: "Name",
      minWidth: 160,
      render: (m) => <span className="fw-bold text-primary">{display(m?.name)}</span>,
    },
    { key: "genericName", header: "Generic Name", minWidth: 140, render: (m) => m?.genericName?.toUpperCase() || "-" },
    { key: "form", header: "Form", minWidth: 100, render: (m) => normalizeUnderscores(m?.form) },
    { key: "baseUnit", header: "Base Unit", minWidth: 100, render: (m) => normalizeUnderscores(m?.baseUnit) },
    { key: "purchaseUnit", header: "Purchase Unit", minWidth: 110, render: (m) => normalizeUnderscores(m?.purchaseUnit) },
    {
      key: "conversion",
      header: "Conversion",
      minWidth: 160,
      render: (m) => conversionLabel(m?.baseUnit, m?.purchaseUnit, m?.conversion),
    },
    { key: "category", header: "Category", minWidth: 110, render: (m) => normalizeUnderscores(m?.category) },
    { key: "storageType", header: "Storage Type", minWidth: 110, render: (m) => normalizeUnderscores(m?.storageType) },
    { key: "scheduleType", header: "Schedule Type", minWidth: 110, render: (m) => normalizeUnderscores(m?.scheduleType) },
    { key: "type", header: "Type", minWidth: 90, render: (m) => normalizeUnderscores(m?.type) },
    { key: "strength", header: "Strength", minWidth: 90, render: (m) => display(m?.strength) },
    { key: "unit", header: "Unit", minWidth: 80, render: (m) => display(m?.unit) },
    // { key: "expiry", header: "Expiry", minWidth: 100, render: (m) => fmtDate(m?.Expiry) },
    // { key: "instruction", header: "Instruction", minWidth: 140, render: (m) => capitalizeWords(m?.instruction) },
    { key: "composition", header: "Composition", minWidth: 140, render: (m) => capitalizeWords(m?.composition) },
    // { key: "quantity", header: "Quantity", align: "right", minWidth: 90, render: (m) => display(m?.quantity) },
    // { key: "unitPrice", header: "Unit Price", align: "right", minWidth: 100, render: (m) => formatCurrency(m?.unitPrice) },
    { key: "controlledDrug", header: "Controlled Drug", minWidth: 110, render: (m) => (m?.isControlledDrug ? "Yes" : "No") },
  ];

  // Per-row expandable "Centre / Available stock" list — kept from the
  // original table as-is (DOM toggle, not React state) since it's unrelated
  // to the table component swap.
  const centerStockCell = (med) => {
    const centers = med?.centers || [];
    const initialCount = 2;
    const hiddenCount = centers.length - initialCount;
    const containerId = `center-stock-container-${med._id}`;

    const toggleCenters = (e) => {
      e.preventDefault();
      const container = document.getElementById(containerId);
      if (!container) return;

      const hiddenItems = container.querySelectorAll(".hidden-center-item");
      const button = e.target;
      const isExpanded = button.getAttribute("data-expanded") === "true";

      if (isExpanded) {
        hiddenItems.forEach((item) => (item.style.display = "none"));
        button.innerText = `View all (+${hiddenCount})`;
        button.setAttribute("data-expanded", "false");
      } else {
        hiddenItems.forEach((item) => (item.style.display = "flex"));
        button.innerText = "View less";
        button.setAttribute("data-expanded", "true");
      }
    };

    return (
      <div style={{ whiteSpace: "normal", minWidth: "180px", padding: "4px 0" }} id={containerId}>
        {centers.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {centers.map((item, index) => {
              const isHidden = index >= initialCount;
              return (
                <li
                  key={index}
                  className={isHidden ? "hidden-center-item" : ""}
                  style={{
                    display: isHidden ? "none" : "flex",
                    justifyContent: "space-between",
                    borderBottom: index < centers.length - 1 ? "1px solid #eee" : "none",
                    padding: "2px 0",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#007bff" }}>{display(item?.centerId?.title)}</span>
                  <span style={{ fontWeight: 500, marginLeft: "10px" }}>{stockDisplay(item?.stock, med?.medicineId)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          "-"
        )}

        {hiddenCount > 0 && (
          <button
            onClick={toggleCenters}
            data-expanded="false"
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              padding: "2px 0",
              marginTop: "4px",
              fontSize: "0.85rem",
            }}
          >
            {`View all (+${hiddenCount})`}
          </button>
        )}
      </div>
    );
  };

  const isLiquidForm = (medicine) => medicine?.form === "LIQUID_FORM";

  // Stock is stored per-center in the unit matching how it's tracked: purchase
  // unit for LIQUID_FORM (e.g. bottles), base unit for everything else — so no
  // conversion is needed, just sum the raw values.
  const totalStockQty = (m) =>
    (m?.centers || []).reduce((sum, c) => sum + (Number(c?.stock) || 0), 0);

  const stockUnitLabel = (medicine) =>
    normalizeUnderscores(isLiquidForm(medicine) ? medicine?.purchaseUnit : medicine?.baseUnit);

  // MRP/Purchase Price/Sales Price are each the price of one purchase unit
  // (e.g. per strip/bottle). For LIQUID_FORM, stock is already in purchase
  // units, so the price applies directly. Otherwise, stock is in base units,
  // so price per base unit = price * purchaseQuantity / baseQuantity
  // (purchaseQuantity purchase units = baseQuantity base units).
  const pricePerStockUnit = (medicine, pricePerPurchaseUnit) => {
    const priceNum = Number(pricePerPurchaseUnit) || 0;
    if (isLiquidForm(medicine)) return priceNum;
    const purchaseQty = medicine?.conversion?.purchaseQuantity;
    const baseQty = medicine?.conversion?.baseQuantity;
    if (!purchaseQty || !baseQty) return priceNum;
    return (priceNum * purchaseQty) / baseQty;
  };

  // Precomputed once per row (not per column render) so the 4 columns that
  // need total stock, and the 3 price/unit + stock-value pairs, don't each
  // redo the same centers.reduce()/conversion math — recomputed only when
  // `medicines` (the current page's rows) changes.
  const pharmacyInventoryData = useMemo(
    () =>
      (medicines || []).map((m) => {
        const medicine = m?.medicineId;
        const stockQty = totalStockQty(m);
        const mrpPerUnit = pricePerStockUnit(medicine, m?.mrp);
        const purchasePricePerUnit = pricePerStockUnit(medicine, m?.purchasePrice);
        const salesPricePerUnit = pricePerStockUnit(medicine, m?.SalesPrice);
        return {
          ...m,
          _stockQty: stockQty,
          _stockUnitLabel: stockUnitLabel(medicine),
          _mrpPerUnit: mrpPerUnit,
          _mrpStockValue: mrpPerUnit * stockQty,
          _purchasePricePerUnit: purchasePricePerUnit,
          _purchaseStockValue: purchasePricePerUnit * stockQty,
          _salesPricePerUnit: salesPricePerUnit,
          _salesStockValue: salesPricePerUnit * stockQty,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [medicines]
  );

  // Columns for the Pharmacy Inventory grid (CompactDataGrid shape).
  const pharmacyInventoryColumns = [
    { key: "id", header: "ID", minWidth: 90, render: (m) => display(m?.id) },
    { key: "medicineId", header: "Medicine ID", minWidth: 100, render: (m) => display(m?.medicineId?.id) },
    {
      key: "barcode",
      header: "Bar Code",
      minWidth: 130,
      render: (m) => (
        <div style={{ transform: "scale(0.9)", transformOrigin: "left center" }}>
          {m?.id || m?.code ? (
            <Barcode value={String(m?.id || m?.code)} height={30} fontSize={10} displayValue={true} />
          ) : (
            "-"
          )}
        </div>
      ),
    },
    { key: "code", header: "Code", minWidth: 90, render: (m) => display(m?.code) },
    {
      key: "medicineName",
      header: "Medicine Name",
      minWidth: 160,
      render: (m) => <span className="fw-bold text-primary">{display(m?.medicineName)}</span>,
    },
    { key: "genericName", header: "Generic Name", minWidth: 140, render: (m) => m?.medicineId?.genericName?.toUpperCase() || "-" },
    { key: "form", header: "Form", minWidth: 100, render: (m) => normalizeUnderscores(m?.medicineId?.form) },
    { key: "baseUnit", header: "Base Unit", minWidth: 100, render: (m) => normalizeUnderscores(m?.medicineId?.baseUnit) },
    { key: "purchaseUnit", header: "Purchase Unit", minWidth: 110, render: (m) => normalizeUnderscores(m?.medicineId?.purchaseUnit) },
    {
      key: "conversion",
      header: "Conversion",
      minWidth: 160,
      render: (m) => conversionLabel(m?.medicineId?.baseUnit, m?.medicineId?.purchaseUnit, m?.medicineId?.conversion),
    },
    { key: "category", header: "Category", minWidth: 110, render: (m) => normalizeUnderscores(m?.medicineId?.category) },
    { key: "storageType", header: "Storage Type", minWidth: 110, render: (m) => normalizeUnderscores(m?.medicineId?.storageType) },
    { key: "scheduleType", header: "Schedule Type", minWidth: 110, render: (m) => normalizeUnderscores(m?.medicineId?.scheduleType) },
    { key: "type", header: "Type", minWidth: 90, render: (m) => normalizeUnderscores(m?.medicineId?.type) },
    { key: "strength", header: "Strength", minWidth: 90, render: (m) => display(m?.Strength) },
    { key: "centerStock", header: "Centre / Available stock", minWidth: 260, render: centerStockCell },
    { key: "unit", header: "Unit", minWidth: 80, render: (m) => display(m?.unitType || m?.unit) },
    { key: "totalStock", header: "Total Stock", align: "right", minWidth: 110, render: (m) => `${formatTwoDecimals(m._stockQty)} ${m._stockUnitLabel}` },
    { key: "mrp", header: "M.R.P", align: "right", minWidth: 90, render: (m) => display(m?.mrp) },
    { key: "mrpPerUnit", header: "M.R.P / Unit", align: "right", minWidth: 100, render: (m) => formatCurrency(m._mrpPerUnit) },
    { key: "mrpStockValue", header: "M.R.P Stock Value", align: "right", minWidth: 140, render: (m) => formatCurrency(m._mrpStockValue) },
    { key: "purchasePrice", header: "Purchase Price", align: "right", minWidth: 110, render: (m) => display(m?.purchasePrice) },
    { key: "purchasePricePerUnit", header: "Purchase Price / Unit", align: "right", minWidth: 130, render: (m) => formatCurrency(m._purchasePricePerUnit) },
    { key: "purchaseStockValue", header: "Purchase Stock Value", align: "right", minWidth: 150, render: (m) => formatCurrency(m._purchaseStockValue) },
    { key: "salesPrice", header: "Sales Price", align: "right", minWidth: 100, render: (m) => display(m?.SalesPrice) },
    { key: "salesPricePerUnit", header: "Sales Price / Unit", align: "right", minWidth: 120, render: (m) => formatCurrency(m._salesPricePerUnit) },
    { key: "salesStockValue", header: "Sales Stock Value", align: "right", minWidth: 140, render: (m) => formatCurrency(m._salesStockValue) },
    { key: "expiryDate", header: "Expiry Date", minWidth: 100, render: (m) => fmtDate(m?.Expiry) },
    { key: "batch", header: "Batch", minWidth: 100, render: (m) => display(m?.Batch) },
    { key: "company", header: "Company", minWidth: 120, render: (m) => display(m?.company) },
    { key: "manufacturer", header: "Manufacturer", minWidth: 130, render: (m) => display(m?.manufacturer) },
    { key: "rackNum", header: "Rack Number", minWidth: 100, render: (m) => display(m?.RackNum) },
    { key: "status", header: "Status", minWidth: 110, render: (m) => <StatusBadge status={m.Status} /> },
    { key: "controlledDrug", header: "Controlled Drug", minWidth: 110, render: (m) => (m?.medicineId?.isControlledDrug ? "Yes" : "No") },
    { key: "sareyaanBarcode", header: "Sareyaan Barcode", minWidth: 130, render: (m) => display(m?.sareyaanBarcode) },
    ...(hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE")
      ? [
          {
            key: "actions",
            header: "Actions",
            minWidth: 70,
            render: (m) => (
              <Dropdown isOpen={!!dropdownOpen[m._id]} toggle={() => toggleDropdown(m._id)}>
                <DropdownToggle tag="button" className="btn btn-ghost p-1">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownToggle>
                <DropdownMenu end>
                  <DropdownItem onClick={() => handleEdit(m)}>Edit</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  return (
    <CardBody className="p-3 bg-white" style={isMobile ? { width: "100%" } : { width: "78%" }}>
      <div className="content-wrapper">
        {/* Header: title + primary actions */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h5 className="mb-1 fw-semibold">Inventory Management</h5>
            <p className="text-muted mb-0 fs-13">
              Manage medicine stock, pricing, and details across centers
            </p>
          </div>

          {isMobile ? (
            <div className="d-flex align-items-center gap-2">
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") ? (
                <Button size="sm" onClick={handleAdd}>+ Add Medicine</Button>
              ) : (
                ""
              )}

              <Dropdown
                isOpen={actionsMenuOpen}
                toggle={() => setActionsMenuOpen((prev) => !prev)}
              >
                <DropdownToggle
                  tag="button"
                  type="button"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownToggle>
                <DropdownMenu end>
                  {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") && (
                    <DropdownItem onClick={handleViewChange}>
                      {showCentralMedicine ? "Back to Inventory" : "Master Medicine List"}
                    </DropdownItem>
                  )}
                  {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") && (
                    <DropdownItem onClick={handleDownloadTemplate}>
                      Download Template
                    </DropdownItem>
                  )}
                  {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") && (
                    <DropdownItem onClick={() => setBulkOpen(true)}>
                      Bulk Actions
                    </DropdownItem>
                  )}
                  {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") && (
                    <DropdownItem disabled={printloading} onClick={handleExportExcel}>
                      {printloading ? "Exporting..." : "Export (Excel)"}
                    </DropdownItem>
                  )}
                  {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") && (
                    <DropdownItem onClick={handleGiveMedicine}>
                      Give Medicine
                    </DropdownItem>
                  )}
                  {!showCentralMedicine && (
                    <DropdownItem onClick={() => setModalOpenFailedMedicineList(true)}>
                      View Failed Medicines
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          ) : (
            <div className="d-flex flex-wrap align-items-center gap-2">
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") ? (
                <Button size="sm" onClick={handleAdd}>+ Add Medicine</Button>
              ) : (
                ""
              )}
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") ? (
                <Button size="sm" onClick={handleViewChange}>
                  {showCentralMedicine ? "Back to Inventory" : "Master Medicine List"}
                </Button>
              ) : (
                ""
              )}
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") ? (
                <Button size="sm" onClick={handleDownloadTemplate}>
                  Download Template
                </Button>
              ) : (
                ""
              )}
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") ? (
                <Button size="sm" onClick={() => setBulkOpen(true)}>
                  Bulk Actions
                </Button>
              ) : (
                ""
              )}
              {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "READ") ? (
                <Button
                  size="sm"
                  disabled={printloading}
                  onClick={handleExportExcel}
                >
                  {printloading ? "Exporting..." : "Export (Excel)"}
                </Button>
              ) : (
                ""
              )}
              {/* {hasPermission("PHARMACY", "PHARMACYMANAGEMENT", "WRITE") ? (
                <Button size="sm" onClick={handleGiveMedicine}>Give Medicine</Button>
              ) : (
                ""
              )} */}
              {!showCentralMedicine && (
                <Button size="sm" onClick={() => setModalOpenFailedMedicineList(true)}>
                  View Failed Medicines
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Search + filters, with refresh/view-switch on the same row */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div style={{ flex: "1 1 240px", maxWidth: isMobile ? "100%" : "290px" }}>
            <div className="position-relative w-100">
              <Search
                className="position-absolute"
                style={{
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "18px",
                  width: "18px",
                  color: "#6c757d",
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search medicines..."
                className={`form-control`}
                style={{
                  paddingLeft: "36px",
                  paddingRight: "12px",
                  height: "40px",
                }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {!showCentralMedicine && (
            <>
              <div style={{ flex: "1 1 180px", maxWidth: isMobile ? "100%" : "220px" }}>
                <Select
                  placeholder="All Stock Levels"
                  value={
                    [
                      { value: "LOW", label: "Low" },
                      { value: "NORMAL", label: "Normal" },
                      { value: "MODERATE", label: "Moderate" },
                      { value: "OUTOFSTOCK", label: "Out Of Stock" },
                    ].find(opt => opt.value === qfilter) || null
                  }
                  onChange={(option) => {
                    setQfilter(option?.value || "");
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "NORMAL", label: "Normal" },
                    { value: "MODERATE", label: "Moderate" },
                    { value: "OUTOFSTOCK", label: "Out Of Stock" },
                  ]}
                />
              </div>

              <div style={{ flex: "1 1 180px", maxWidth: isMobile ? "100%" : "220px" }}>
                <Select
                  value={selectedCenterOption}
                  onChange={(option) => {
                    setSelectedCenter(option?.value);
                    setCurrentPage(1);
                  }}
                  options={centerOptions}
                  placeholder="All Centers"
                  classNamePrefix="react-select"
                />
              </div>
            </>
          )}

          {/* Refresh + view-switch, same row as filters — page-size control
              now lives in CompactDataGrid's own footer */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <RefreshButton
              loading={showCentralMedicine ? centralMedicineLoading : loading}
              onRefresh={() =>
                showCentralMedicine
                  ? dispatch(fetchMedicines({ page: currentPage, limit: pageSize, search: debouncedSearch }))
                  : fetchInventoryMedicines({
                      page: currentPage,
                      limit: pageSize,
                      q: debouncedSearch,
                      fillter: qfilter,
                      centers,
                    })
              }
            />
            {!showCentralMedicine && (
              <div className="btn-group bg-white shadow-sm rounded p-1 view-switch-toggle">
                <style>{`
                  .view-switch-toggle .btn-outline-primary:hover {
                    background-color: #eef3ff;
                    color: #0d6efd;
                    border-color: #cfe0ff;
                  }
                `}</style>
                <Button
                  variant={view === "table" ? "default" : "outline"}
                  size="icon-sm"
                  title="Table view"
                  onClick={() => setView("table")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "analytics" ? "default" : "outline"}
                  size="icon-sm"
                  title="Analytics view"
                  onClick={() => setView("analytics")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        {view === "table" && (
          <div className="position-relative" style={{ minHeight: "500px" }}>
            {showCentralMedicine ? (
              <CompactDataGrid
                columns={centralMedicineColumns}
                data={centralMedicines || []}
                loading={centralMedicineLoading}
                page={currentPage}
                setPage={goToPage}
                limit={pageSize}
                setLimit={(n) => {
                  setPageSize(n);
                  setCurrentPage(1);
                }}
                total={centralMedicineTotalCount || 0}
                keyField="_id"
                noDataComponent="No records found"
                rowsPerPageOptions={[10, 25, 50]}
              />
            ) : (
              <CompactDataGrid
                columns={pharmacyInventoryColumns}
                data={pharmacyInventoryData}
                loading={loading}
                page={currentPage}
                setPage={goToPage}
                limit={pageSize}
                setLimit={(n) => {
                  setPageSize(n);
                  setCurrentPage(1);
                }}
                total={totalItems}
                keyField="_id"
                noDataComponent="No records found"
                rowsPerPageOptions={[10, 25, 50]}
              />
            )}
          </div>
        )}

        {/* Analytics View */}
        {view === "analytics" && <AnalyticsView medicines={medicines} />}

        <Modal
          isOpen={modalOpen}
          toggle={() => setModalOpen(!modalOpen)}
          size="xl"
          scrollable
          backdrop="static"
        >
          <ModalHeader toggle={() => setModalOpen(false)}>
            {editingMedicine ? "Edit Medicine" : "Add Medicine"}
          </ModalHeader>
          <ModalBody>
            <AddinventoryMedicine
              user={user}
              defaultValues={editingMedicine || {}}
              onSubmit={handleFormSubmit}
            />
          </ModalBody>
        </Modal>

        <Modal
          isOpen={modalOpenFailedMedicineList}
          toggle={() => setModalOpenFailedMedicineList(!modalOpenFailedMedicineList)}
          size="lg"
          scrollable
          backdrop="static"
        >
          <ModalHeader toggle={() => setModalOpenFailedMedicineList(false)}>
            {"Failed Medicines"}
          </ModalHeader>
          <ModalBody>
            <FailedMedicines
              user={user}
              isOpen={modalOpenFailedMedicineList}
              onClose={() => setModalOpenFailedMedicineList(false)}
              hasPermission={hasPermission}
            />
          </ModalBody>
        </Modal>

        <Modal
          isOpen={modalOpengive}
          toggle={() => setModalOpengive(!modalOpengive)}
          size="xl"
          scrollable
          backdrop="static"
          fullscreen="sm"
        >
          <ModalHeader toggle={() => setModalOpengive(false)}>
            {"Give Medicine"}
          </ModalHeader>
          <ModalBody>
            <Givemedicine
              user={user}
              setModalOpengive={setModalOpengive}
              fetchMedicines={() =>
                fetchInventoryMedicines({
                  page: 1,
                  limit: 10,
                  q: debouncedSearch,
                  fillter: qfilter,
                  centers,
                })
              }
              onResetPagination={() => {
                setCurrentPage(1);
                setPageSize(10);
              }}
            />
          </ModalBody>
        </Modal>

        <BulkImportModal
          isOpen={bulkOpen}
          user={user}
          toggle={() => setBulkOpen(!bulkOpen)}
          onImport={handleBulkImport}
        />
      </div >
    </CardBody >
  );
};

export default InventoryManagement;
