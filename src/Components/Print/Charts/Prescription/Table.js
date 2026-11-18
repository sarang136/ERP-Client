import { View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { format } from "date-fns";
import { formatDosage } from "../../../../../helpers/prescriptionFrequency";
import { getMedicineEndDate } from "../../../../../helpers/currentMedicines";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  col4: {
    width: "24%",
  },
  col5: {
    width: "28%",
  },
  instr: {
    fontFamily: "Roboto",
    fontSize: "12px",
  },
  fontSm: {
    fontSize: "9px",
    color: "#1d1d1d",
  },
  mrgnTop10: {
    marginTop: 10,
  },
  mrgnLeft10: {
    marginLeft: 10,
  },
  paddingTop10: {
    paddingTop: 10,
  },
  paddingBottom10: {
    paddingBottom: 10,
  },
  borderBottom: {
    borderBottom: "1px solid #1d1d1d",
  },
});

const formatDate = (d) => {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, "dd MMM yy");
};

const PrescriptionTable = ({ medicines }) => {
  const safe = (value) =>
    value === null || value === undefined ? "" : String(value);

  const getDateRange = (period, item) => {
    const from = period?.startDate || item?.startDate;
    const to =
      period?.endDate ||
      item?.endDate ||
      (from ? getMedicineEndDate(from, period) : null);
    return { from: formatDate(from) || "-", to: formatDate(to) || "Ongoing" };
  };

  return (
    <React.Fragment>
      <View style={styles.fontSm}>
        <View
          style={{
            ...styles.row,
            ...styles.borderBottom,
            paddingBottom: 5,
          }}
        >
          <Text style={styles.col5}>DRUG NAME</Text>
          <Text style={styles.col4}>FREQUENCY</Text>
          <View style={styles.col4}>
            <Text>DURATION</Text>
            <Text style={{ fontSize: "8px", marginTop: 2, color: "#555" }}>
              From - To
            </Text>
          </View>
          <Text style={styles.col4}>INSTRUCTIONS</Text>
        </View>
        {(medicines || []).map((item, index) => {
          const medicine = item?.medicine || {};
          const freq = item?.dosageAndFrequency || {};
          const multiplePeriods = item?.schedules?.length > 1 ? item.schedules : null;
          const key = safe(item?._id?.$oid || item?._id || index);

          const drugName = (
            <Text style={{ ...styles.col5, textTransform: "capitalize" }}>
              <Text style={{ textTransform: "uppercase" }}>
                {medicine?.type ? `${safe(medicine.type)} ` : ""}
              </Text>
              {safe(medicine?.name)} {safe(medicine?.strength)}{" "}
              <Text style={{ textTransform: "uppercase" }}>
                {safe(medicine?.unit)}
              </Text>
            </Text>
          );

          const singlePeriodRange = !multiplePeriods ? getDateRange(item, item) : null;

          return (
          <View
            key={key}
            style={{
              ...styles.borderBottom,
              paddingTop: 5,
              paddingBottom: 5,
            }}
          >
            {!multiplePeriods ? (
              <View style={styles.row}>
                {drugName}
                <Text style={styles.col4}>
                  {safe(formatDosage(freq?.morning, freq?.unit))}-{safe(formatDosage(freq?.evening, freq?.unit))}-{safe(formatDosage(freq?.night, freq?.unit))}
                </Text>
                <View style={styles.col4}>
                  <Text>
                    {safe(item?.duration)} {safe(item?.unit)}
                  </Text>
                  <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: "8px", marginTop: 2 }}>
                    {singlePeriodRange.from} - {singlePeriodRange.to}
                  </Text>
                </View>
                <Text style={styles.col4}>{safe(item?.intake)}</Text>
              </View>
            ) : (
              <>
                {drugName}
                {multiplePeriods.map((period, pIdx) => {
                  const periodFreq = period?.dosageAndFrequency || {};
                  return (
                    <React.Fragment key={pIdx}>
                      <View
                        style={{
                          ...styles.row,
                          borderTop: pIdx > 0 ? "1px dashed #999" : "none",
                          paddingTop: pIdx > 0 ? 2 : 0,
                          marginTop: pIdx > 0 ? 2 : 0,
                        }}
                      >
                        <Text style={styles.col5}></Text>
                        <Text style={styles.col4}>
                          {safe(formatDosage(periodFreq?.morning, periodFreq?.unit))}-{safe(formatDosage(periodFreq?.evening, periodFreq?.unit))}-{safe(formatDosage(periodFreq?.night, periodFreq?.unit))}
                        </Text>
                        <View style={styles.col4}>
                          <Text>
                            {safe(period?.duration)} {safe(period?.unit)}
                          </Text>
                          <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: "8px", marginTop: 2 }}>
                            {(() => {
                              const { from, to } = getDateRange(period, item);
                              return `${from} - ${to}`;
                            })()}
                          </Text>
                        </View>
                        <Text style={styles.col4}>{safe(period?.intake)}</Text>
                      </View>
                      {period?.instructions && (
                        <Text style={{ fontSize: "8px", color: "#555", paddingLeft: "6px" }}>
                          instructions: {safe(period.instructions)}
                        </Text>
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
            {!multiplePeriods && (
              <Text style={{ paddingTop: 5 }}>
                instructions: {safe(item?.instructions)}
              </Text>
            )}
          </View>
        );
        })}
      </View>
    </React.Fragment>
  );
};

export default PrescriptionTable;
