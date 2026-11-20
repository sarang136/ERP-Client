import React, { useState } from "react";
import VendorInvoiceList from "./VendorInvoiceList";
import GRNSelector from "./GRNSelector";
import VendorInvoiceForm from "./VendorInvoiceForm";
import VendorInvoiceDirectForm from "./VendorInvoiceDirectForm";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import "../../UnitOfMeasurement/uom.scss";

const VendorInvoice = () => {
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "VENDOR_INVOICE", "READ");

  // list | direct (new or edited bill) | select-grn and form (the original GRN-match flow)
  const [view, setView] = useState("list");
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [editing, setEditing] = useState(null);

  if (!canView) {
    return <Basic404 />;
  }

  const goToList = () => {
    setView("list");
    setSelectedGRN(null);
    setEditing(null);
  };

  if (view === "direct") {
    // the key gives each new bill a fresh form (and a fresh request id)
    return <VendorInvoiceDirectForm key={editing?._id || "new"} editing={editing} onSaved={goToList} onCancel={goToList} />;
  }

  if (view === "select-grn") {
    return (
      <GRNSelector
        onBack={goToList}
        onSelect={(grn) => {
          setSelectedGRN(grn);
          setView("form");
        }}
      />
    );
  }

  if (view === "form" && selectedGRN) {
    return <VendorInvoiceForm grn={selectedGRN} onSaved={goToList} onCancel={goToList} />;
  }

  return (
    <VendorInvoiceList
      onAdd={() => {
        setEditing(null);
        setView("direct");
      }}
      onEdit={(inv) => {
        setEditing(inv);
        setView("direct");
      }}
    />
  );
};

export default VendorInvoice;
