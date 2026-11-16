import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

export const downloadInventoryTemplate = async (type = "TEMPLATE", medicines = []) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Pharmacy Inventory");

        const headers = [
            "Medicine Name",
            "Strength",
            "Unit",
            "Stock  (Ex. Per Tablet, Per Ampoule)",
            "MRP (Ex. Per Strip, Per Box)",
            "Purchase Price  (Ex. Per Strip, Per Box)",
            "Sales Price  (Ex. Per Strip, Per Box)",
            "Expiry Date",
            "Batch",
            "Company",
            "Manufacturer",
            "Rack",
            "Status",
        ];

        sheet.addRow(headers);

        sheet.getRow(1).font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
        };
        sheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF007ACC" },
        };

        sheet.columns.forEach((col, idx) => {
            col.width = Math.max(headers[idx].length + 2, 15);
        });

        const expiryDateColIndex = headers.indexOf("Expiry Date") + 1;
        if (expiryDateColIndex > 0) {
            sheet.getColumn(expiryDateColIndex).numFmt = "dd-mm-yyyy";
        }

        if (medicines.length > 0) {
            medicines.forEach((med) => {
                const rowData = {
                    "Medicine Name": med?.name || "",
                    Strength: med?.strength || "",
                    Unit: med?.unit || "",
                };
                sheet.addRow(headers.map((h) => rowData[h] ?? ""));
            });
        } else {
            const emptyRow = headers.map(() => "");
            sheet.addRow(emptyRow);
        }

        const now = new Date();
        const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
        const dateStr = istDate.toISOString().slice(0, 10);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `Pharmacy_Template_${dateStr}.xlsx`);

        if (type === "NO_MEDICINE") {
            toast.warn("No records found — exporting an empty Excel template.");
        } else {
            toast.success("Template downloaed successfully");
        }
    } catch (err) {
        toast.error("Failed to download template");
    }
};