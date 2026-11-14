import React from "react";
import { View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import { getMedicineFrequencyLabel, formatDosage } from "../../../../../helpers/prescriptionFrequency";

import RobotoHeavy from "../../../../../assets/fonts/Roboto-Black.ttf";
import Helvetica from "../../../../../assets/fonts/Helvetica-Neue-Bold.ttf";
import HelveticaNarrow from "../../../../../assets/fonts/Helvetica-Neue-Medium.ttf";
import HelveticaItalic from "../../../../../assets/fonts/Helvetica-Bold-Italic.ttf";
import Mukta from "../../../../../assets/fonts/Mukta-ExtraBold.ttf";
import RobotoItalic from "../../../../../assets/fonts/Roboto-BlackItalic.ttf";

// Font.register({
//   family: "Montserrat",
//   fonts: [
//     {
//       src: Montserrat,
//       fontWeight: "heavy",
//     },
//   ],
// });

Font.register({
  family: "Roboto Heavy",
  fonts: [
    {
      src: RobotoHeavy,
      // fontWeight: "heavy",
    },
  ],
});

Font.register({
  family: "Helvetica Neue",
  fonts: [
    {
      src: Helvetica,
      // fontWeight: "heavy",
    },
  ],
});

Font.register({
  family: "Roboto Italic",
  fonts: [
    {
      src: RobotoItalic,
      // fontWeight: "heavy",
    },
  ],
});

Font.register({
  family: "Helvetica Narrow",
  fonts: [
    {
      src: HelveticaNarrow,
      // fontWeight: "heavy",
    },
  ],
});

Font.register({
  family: "Helvetica Neue Italic",
  fonts: [
    {
      src: HelveticaItalic,
      fontWeight: 900,
    },
  ],
});

Font.register({
  family: "Mukta Bold",
  fonts: [
    {
      src: Mukta,
      fontWeight: 900,
    },
  ],
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 6,
  },
  tableBody: {
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
  col3: { flex: 1.2 },
  col4: {
    width: "24%",
  },
  col5: { flex: 3 },
  col6: { flex: 2.2 },
  col2: {
    width: "30%",
  },
  col1: { flex: 0.5, paddingLeft: 6, },
  fontBold: {
    fontFamily: "Helvetica Neue",
    fontSize: "11px",
    letterSpacing: "0.6px",
  },
  fontMd: {
    fontFamily: "Helvetica Narrow",
  },
  fontItalic: {
    fontFamily: "Helvetica Neue Italic",
  },
  fontSizeMd: {
    fontSize: "11px",
  },
  instr: {
    fontFamily: "Helvetica Neue",
    fontSize: "11px",
    letterSpacing: "0.6px",
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
  paddingTop5: {
    paddingTop: 5,
  },
  paddingBottom10: {
    paddingBottom: 10,
  },
  borderBottom: {
    borderBottom: "1px solid #1d1d1d",
  },
});

const PrescriptionTable = ({ medicines }) => {
  return (
    <React.Fragment>
      <View style={{ ...styles.fontSm, width: "100%" }}>
        <View
          style={{
            ...styles.row,
            ...styles.borderBottom,
            ...styles.tableHeader,
            ...styles.instr,
            // paddingBottom: 5,
          }}
        >
          <Text style={styles.col1}></Text>
          <Text style={styles.col5}>Medicine</Text>
          {/* <Text style={styles.col3}>Dose</Text> */}
          <View style={{ ...styles.col3, flexDirection: "column", alignItems: "center" }}>
            <Text style={{ fontFamily: "Helvetica Neue", fontSize: 11 }}>Dose</Text>

            <View style={{ flexDirection: "row", width: "100%" }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text>Mor</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text>Aft</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text>Eve</Text>
              </View>
            </View>
          </View>
          <Text style={{ ...styles.col6, textAlign: "right" }}>Timing - Freq. - Duration</Text>
          {/* <Text style={styles.col2}>Qty</Text> */}
        </View>
        <View style={{ ...styles.tableBody }}>
          {(medicines || []).map((item, idx) => {
            const periods = item?.schedules?.length > 1 ? item.schedules : [item];
            return (
            <View
              key={item._id}
              style={{
                ...styles.borderBottom,
                paddingTop: 5,
                paddingBottom: 5,
              }}
            >
              {periods.map((period, pIdx) => (
              <View
                style={{
                  ...styles.row,
                  borderTop: pIdx > 0 ? "1px dashed #999" : "none",
                  paddingTop: pIdx > 0 ? 2 : 0,
                  marginTop: pIdx > 0 ? 2 : 0,
                }}
                key={pIdx}
              >
                <Text style={{ ...styles.col1, ...styles.fontBold }}>
                  {pIdx === 0 ? idx + 1 : ""}
                </Text>
                <Text style={{ ...styles.col5, ...styles.fontBold }}>
                  {pIdx === 0 && (
                    <>
                      <Text style={{ textTransform: "uppercase" }}>
                        {item.medicine.type ? `${item.medicine.type} ` : ""}
                      </Text>{" "}
                      {item.medicine?.name} {item.medicine.strength || ""}{" "}
                    </>
                  )}
                  {/* <Text style={{ textTransform: "uppercase" }}>
                    {item.medicine.unit || ""}
                  </Text> */}
                </Text>
                <View style={{ ...styles.col3, flexDirection: "row" }}>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text>{formatDosage(period.dosageAndFrequency?.morning, period.dosageAndFrequency?.unit) || "-"}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text>{formatDosage(period.dosageAndFrequency?.evening, period.dosageAndFrequency?.unit) || "-"}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text>{formatDosage(period.dosageAndFrequency?.night, period.dosageAndFrequency?.unit) || "-"}</Text>
                  </View>
                </View>

                <View style={{ ...styles.col6, alignItems: "flex-end", marginRight: "10px" }}>
                  <Text
                    style={{
                      ...styles.fontMd,
                      // ...styles.fontSizeMd,
                    }}
                  >
                    {period.intake}{" - "}{getMedicineFrequencyLabel(period)}{" - "}{period.duration} {period.unit}
                  </Text>
                </View>

                {/* <Text style={{ ...styles.col2, ...styles.fontMd }}>
                  {item.intake}
                </Text> */}
              </View>
              ))}
              {/* <View
                style={{
                  ...styles.row,
                  ...styles.paddingTop5,
                  ...styles.mrgnLeft10,
                }}
              >
                <Text style={styles.fontItalic}>Composition: </Text>
                <Text>{item.composition || "Composition goes here"}</Text>
              </View> */}
              {/* <View
                style={{
                  ...styles.row,
                  ...styles.paddingTop5,
                  ...styles.mrgnLeft10,
                }}
              >
                {/* <Text style={{ ...styles.fontItalic }}>Timing: </Text>
                <Text>
                  {item.intake || ""} {item.unit || ""}
                </Text>
              </View> */}
              {item.instructions && (
                <View
                  style={{
                    ...styles.row,
                    ...styles.paddingTop5,
                    ...styles.mrgnLeft10,
                  }}
                >
                  <Text style={{ ...styles.fontItalic }}>Instruction: </Text>
                  <Text>{item.instructions || ""}</Text>
                </View>
              )}
              {/* <View
                style={{
                  ...styles.row,
                  ...styles.paddingTop5,
                  ...styles.mrgnLeft10,
                }}
              >
                <Text style={{ ...styles.fontItalic, ...styles.fontSizeMd }}>
                  Note:{" "}
                </Text>
                <Text>{item.intake || "Intake"}</Text>
              </View> */}
            </View>
            );
          })}
        </View>
      </View>
    </React.Fragment>
  );
};

export default PrescriptionTable;
