import React from "react";
import VendorPaymentList from "./VendorPaymentList";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import "../../UnitOfMeasurement/uom.scss";

const VendorPayment = () => {
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  if (!hasPermission("MASTERDATA", "VENDOR_PAYMENT", "READ")) return <Basic404 />;
  return <VendorPaymentList />;
};

export default VendorPayment;
