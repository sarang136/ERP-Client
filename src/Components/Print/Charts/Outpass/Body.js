import { View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import React from "react";
import moment from "moment";

import TroiDevanagariHindi from "../../../../assets/fonts/TiroDevanagariHindi-Regular.ttf";
import TroiDevanagariMarathi from "../../../../assets/fonts/TiroDevanagariMarathi-Regular.ttf";
import DoctorSignature from "../DoctorSignature";
import { capitalizeWords } from "../../../../utils/toCapitalize";

Font.register({
  family: "Hindi",
  fonts: [
    {
      src: TroiDevanagariHindi,
    },
  ],
});

Font.register({
  family: "Marathi",
  fonts: [
    {
      src: TroiDevanagariMarathi,
    },
  ],
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  fontMarathi: {
    fontFamily: "Marathi",
  },
  col6: {
    width: "33.3%",
  },
  col7: {
    width: "70%",
  },
  mrgnTop10: {
    marginTop: 10,
  },
  mrgnBottom10: {
    marginBottom: 20,
  },
  preLine: {
    whiteSpace: "pre-line",
  },
});

const formatDate = (value) =>
  value ? moment(value).format("DD MMM, YYYY hh:mm A") : "";

const OutpassBody = ({ chart, doctor }) => {
  return (
    <React.Fragment>
      <View
        style={{
          ...styles.mrgnTop10,
          ...styles.mrgnBottom10,
          ...styles.fontMarathi,
        }}
      >
        <View>
          <Text style={{ fontSize: "13px" }}>Outpass</Text>
        </View>
        <View style={styles.mrgnTop10}>
          {chart?.fromDate && (
            <View style={{ ...styles.row, ...styles.mrgnTop10 }}>
              <Text style={styles.col6}>From Date:</Text>
              <Text style={{ ...styles.preLine, ...styles.col7 }}>
                {formatDate(chart.fromDate)}
              </Text>
            </View>
          )}
          {chart?.toDate && (
            <View style={{ ...styles.row, ...styles.mrgnTop10 }}>
              <Text style={styles.col6}>To Date:</Text>
              <Text style={{ ...styles.preLine, ...styles.col7 }}>
                {formatDate(chart.toDate)}
              </Text>
            </View>
          )}
          {chart?.note && (
            <View style={{ ...styles.row, ...styles.mrgnTop10 }}>
              <Text style={styles.col6}>Note:</Text>
              <Text style={{ ...styles.preLine, ...styles.col7 }}>
                {capitalizeWords(chart.note || "")}
              </Text>
            </View>
          )}
        </View>
      </View>
      <DoctorSignature doctor={doctor} />
    </React.Fragment>
  );
};

export default OutpassBody;
