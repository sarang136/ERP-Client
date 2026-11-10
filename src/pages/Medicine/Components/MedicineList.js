import React, { useMemo, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import PropTypes from "prop-types";
import DataTable from "react-data-table-component";
import { connect } from "react-redux";
import EditMedicine from "./EditMedicine";
import { formatCurrency } from "../../../utils/formatCurrency";
import { normalizeUnderscores } from "../../../utils/normalizeUnderscore";
import { capitalizeWords } from "../../../utils/toCapitalize";

const MedicinesList = ({
  medicines,
  totalCount,
  setDeleteMedicine,
  searchItem,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [updateMedicine, setUpdateMedicine] = useState({
    isForm: false,
    formIndex: undefined,
    formData: undefined,
  });

  const toggleUpdateForm = (row) =>
    setUpdateMedicine({ isForm: true, formIndex: row._id, formData: row });

  const columns = useMemo(
    () => [
      { name: "ID", selector: (row) => row.id, minWidth: "130px", wrap: true },
      {
        name: "Name",
        selector: (row) => row.name,
        minWidth: "160px", wrap: true,
        cell: (row) => (
          <span className="fw-semibold text-primary text-capitalize">
            {row.name}
          </span>
        ),
      },
      // { name: "Brand Name", selector: (row) => row.brandName?.toUpperCase(), minWidth: "130px", wrap: true },
      { name: "Generic Name", selector: (row) => row.genericName?.toUpperCase(), minWidth: "160px", wrap: true },
      { name: "Form", selector: (row) => normalizeUnderscores(row.form), minWidth: "120px", wrap: true },
      { name: "Type", selector: (row) => normalizeUnderscores(row.type), minWidth: "100px", wrap: true },
      { name: "Strength", selector: (row) => row.strength, minWidth: "100px", wrap: true },
      { name: "Unit", selector: (row) => normalizeUnderscores(row.unit), minWidth: "120px", wrap: true },
      { name: <div>Base Unit(For Consumption)</div>, selector: (row) => normalizeUnderscores(row.baseUnit), minWidth: "120px", wrap: true },
      { name: <div>Purchase Unit(For Purchase)</div>, selector: (row) => normalizeUnderscores(row.purchaseUnit), minWidth: "130px", wrap: true },
      {
        name: "Conversion",
        minWidth: "180px", wrap: true,
        cell: (row) =>
          row.baseUnit && row.purchaseUnit && row.conversion?.baseQuantity && row.conversion?.purchaseQuantity
            ? `${row.conversion.purchaseQuantity} ${normalizeUnderscores(row.purchaseUnit)} = ${row.conversion.baseQuantity} ${normalizeUnderscores(row.baseUnit)}`
            : "-",
      },
      { name: "Category", selector: (row) => normalizeUnderscores(row.category), minWidth: "120px", wrap: true },
      { name: "Storage Type", selector: (row) => normalizeUnderscores(row.storageType), minWidth: "130px", wrap: true },
      { name: "Schedule Type", selector: (row) => normalizeUnderscores(row.scheduleType), minWidth: "130px", wrap: true },
      // { name: "Expiry", selector: (row) => row.expiry, minWidth: "100px", wrap: true },
      // { name: "Instruction", selector: (row) => capitalizeWords(row.instruction), minWidth: "130px", wrap: true },
      { name: "Composition", selector: (row) => capitalizeWords(row.composition), minWidth: "130px", wrap: true },
      // { name: "Quantity", selector: (row) => row.quantity, minWidth: "100px", wrap: true },
      // { name: "Unit Price", selector: (row) => formatCurrency(row.unitPrice), minWidth: "110px", wrap: true },
      {
        name: "Controlled Drug",
        selector: (row) => row.isControlledDrug,
        minWidth: "140px",
        cell: (row) => (row.isControlledDrug ? "Yes" : "No"),
      },
      {
        name: "Actions",
        minWidth: "120px",
        cell: (row) => (
          <>
            <Button
              size="sm"
              color="info"
              className="me-2"
              onClick={() => toggleUpdateForm(row)}
            >
              <i className="ri-quill-pen-line"></i>
            </Button>
            <Button
              size="sm"
              color="danger"
              outline
              onClick={() => setDeleteMedicine({ isOpen: true, data: row._id })}
            >
              <i className="ri-close-circle-line"></i>
            </Button>
          </>
        ),
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filteredData = useMemo(
    () =>
      (medicines || []).filter((item) =>
        item.name.toLowerCase().includes((searchItem || "").toLowerCase())
      ),
    [medicines, searchItem]
  );

  const closeModal = () =>
    setUpdateMedicine({ isForm: false, formIndex: undefined, formData: undefined });

  return (
    <div className="p-4 bg-light rounded shadow-sm">
      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        paginationServer
        paginationTotalRows={totalCount}
        paginationPerPage={itemsPerPage}
        paginationDefaultPage={currentPage}
        onChangePage={onPageChange}
        onChangeRowsPerPage={(newPerPage) => onItemsPerPageChange(newPerPage)}
        paginationRowsPerPageOptions={[5, 10, 25, 50]}
        highlightOnHover
        striped
        responsive
        fixedHeader
        fixedHeaderScrollHeight="60vh"
        customStyles={{
          table: {
            style: {
              minWidth: "1900px",
              maxWidth: "none",
            },
          },
          headRow: {
            style: {
              backgroundColor: "#cfe2ff",
              fontWeight: "600",
            },
          },
        }}
      />

      <Modal isOpen={updateMedicine.isForm} toggle={closeModal} size="xl" centered>
        <ModalHeader toggle={closeModal}>Edit Medicine</ModalHeader>
        <ModalBody>
          <EditMedicine
            updateMedicine={updateMedicine}
            setUpdateMedicine={setUpdateMedicine}
          />
        </ModalBody>
      </Modal>
    </div>
  );
};

MedicinesList.propTypes = {
  medicines: PropTypes.array.isRequired,
  totalCount: PropTypes.number.isRequired,
  setDeleteMedicine: PropTypes.func.isRequired,
  searchItem: PropTypes.string,
  currentPage: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  medicines: state.Medicine.data,
  totalCount: state.Medicine.totalCount,
});

export default connect(mapStateToProps)(MedicinesList);
