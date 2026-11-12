import React, { useState } from "react";
import PRList from "./PRList";
import PRForm from "./PRForm";
import PROverview from "./PROverview";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import "../../UnitOfMeasurement/uom.scss";

const PurchaseRequisition = () => {
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "PR", "READ");

  const [view, setView] = useState("list");
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPRId, setSelectedPRId] = useState(null);

  if (!canView) {
    return <Basic404 />;
  }

  const goToList = () => {
    setView("list");
    setEditingItem(null);
    setSelectedPRId(null);
  };

  if (view === "form") {
    return (
      <PRForm editingItem={editingItem} onSaved={goToList} onCancel={goToList} />
    );
  }

  if (view === "overview" && selectedPRId) {
    return <PROverview prId={selectedPRId} onBack={goToList} />;
  }

  return (
    <PRList
      onAdd={() => {
        setEditingItem(null);
        setView("form");
      }}
      onOpen={(item) => {
        setSelectedPRId(item._id);
        setView("overview");
      }}
      onEdit={(item) => {
        setEditingItem(item);
        setView("form");
      }}
    />
  );
};

export default PurchaseRequisition;