import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import Sidebar from "./Sidebar";
import Vendor from "./Vendor";
import Items from "./Items";
import UnitOfMeasurement from "./UnitOfMeasurement";
import PaymentTerm from "./PaymentTerm";
import DepartmentMaster from "./DepartmentMaster";
import AssetCategory from "./AssetCategory";
import BudgetManagement from "./Finance/BudgetManagement";
import PurchaseRequisition from "./Procurement/PurchaseRequisition";
import PurchaseOrder from "./Procurement/PurchaseOrder";
import ProcurementDashboard from "./Procurement/Dashboard";
import RFQModule from "./Procurement/RFQ";
import Contract from "./Contract";
import DeliveryIntimation from "./Procurement/DeliveryIntimation";
import GoodsReceiptNote from "./Inventory/GRN";
import StorageLocation from "./Inventory/StorageLocation";
import Putaway from "./Inventory/Putaway";
import Stock from "./Inventory/Stock";
import InventoryTransfer from "./Inventory/InventoryTransfer";
import MoveOrder from "./Inventory/MoveOrder";
import CycleCount from "./Inventory/CycleCount";
import StockAdjustment from "./Inventory/StockAdjustment";
import ReorderRule from "./Inventory/ReorderRule";
import MaterialIssue from "./Inventory/MaterialIssue";
import MaterialReturn from "./Inventory/MaterialReturn";
import CapitalizationRequest from "./AssetLifecycle/CapitalizationRequest";
import CWIP from "./AssetLifecycle/CWIP";
import AssetCapitalization from "./AssetLifecycle/AssetCapitalization";
import FixedAssetRegister from "./AssetLifecycle/FixedAssetRegister";
import MaintenanceRequest from "./AssetLifecycle/MaintenanceRequest";
import WorkOrder from "./AssetLifecycle/WorkOrder";
import AssetWriteOffRequest from "./AssetLifecycle/AssetWriteOff";
import TaskTemplate from "./AssetLifecycle/TaskTemplate";
import PMSchedule from "./AssetLifecycle/PMSchedule";
import MaintenanceJob from "./AssetLifecycle/MaintenanceJob";
import VerificationJob from "./AssetLifecycle/VerificationJob";
import PhysicalVerification from "./AssetLifecycle/PhysicalVerification";
import AssetTag from "./AssetLifecycle/AssetTag";
import ScanIntake from "./AssetLifecycle/ScanIntake";
import AddScan from "./AssetLifecycle/AddScan";
import LocationStock from "./Inventory/LocationStock";
import AssetTransferRequest from "./AssetLifecycle/AssetTransfer";
import VendorInvoice from "./Finance/VendorInvoice";
import ChartOfAccounts from "./Finance/Accounting/ChartOfAccounts";
import Ledgers from "./Finance/Accounting/Ledgers";
import LedgerTypes from "./Finance/Accounting/LedgerTypes";
import LedgerSubTypes from "./Finance/Accounting/LedgerSubTypes";
import GlEntries from "./Finance/Accounting/GlEntries";
import AuditLogs from "./AuditLog";
import Basic404 from "../AuthenticationInner/Errors/Basic404";
import { usePermissions } from "../../Components/Hooks/useRoles.js";
import "./masterData.scss";

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("micrologin"))?.token;
  } catch {
    return undefined;
  }
};

const ROUTES = [
  { path: "vendor/*", perm: "VENDOR", element: <Vendor /> },
  { path: "item/*", perm: "ITEM_MASTER", element: <Items /> },
  { path: "uom/*", perm: "UOM", element: <UnitOfMeasurement /> },
  { path: "payment-term/*", perm: "PAYMENT_TERM", element: <PaymentTerm /> },
  { path: "department/*", perm: "DEPARTMENT", element: <DepartmentMaster /> },
  { path: "audit-log/*", perm: "AUDIT_LOG", element: <AuditLogs /> },
  {
    path: "asset-category/level/:level/*",
    perm: "ASSET_CATEGORY",
    element: <AssetCategory />,
  },
  { path: "budget/*", perm: "BUDGET", element: <BudgetManagement /> },
  { path: "chart-of-accounts/*", perm: "LEDGER", element: <ChartOfAccounts /> },
  { path: "ledger/*", perm: "LEDGER", element: <Ledgers /> },
  { path: "ledger-type/*", perm: "LEDGER_TYPE", element: <LedgerTypes /> },
  { path: "ledger-sub-type/*", perm: "LEDGER_TYPE", element: <LedgerSubTypes /> },
  { path: "gl-entry/*", perm: "GL_ENTRY", element: <GlEntries /> },
  {
    path: "purchase-requisition/*",
    perm: "PR",
    element: <PurchaseRequisition />,
  },
  { path: "rfq/*", perm: "RFQ", element: <RFQModule /> },
  { path: "po/*", perm: "PO", element: <PurchaseOrder /> },
  {
    path: "procurement-dashboard/*",
    perm: "PO",
    element: <ProcurementDashboard />,
  },
  { path: "contract/*", perm: "CONTRACT", element: <Contract /> },
  {
    path: "delivery-intimation/*",
    perm: "DELIVERY_INTIMATION",
    element: <DeliveryIntimation />,
  },
  { path: "grn/*", perm: "GRN", element: <GoodsReceiptNote /> },
  {
    path: "vendor-invoice/*",
    perm: "VENDOR_INVOICE",
    element: <VendorInvoice />,
  },
  {
    path: "storage-location/*",
    perm: "STORAGE_LOCATION",
    element: <StorageLocation />,
  },
  { path: "putaway/*", perm: "PUTAWAY", element: <Putaway /> },
  { path: "stock/*", perm: "STOCK", element: <Stock /> },
  { path: "location-stock/*", perm: "PUTAWAY", element: <LocationStock /> },
  {
    path: "inventory-transfer/*",
    perm: "INVENTORY_TRANSFER",
    element: <InventoryTransfer />,
  },
  { path: "move-order/*", perm: "MOVE_ORDER", element: <MoveOrder /> },
  { path: "cycle-count/*", perm: "CYCLE_COUNT", element: <CycleCount /> },
  {
    path: "stock-adjustment/*",
    perm: "STOCK_ADJUSTMENT",
    element: <StockAdjustment />,
  },
  { path: "reorder-rule/*", perm: "REORDER_RULE", element: <ReorderRule /> },
  {
    path: "material-issue/*",
    perm: "MATERIAL_ISSUE",
    element: <MaterialIssue />,
  },
  {
    path: "material-return/*",
    perm: "MATERIAL_RETURN",
    element: <MaterialReturn />,
  },
  {
    path: "capitalization-request/*",
    perm: "CAPITALIZATION_REQUEST",
    element: <CapitalizationRequest />,
  },
  {
    path: "asset-capitalization/*",
    perm: "ASSET_CAPITALIZATION",
    element: <AssetCapitalization />,
  },
  { path: "cwip/*", perm: "CWIP", element: <CWIP /> },
  {
    path: "fixed-asset/*",
    perm: "FIXED_ASSET",
    element: <FixedAssetRegister />,
  },
  {
    path: "maintenance-request/*",
    perm: "MAINTENANCE_REQUEST",
    element: <MaintenanceRequest />,
  },
  { path: "work-order/*", perm: "WORK_ORDER", element: <WorkOrder /> },
  {
    path: "asset-transfer/*",
    perm: "ASSET_TRANSFER",
    element: <AssetTransferRequest />,
  },
  {
    path: "asset-writeoff/*",
    perm: "ASSET_WRITEOFF",
    element: <AssetWriteOffRequest />,
  },
  { path: "task-template/*", perm: "TASK_TEMPLATE", element: <TaskTemplate /> },
  { path: "pm-schedule/*", perm: "PM_SCHEDULE", element: <PMSchedule /> },
  {
    path: "maintenance-job/*",
    perm: "MAINTENANCE_JOB",
    element: <MaintenanceJob />,
  },
  {
    path: "verification-job/*",
    perm: "VERIFICATION_JOB",
    element: <VerificationJob />,
  },
  {
    path: "physical-verification/*",
    perm: "PHYSICAL_VERIFICATION",
    element: <PhysicalVerification />,
  },
  { path: "asset-tag/*", perm: "ASSET_TAG", element: <AssetTag /> },
  { path: "asset-scan/*", perm: "VERIFICATION_JOB", element: <ScanIntake /> },
  { path: "asset-scan-add/*", perm: "VERIFICATION_JOB", element: <AddScan /> },
];

const MasterData = () => {
  const token = getToken();
  const { hasPermission, loading } = usePermissions(token);

  useEffect(() => {
    document.title = "Vendor | Jagruti Rehab";
  }, []);

  if (loading) {
    return (
      <div
        className="page-content d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  const canView = (perm) => hasPermission("MASTERDATA", perm, "READ");

  if (!ROUTES.some((r) => canView(r.perm))) {
    return <Basic404 />;
  }

  return (
    <div className="page-content" style={{ paddingTop: "70px" }}>
      <Container fluid className="p-0">
        <div className="master-data-shell">
          <div className="master-data-sidebar-col">
            <Sidebar />
          </div>
          <div className="master-data-content-col">
            <Routes>
              <Route path="/" element={null} />
              {ROUTES.map(({ path, perm, element }) => (
                <Route
                  key={path}
                  path={path}
                  element={canView(perm) ? element : <Basic404 />}
                />
              ))}
              <Route path="*" element={<Basic404 />} />
            </Routes>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MasterData;
