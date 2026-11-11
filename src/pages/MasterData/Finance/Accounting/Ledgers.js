import React, { useState } from "react";
import LedgerList from "./LedgerList";
import LedgerForm from "./LedgerForm";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import "../../UnitOfMeasurement/uom.scss";

const Ledgers = () => {
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "LEDGER", "READ");

  const [view, setView] = useState("list");
  const [editingItem, setEditingItem] = useState(null);

  if (!canView) return <Basic404 />;

  const goToList = () => {
    setView("list");
    setEditingItem(null);
  };

  if (view === "form") {
    return <LedgerForm editingItem={editingItem} onSaved={goToList} onCancel={goToList} />;
  }

  return (
    <LedgerList
      onAdd={() => {
        setEditingItem(null);
        setView("form");
      }}
      onEdit={(item) => {
        setEditingItem(item);
        setView("form");
      }}
    />
  );
};

export default Ledgers;
