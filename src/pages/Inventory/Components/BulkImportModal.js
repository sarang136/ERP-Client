import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalHeader, ModalBody, Progress, ListGroup, ListGroupItem } from "reactstrap";
import { Button } from "../Components/Button";
import * as XLSX from "xlsx";
import axios from "axios";
import { toast } from "react-toastify";
import Typeloader from "./Loader";
import { parseExcelSerialDate } from "../../../Components/Common/ParseExcelSerialDate";
import { nanoid } from "nanoid";
import { useSelector } from "react-redux";
import { downloadFailedMedicines } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";

const dbFields = [
  "medicineName",
  "brandName",
  "genericName",
  "form",
  "baseUnit",
  "purchaseUnit",
  "unitType",
  "Strength",
  "stock",
  "mrp",
  "purchasePrice",
  "SalesPrice",
  "company",
  "manufacturer",
  "RackNum",
  "Expiry",
  "Batch",
  "Status",
];

const isNumericField = (field) =>
  [
    "stock",
    "mrp",
    "purchasePrice",
    "SalesPrice",
  ].includes(field);

const headerToDbMap = {
  "Medicine Name": "medicineName",
  "Brand Name": "brandName",
  "Generic Name": "genericName",
  Form: "form",
  "Base Unit": "baseUnit",
  "Purchase Unit": "purchaseUnit",
  Strength: "Strength",
  Unit: "unitType",
  Stock: "stock",
  "Stock  (Ex. Per Tablet, Per Ampoule)": "stock",
  MRP: "mrp",
  "MRP (Ex. Per Strip, Per Box)": "mrp",
  "Purchase Price": "purchasePrice",
  "Purchase Price  (Ex. Per Strip, Per Box)": "purchasePrice",
  "Sales Price": "SalesPrice",
  "Sales Price  (Ex. Per Strip, Per Box)": "SalesPrice",
  "Expiry Date": "Expiry",
  Batch: "Batch",
  Company: "company",
  Manufacturer: "manufacturer",
  Rack: "RackNum",
  Status: "Status",
};


const BulkImportModal = ({ isOpen, user, toggle, onImport }) => {
  const [uploadedData, setUploadedData] = useState([]);
  const { centerAccess } = useSelector((state) => state.User);
  const handleAuthError = useAuthError();
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  // const [headerRowIndex, setHeaderRowIndex] = useState(0);

  // const emptyMapping = () =>
  //   dbFields.reduce((acc, f) => {
  //     acc[f] = "";
  //     return acc;
  //   }, {});

  // const [columnMapping, setColumnMapping] = useState(emptyMapping());

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [failedChunks, setFailedChunks] = useState([]);
  const [uploadDone, setUploadDone] = useState(false);
  const [skippedCountTotal, setSkippedCountTotal] = useState(0);
  const [noExisitInCentralMedicineCount, setNoExistingCentralMedicineCount] = useState(0);
  const [medicineUpdatedCount, setMedicineUpdatedCount] = useState(0);
  const [noChangeInMedicineCount, setNoChangeInMedicineCount] = useState(0);
  const [batchId, setBatchId] = useState(nanoid());

  const [selectedCenters, setSelectedCenters] = useState([]);
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);



  const containerRef = useRef(null);
  // const svgRef = useRef(null);
  // const dbRefs = useRef({});
  // const fileRefs = useRef({});
  const endpoint = "/pharmacy/bulk-insert";

  const uploadedRef = useRef(0);
  const skippedRef = useRef(0);
  const totalItemsRef = useRef(0);
  const chunksTotalRef = useRef(0);
  const noExisitInCentralMedicineRef = useRef(0);
  const medicineUpdatedRef = useRef(0);
  const noChangeInMedicineRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedCenters([]);
    } else {
      setUploadedData([]);
      // setColumnMapping(emptyMapping());
      // setHeaderRowIndex(0);
      setUploadProgress(0);
      setUploadedCount(0);
      setTotalCount(0);
      setNoExistingCentralMedicineCount(0);
      setCurrentChunkIndex(0);
      setTotalChunks(0);
      setFailedChunks([]);
      setUploadDone(false);
      setSkippedCountTotal(0);
      setMedicineUpdatedCount(0);
      setNoChangeInMedicineCount(0);
      setSelectedCenters([]);
      setCenterDropdownOpen(false);
      uploadedRef.current = 0;
      skippedRef.current = 0;
      totalItemsRef.current = 0;
      chunksTotalRef.current = 0;
      noExisitInCentralMedicineRef.current = 0;
      medicineUpdatedRef.current = 0;
      noChangeInMedicineRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setCenterDropdownOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, {
        // header: 1,
        defval: "",
      });

      json.forEach((row) => {
        if (typeof row["Expiry Date"] === "number") {
          row["Expiry Date"] = parseExcelSerialDate(row["Expiry Date"]);
        }
      });

      setUploadedData(json);
      // setHeaderRowIndex(0);
      // setColumnMapping(emptyMapping());
      setUploadDone(false);
      setUploadProgress(0);
      setUploadedCount(0);
      setFailedChunks([]);
      setSkippedCountTotal(0);
      setNoExistingCentralMedicineCount(0);
      setMedicineUpdatedCount(0);
      setNoChangeInMedicineCount(0);
      uploadedRef.current = 0;
      skippedRef.current = 0;
      totalItemsRef.current = 0;
      chunksTotalRef.current = 0;
      noExisitInCentralMedicineRef.current = 0;
      medicineUpdatedRef.current = 0;
      noChangeInMedicineRef.current = 0;
    };
    reader.readAsArrayBuffer(file);
  };

  // const buildMappedObjects = () => {
  //   const rows = uploadedData.slice(headerRowIndex + 1);
  //   const mapped = rows.map((row) => {
  //     const obj = {};
  //     Object.entries(columnMapping).forEach(([field, colIndexStr]) => {
  //       if (colIndexStr !== "" && colIndexStr !== undefined) {
  //         const idx = Number(colIndexStr);
  //         const rawVal = row?.[idx];
  //         if (
  //           rawVal === undefined ||
  //           rawVal === null ||
  //           String(rawVal).trim() === ""
  //         ) {
  //           return;
  //         }
  //         if (isNumericField(field)) {
  //           const n = Number(String(rawVal).replace(/[^0-9.-]/g, ""));
  //           obj[field] = Number.isFinite(n) ? n : 0;
  //         } else {
  //           obj[field] = String(rawVal).trim();
  //         }
  //       }
  //     });
  //     if (Array.isArray(selectedCenters) && selectedCenters.length > 0) {
  //       const stockVal =
  //         typeof obj.stock === "number" ? obj.stock : Number(obj.stock || 0);
  //       obj.centers = selectedCenters.map((centerId) => ({
  //         centerId,
  //         stock: Number.isFinite(stockVal) ? stockVal : 0,
  //       }));
  //     }

  //     obj.deleted = false;
  //     obj.createdBy = user?.user?._id || user?._id || null;

  //     return obj;
  //   });
  //   const filtered = mapped.filter((o) => {
  //     const keys = Object.keys(o).filter(
  //       (k) => k !== "deleted" && k !== "centers"
  //     );
  //     return keys.length > 0;
  //   });

  //   return filtered;
  // };


  const buildMappedObjects = () => {
    if (!uploadedData.length) return [];

    const mapped = uploadedData.map((row) => {
      const obj = {};

      Object.entries(headerToDbMap).forEach(([header, field]) => {
        let val = row[header];

        if (val !== undefined && val !== null && String(val).trim() !== "") {
          if (isNumericField(field)) {
            const n = Number(String(val).replace(/[^0-9.-]/g, ""));
            obj[field] = Number.isFinite(n) ? n : 0;
          } else {
            obj[field] = String(val).trim();
          }
        }
      });

      if (selectedCenters?.length > 0) {
        const stockVal =
          typeof obj.stock === "number" ? obj.stock : Number(obj.stock || 0);
        obj.centers = selectedCenters.map((centerId) => ({
          centerId,
          stock: Number.isFinite(stockVal) ? stockVal : 0,
        }));
      }

      obj.deleted = false;
      obj.createdBy = user?.user?._id || user?._id || null;

      return obj;
    });

    return mapped.filter((o) =>
      Object.keys(o).some((k) => dbFields.includes(k))
    );
  }
  const sendChunkWithRetry = async (chunkData, chunkIndex, maxAttempts = 3, extra = {}) => {
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const resp = await axios.post(endpoint, { medicines: chunkData, batchId, ...extra }, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          timeout: 0,
          onUploadProgress: (progressEvent) => {
            if (!progressEvent || !progressEvent.total) return;
            const alreadyProcessed = uploadedRef.current + skippedRef.current;
            const chunkItems = chunkData.length || 1;
            const byteRatio = Math.min(
              1,
              Math.max(0, progressEvent.loaded / progressEvent.total)
            );
            const estimatedCurrentChunkItems = chunkItems * byteRatio;
            const totalItems = Math.max(1, totalItemsRef.current);
            const estimatedProcessedTotal =
              alreadyProcessed + estimatedCurrentChunkItems;
            let pct = Math.round((estimatedProcessedTotal / totalItems) * 100);
            pct = Math.max(0, Math.min(100, pct));
            setUploadProgress((prev) => Math.max(prev, pct));
          },
        });

        const data = resp || {};
        const inserted = Number(data.insertedCount ?? data.count ?? 0);
        const skipped =
          Number(
            data.skippedCount ?? Math.max(0, chunkData.length - inserted)
          ) || 0;
        const noExisitInCentralMedicine = Number(data.noExisitInCentralMedicine ?? 0);
        const noChangeMedicine = Number(data.noChangeCount) ?? 0;
        const updatedMedicine = Number(data.updatedCount) ?? 0;
        return { success: true, inserted, skipped, noExisitInCentralMedicine, noChangeMedicine, updatedMedicine };
      } catch (err) {
        // An expired session won't fix itself on retry.
        if (err?.response?.status === 401) {
          return { success: false, error: err, unauthorized: true };
        }
        toast.warn(`Chunk ${chunkIndex} attempt ${attempt} failed`);
        if (attempt >= maxAttempts) {
          return { success: false, error: err };
        }

        // eslint-disable-next-line no-loop-func
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
    return { success: false, error: new Error("Unknown error") };
  };

  const handleImport = async ({ chunkSize = 50 } = {}) => {
    if (!selectedCenters.length) {
      toast.error("Please select at least one center before importing.");
      return;
    }

    const mappedData = buildMappedObjects();
    const totalItemsLocal = mappedData.length;
    if (!totalItemsLocal) {
      toast.info("No data to import (no rows or no mapped fields).");
      return;
    }

    // reset refs and UI
    uploadedRef.current = 0;
    skippedRef.current = 0;
    totalItemsRef.current = totalItemsLocal;
    noExisitInCentralMedicineRef.current = 0;
    medicineUpdatedRef.current = 0;
    noChangeInMedicineRef.current = 0;
    setUploading(true);
    setUploadProgress(0);
    setUploadedCount(0);
    setTotalCount(totalItemsLocal);
    setFailedChunks([]);
    setNoExistingCentralMedicineCount(0);
    setMedicineUpdatedCount(0);
    setNoChangeInMedicineCount(0);
    setUploadDone(false);
    setSkippedCountTotal(0);

    // create chunks
    const chunks = [];
    for (let i = 0; i < totalItemsLocal; i += chunkSize) {
      chunks.push(mappedData.slice(i, i + chunkSize));
    }
    const chunksTotal = chunks.length;
    setTotalChunks(chunksTotal);
    chunksTotalRef.current = chunksTotal;

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    try {
      let failedChunkCount = 0; // local: the failedChunks state is stale inside this loop
      for (let i = 0; i < chunksTotal; i++) {
        setCurrentChunkIndex(i);
        const chunk = chunks[i];

        // The last chunk carries the totals of the chunks before it, so the
        // server can write a single activity row for the whole upload.
        const isLastChunk = i === chunksTotal - 1;
        const extra = isLastChunk
          ? {
              isLast: true,
              totals: {
                inserted: uploadedRef.current,
                updated: medicineUpdatedRef.current,
                skipped: skippedRef.current,
                failedChunks: failedChunkCount,
              },
            }
          : {};

        // send chunk (onUploadProgress will estimate within-chunk progress)
        const result = await sendChunkWithRetry(chunk, i, 3, extra);

        if (result.unauthorized) {
          handleAuthError({ statusCode: 401 });
          break;
        }

        if (!result.success) {
          failedChunkCount++;
          setFailedChunks((prev) => [
            ...prev,
            {
              index: i,
              data: chunk,
              error: result.error?.message || "unknown",
            },
          ]);
          toast.error(`Chunk ${i} failed after retries.`);
        } else {
          const inserted = result.inserted ?? 0;
          const skipped =
            result.skipped ?? Math.max(0, chunk.length - inserted);
          const noExisitInCentralMedicine = result.noExisitInCentralMedicine ?? 0;
          const medicineUpdated = result.updatedMedicine ?? 0;
          const noChangeInMedicine = result.noChangeMedicine ?? 0;

          // update refs (synchronous) and then update visible state
          uploadedRef.current += inserted;
          skippedRef.current += skipped;
          noExisitInCentralMedicineRef.current += noExisitInCentralMedicine;
          medicineUpdatedRef.current += medicineUpdated;
          noChangeInMedicineRef.current += noChangeInMedicine;


          setUploadedCount(uploadedRef.current);
          setSkippedCountTotal(skippedRef.current);
          setNoExistingCentralMedicineCount(noExisitInCentralMedicineRef.current);
          setMedicineUpdatedCount(medicineUpdatedRef.current);
          setNoChangeInMedicineCount(noChangeInMedicineRef.current);
          const processed = uploadedRef.current + skippedRef.current;
          let pct = Math.round(
            (processed / Math.max(1, totalItemsLocal)) * 100
          );
          pct = Math.max(0, Math.min(100, pct));
          setUploadProgress(pct);


          if (inserted < chunk.length) {
            // toast.info(
            //   `Chunk ${i}: inserted ${inserted}/${chunk.length}, skipped ${skipped}`
            // );
          }
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }

      setUploadProgress(100);
      setUploadDone(failedChunks.length === 0);



      const finalInserted = uploadedRef.current;
      const finalSkipped = skippedRef.current;
      if (failedChunks.length === 0) {
        toast.success(
          `Import finished: ${finalSkipped}`
        );
        // onImport(mappedData); // Call onImport to notify parent
        // toggle();
      } else {
        toast.warn(
          `Import finished with ${failedChunks.length} failed chunk(s). Inserted: ${finalInserted}, skipped: ${finalSkipped}`
        );
      }
    } catch (err) {
      toast.error("Upload failed unexpectedly");
    } finally {
      setUploading(false);
      window.removeEventListener("beforeunload", beforeUnload);
    }
  };

  const retryFailed = async () => {
    if (!failedChunks.length) return;
    setUploading(true);

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    try {
      const remaining = [];
      for (let i = 0; i < failedChunks.length; i++) {
        const item = failedChunks[i];
        const result = await sendChunkWithRetry(item.data, item.index, 3);
        if (result.unauthorized) {
          handleAuthError({ statusCode: 401 });
          remaining.push(...failedChunks.slice(i)); // keep this and the rest as failed
          break;
        }
        if (!result.success) {
          remaining.push({
            ...item,
            error: result.error?.message || "unknown",
          });
        } else {
          const inserted = result.inserted ?? 0;
          const skipped =
            result.skipped ?? Math.max(0, item.data.length - inserted);
          const noExisitInCentralMedicine = result.noExisitInCentralMedicine ?? 0;
          const medicineUpdated = result.updatedCount ?? 0;
          const noChangeInMedicine = result.noChangeCount ?? 0;

          uploadedRef.current += inserted;
          skippedRef.current += skipped;
          noExisitInCentralMedicineRef.current += noExisitInCentralMedicine;
          medicineUpdatedRef.current += medicineUpdated;
          noChangeInMedicineRef.current += noChangeInMedicine;

          setUploadedCount(uploadedRef.current);
          setSkippedCountTotal(skippedRef.current);
          setNoExistingCentralMedicineCount(noExisitInCentralMedicineRef.current);
          setMedicineUpdatedCount(medicineUpdatedRef.current);
          setNoChangeInMedicineCount(noExisitInCentralMedicineRef.current);



          const processed = uploadedRef.current + skippedRef.current;
          let pct = Math.round((processed / Math.max(1, totalCount)) * 100);
          pct = Math.max(0, Math.min(100, pct));
          setUploadProgress(pct);
        }
      }
      setFailedChunks(remaining);
      if (remaining.length === 0) {
        setUploadDone(true);
        setUploadProgress(100);
        toast.success("All failed chunks retried successfully");
        onImport([]);
        toggle();
      } else {
        toast.warn(`${remaining.length} chunk(s) still failing`);
      }
    } finally {
      setUploading(false);
      window.removeEventListener("beforeunload", beforeUnload);
    }
  };


  useEffect(() => {
    if (isOpen) setBatchId(nanoid());
  }, [isOpen]);

  // Draw mapping lines (unchanged)
  // const drawLines = () => {
  //   const svg = svgRef.current;
  //   const container = containerRef.current;
  //   if (!svg || !container) return;

  //   svg.innerHTML = `
  //     <defs>
  //       <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
  //         <polygon points="0 0, 10 3.5, 0 7" fill="#0d6efd" />
  //       </marker>
  //     </defs>
  //   `;

  //   const parentRect = container.getBoundingClientRect();

  //   Object.entries(columnMapping).forEach(([field, colIndexStr]) => {
  //     if (colIndexStr === "" || colIndexStr === undefined) return;
  //     const colIndex = Number(colIndexStr);

  //     const dbEl = dbRefs.current[field];
  //     const fileEl = fileRefs.current[colIndex];
  //     if (!dbEl || !fileEl) return;

  //     const dbRect = dbEl.getBoundingClientRect();
  //     const fileRect = fileEl.getBoundingClientRect();

  //     const startX = dbRect.right - parentRect.left;
  //     const startY = dbRect.top + dbRect.height / 2 - parentRect.top;
  //     const endX = fileRect.left - parentRect.left;
  //     const endY = fileRect.top + fileRect.height / 2 - parentRect.top;

  //     const line = document.createElementNS(
  //       "http://www.w3.org/2000/svg",
  //       "line"
  //     );
  //     line.setAttribute("x1", startX);
  //     line.setAttribute("y1", startY);
  //     line.setAttribute("x2", endX);
  //     line.setAttribute("y2", endY);
  //     line.setAttribute("stroke", "#0d6efd");
  //     line.setAttribute("stroke-width", "2");
  //     line.setAttribute("marker-end", "url(#arrowhead)");
  //     svg.appendChild(line);
  //   });
  // };

  // useEffect(() => {
  //   const id = requestAnimationFrame(() => drawLines());
  //   return () => cancelAnimationFrame(id);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [columnMapping, uploadedData, headerRowIndex]);

  // useEffect(() => {
  //   const handler = () => drawLines();
  //   window.addEventListener("resize", handler);
  //   return () => window.removeEventListener("resize", handler);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // const fileColumns = uploadedData[headerRowIndex] || [];
  // const dataPreview = uploadedData.slice(
  //   headerRowIndex + 1,
  //   headerRowIndex + 11
  // );

  // const onMapChange = (field, value) => {
  //   setColumnMapping((prev) => ({
  //     ...prev,
  //     [field]: value,
  //   }));
  // };

  // helper: available centers = all - selected
  const allCenters = user?.userCenters || [];
  const availableCenters = allCenters.filter(
    (c) => !selectedCenters.includes(String(c?._id))
  );

  const handleAddCenter = (centerId) => {
    if (uploading) return;
    setSelectedCenters((prev) => [...prev, String(centerId)]);
    setCenterDropdownOpen(true); // keep open for multi-select UX
  };

  const handleRemoveCenter = (centerId) => {
    if (uploading) return;
    setSelectedCenters((prev) => prev.filter((id) => id !== String(centerId)));
  };

  const handleFailedMedicinesDownload = async () => {
    try {
      const res = await downloadFailedMedicines({
        batchId,
        centers: centerAccess,
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const formattedDate = new Date().toISOString().split("T")[0];
      link.download = `Failed_Medicines_${formattedDate}.xlsx`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      onImport?.();
      setUploadDone(false);
      setUploadedData([]);
      toggle();
    } catch (error) {
      onImport?.();
      setUploadedData([]);
      setUploadDone(false);
      toggle();
      toast.error("Failed to download failed medicines file.");
    }
  };




  return (
    <Modal
      isOpen={isOpen}
      toggle={() => !uploading && toggle()}
      size="xl"
      backdrop="static"
    >
      <ModalHeader {...(!uploadDone && { toggle: () => !uploading && toggle() })}>
        {uploadDone ? "Bulk Import Summary" : "Bulk Import Medicines"}
      </ModalHeader>
      <ModalBody>
        {/* Custom Multi-select Centers */}

        {!uploadDone && (
          <>
            <div className="mb-3" ref={containerRef}>
              <label
                htmlFor="centersMultiCustom"
                style={{
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#4a5568",
                  display: "block",
                }}
              >
                Select Centers (click to open) <span className="text-danger">*</span>
              </label>

              <div
                id="centersMultiCustom"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 10px",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  backgroundColor: uploading ? "#f8f9fa" : "white",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
                onClick={() => {
                  if (!uploading) setCenterDropdownOpen((s) => !s);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!uploading) setCenterDropdownOpen((s) => !s);
                  }
                }}
              >
                {selectedCenters.length === 0 && (
                  <div style={{ color: "#6c757d" }}>No centers selected</div>
                )}
                {selectedCenters.map((id) => {
                  const c = allCenters.find((x) => String(x?._id) === String(id));
                  return (
                    <div
                      key={id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        backgroundColor: "#e9f2ff",
                        border: "1px solid #d0e6ff",
                        borderRadius: 999,
                        fontSize: 13,
                      }}
                    >
                      <span>{c?.title ?? id}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCenter(id);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          margin: 0,
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                        aria-label={`Remove ${c?.title ?? id}`}
                        disabled={uploading}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                <div style={{ marginLeft: "auto", paddingLeft: 8 }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: centerDropdownOpen ? "rotate(180deg)" : "none",
                    }}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="#495057"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {centerDropdownOpen && !uploading && (
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    marginTop: 8,
                    maxHeight: 220,
                    overflow: "auto",
                    background: "white",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    zIndex: 9999,
                    position: "relative",
                  }}
                >
                  {availableCenters.length === 0 ? (
                    <div style={{ padding: 12, color: "#6c757d" }}>
                      No more centers
                    </div>
                  ) : (
                    availableCenters.map((c) => (
                      <div
                        key={c?._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddCenter(c?._id);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCenter(c?._id);
                          }
                        }}
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid #f1f3f5",
                          cursor: "pointer",
                        }}
                      >
                        {c?.title}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* File selector */}
            <div className="mb-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="form-control"
                disabled={uploading}
              />
            </div>
          </>
        )}

        {/* Header row selector */}
        {/* {uploadedData.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Select Header Row</label>
            <select
              className="form-select"
              value={headerRowIndex}
              onChange={(e) => {
                setHeaderRowIndex(Number(e.target.value));
                setColumnMapping(emptyMapping());
              }}
              disabled={uploading}
            >
              {uploadedData.map((row, idx) => (
                <option key={idx} value={idx}>
                  Row {idx + 1}: {row.join(" | ")}
                </option>
              ))}
            </select>
          </div>
        )} */}

        {/* Mapping inputs */}
        {/* {fileColumns.length > 0 && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            {dbFields.map((field) => {
              const usedIndices = Object.values(columnMapping).filter(
                (v) => v !== "" && v !== undefined
              );
              return (
                <div
                  key={field}
                  className="d-flex align-items-center mb-2"
                  style={{ gap: 12 }}
                >
                  <div style={{ width: "40%", fontWeight: 600 }}>{field}</div>
                  <div style={{ width: "60%" }}>
                    <select
                      className="form-select"
                      value={columnMapping[field] ?? ""}
                      onChange={(e) => onMapChange(field, e.target.value)}
                      disabled={uploading}
                    >
                      <option value="">-- Not Mapped --</option>
                      {fileColumns.map((col, idx) => {
                        const idxStr = String(idx);
                        const isUsed = usedIndices.includes(idxStr);
                        const allowed =
                          !isUsed || columnMapping[field] === idxStr;
                        if (!allowed) return null;
                        const label =
                          String(col).trim() === ""
                            ? `Column ${idx + 1} (empty)`
                            : String(col);
                        return (
                          <option key={idx} value={idxStr}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )} */}

        {/* Mapping summary */}
        {/* {Object.values(columnMapping).some(
          (v) => v !== "" && v !== undefined
        ) && (
            <div
              ref={containerRef}
              style={{ position: "relative", padding: 12, marginBottom: 12 }}
            >
              <h5 style={{ marginBottom: 12 }}>Mapping Summary</h5>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 24,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dbFields.map((field) => (
                    <div
                      key={field}
                      ref={(el) => (dbRefs.current[field] = el)}
                      style={{
                        padding: "8px 12px",
                        minWidth: 140,
                        textAlign: "center",
                        backgroundColor: "#0d6efd",
                        color: "#fff",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {field}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {fileColumns.map((col, idx) => (
                    <div
                      key={idx}
                      ref={(el) => (fileRefs.current[idx] = el)}
                      style={{
                        padding: "8px 12px",
                        minWidth: 140,
                        textAlign: "center",
                        backgroundColor: "#6c757d",
                        color: "#fff",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {String(col).trim() === ""
                        ? `Column ${idx + 1} (empty)`
                        : String(col)}
                    </div>
                  ))}
                </div>
              </div>

              <svg
                ref={svgRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />
            </div>
          )} */}

        {/* Data preview */}
        {/* {dataPreview.length > 0 && (
          <div className="mt-3">
            <h5>Data Preview (Top {dataPreview.length} rows)</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    {fileColumns.map((col, idx) => (
                      <th key={idx}>
                        {String(col).trim() === "" ? `Column ${idx + 1}` : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {fileColumns.map((_, cIdx) => (
                        <td key={cIdx}>{row[cIdx]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

        {uploadedData.length > 0 && !uploadDone && (
          <div className="mt-3">
            <h5>Data Preview (Top {Math.min(uploadedData.length, 10)} rows)</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    {Object.keys(headerToDbMap)
                      .filter((header) => header in (uploadedData[0] || {}))
                      .map((header) => (
                        <th key={header}>
                          {header}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadedData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(headerToDbMap)
                        .filter((header) => header in (uploadedData[0] || {}))
                        .map((header) => (
                          <td key={header}>{row[header] ?? ""}</td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress overlay */}
        {uploading && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(5px)",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "2rem",
                borderRadius: "12px",
                maxWidth: "500px",
                width: "90%",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              <div className="alert alert-warning text-center fw-bold">
                ⚠️ Upload in progress — please DO NOT refresh or close this
                page.
              </div>
              <div className="mb-2 text-center small text-muted">
                items uploading • Chunk {currentChunkIndex + 1} / {totalChunks}
              </div>
              <div className="mb-2 small text-muted">
                Uploaded: {skippedCountTotal}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <Typeloader />
                <Progress
                  value={uploadProgress}
                  animated
                  style={{ width: "100%" }}
                >
                  {uploadProgress}%
                </Progress>
              </div>
            </div>
          </div>
        )}

        {!uploading && uploadDone && (
          <>
            <ListGroup flush className="text-start rounded-3 overflow-hidden border">
              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">Total</span>
                <span className="fw-bold text-primary fs-6">{totalCount}</span>
              </ListGroupItem>

              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">New Medicines Added</span>
                <span className="fw-bold text-success fs-6">{uploadedCount}</span>
              </ListGroupItem>

              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">Medicines Updated</span>
                <span className="fw-bold text-info fs-6">{medicineUpdatedCount}</span>
              </ListGroupItem>

              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">No Changes</span>
                <span className="fw-bold text-secondary fs-6">{noChangeInMedicineCount}</span>
              </ListGroupItem>

              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">Skipped as Not in Master Medicine List</span>
                <span className="fw-bold text-danger fs-6">{noExisitInCentralMedicineCount}</span>
              </ListGroupItem>

              <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
                <span className="fw-semibold text-muted">Total Skipped</span>
                <span className="fw-bold text-warning fs-6">{skippedCountTotal}</span>
              </ListGroupItem>
            </ListGroup>

            {skippedCountTotal > 0 && (
              <div className="p-3 bg-light rounded border">
                <p className="mb-3 text-muted" style={{ fontSize: "14px" }}>
                  Please download the list of failed medicines below. This file contains all entries
                  that couldn’t be imported successfully, so you can review and correct them later.
                </p>

                <button
                  type="button"
                  className="btn btn-primary px-4 fw-semibold text-white"
                  onClick={handleFailedMedicinesDownload}
                >
                  Download Failed Medicines
                </button>
              </div>
            )}


            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="outline"
                className="px-4 fw-semibold"
                onClick={() => {
                  onImport?.(buildMappedObjects());
                  setUploadDone(false);
                  setUploadedData([]);
                  toggle();
                }}
              >
                Close
              </Button>
            </div>
          </>
        )}



        {!uploading && failedChunks.length > 0 && (
          <div className="alert alert-danger">
            <div>
              <strong>{failedChunks.length}</strong> chunk(s) failed.
            </div>
            <div style={{ marginTop: 8 }}>
              {failedChunks.map((f) => (
                <div key={f.index}>
                  {/* Chunk {f.index}: {f.data.length} items — error: {f.error} */}
                  Some chunks are Faild
                </div>
              ))}
            </div>
            <div className="mt-2 d-flex gap-2">
              <Button onClick={retryFailed}>Retry Failed</Button>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-3" style={{ gap: 8 }}>
          {!uploadDone ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (!uploading) {
                    setUploadedData([]);
                    setUploadDone(false);
                    toggle();
                  }
                }}
                disabled={uploading}
              >
                Close
              </Button>

              <Button
                onClick={() => handleImport({ chunkSize: 50 })}
                disabled={uploading || uploadedData.length === 0 || selectedCenters.length === 0}
                title={selectedCenters.length === 0 ? "Select at least one center to import" : undefined}
              >
                {uploading ? "Uploading..." : "Import Data"}
              </Button>
            </>
          ) : null}
        </div>

      </ModalBody>
    </Modal>
  );
};

export default BulkImportModal;