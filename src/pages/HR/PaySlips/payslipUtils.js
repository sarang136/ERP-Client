import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import PayslipPdf from "../../../utils/paySlipPdf";

export const EMPTY_VALUE = "--";

export const hasDisplayValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

export const displayValue = (value) =>
  hasDisplayValue(value) ? String(value) : EMPTY_VALUE;

export const displayMoney = (value) => {
  if (!hasDisplayValue(value)) return EMPTY_VALUE;
  const amount = Number(value);
  return Number.isFinite(amount) ? `Rs. ${amount.toLocaleString("en-IN")}` : EMPTY_VALUE;
};

export const displayPercent = (value) => {
  if (!hasDisplayValue(value)) return EMPTY_VALUE;
  const percent = Number(value);
  return Number.isFinite(percent) ? `${percent.toLocaleString("en-IN")}%` : EMPTY_VALUE;
};

export const monthLabel = (row) => {
  if (row?.month && row?.year) return `${row.month} ${row.year}`;
  if (row?.payPeriodEnd) {
    return new Date(row.payPeriodEnd).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
  return EMPTY_VALUE;
};

const sanitizeFileName = (value) =>
  displayValue(value)
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "_");

export const buildPayslipFileName = (row) => {
  const employeeName = sanitizeFileName(row?.employeeName || row?.employeeCode || "Employee");
  const month = sanitizeFileName(monthLabel(row).replace(" ", "_") || "Month");
  return `${employeeName}_${month}_Payslip.pdf`;
};

export const downloadPayslipPdf = async (row) => {
  const blob = await pdf(<PayslipPdf row={row} />).toBlob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = buildPayslipFileName(row);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const downloadPayslipPdfById = async (payslipId, payslips = []) => {
  const payslip = payslips.find((item) => item?._id === payslipId);
  if (!payslip) {
    throw new Error("Payslip not found");
  }

  return downloadPayslipPdf(payslip);
};

const BULK_BATCH_SIZE = 50;

const addPayslipToZip = async (zip, usedNames, data, index) => {
  const blob = await pdf(<PayslipPdf row={data} />).toBlob();
  let name = buildPayslipFileName(data);
  if (usedNames.has(name)) {
    name = name.replace(/\.pdf$/i, `_${index + 1}.pdf`);
  }
  usedNames.add(name);
  zip.file(name, blob);
};

export const downloadPayslipsBulk = async (rows, fetchByIds, { onProgress, handleAuthError } = {}) => {
  const zip = new JSZip();
  const usedNames = new Set();
  const stats = { failures: 0, completed: 0 };

  for (let start = 0; start < rows.length; start += BULK_BATCH_SIZE) {
    const batch = rows.slice(start, start + BULK_BATCH_SIZE);
    const batchIds = batch.map((row) => row._id);

    let batchData = [];
    try {
      const res = await fetchByIds(batchIds);
      if (!res?.success || !Array.isArray(res?.data)) throw new Error("Payslips not found");
      batchData = res.data;
    } catch (error) {
      if (handleAuthError?.(error)) {
        return { total: rows.length, failures: stats.failures };
      }
      stats.failures += batch.length;
      stats.completed += batch.length;
      onProgress?.(stats.completed, rows.length);
      continue;
    }

    const dataById = new Map(batchData.map((data) => [data._id, data]));

    await Promise.all(
      batch.map(async (row, batchIndex) => {
        const data = dataById.get(row._id);
        if (!data) {
          stats.failures += 1;
        } else {
          try {
            await addPayslipToZip(zip, usedNames, data, start + batchIndex);
          } catch (error) {
            stats.failures += 1;
          }
        }
        stats.completed += 1;
        onProgress?.(stats.completed, rows.length);
      }),
    );
  }

  if (zip.file(/.*/).length > 0) {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `Payslips_${Date.now()}.zip`);
  }

  return { total: rows.length, failures: stats.failures };
};

// Build a file descriptor for the <PreviewFile> component: generates the payslip
// PDF in-browser from a full payslip row and exposes it as a blob URL.
// The caller fetches the full row by id first, then revokes the URL when done.
export const buildPayslipPreviewFile = async (row) => {
  const blob = await pdf(<PayslipPdf row={row} />).toBlob();
  const url = window.URL.createObjectURL(blob);
  const name = buildPayslipFileName(row);
  return { url, type: "application/pdf", name, originalName: name };
};

export const useDebouncedValue = (value, delay = 450) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export const readStickyFilters = (key, fallback) => {
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch (error) {
    return fallback;
  }
};

export const writeStickyFilters = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Session storage can be unavailable in private browsing; filters still work in memory.
  }
};
