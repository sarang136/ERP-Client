import React from "react";
import { View, Text, Font, StyleSheet } from "@react-pdf/renderer";
import Roboto from "../../../assets/fonts/Roboto-Bold.ttf";
import { differenceInYears, format } from "date-fns";
import { capitalizeWords } from "../../../utils/toCapitalize";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: Roboto,
      fontWeight: "heavy",
    },
  ],
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  justifyBetween: {
    justifyContent: "space-between",
  },
  col6: {
    width: "50%",
  },
  padding5: {
    paddingTop: 5,
  },
  paddingBottom3: {
    paddingTop: 3,
  },
  paddingTop3: {
    paddingTop: 3,
  },
  padding10: {
    paddingTop: 10,
  },
  paddingRight5: {
    paddingRight: 5,
  },
  fontHeavy: {
    fontFamily: "Roboto",
    fontWeight: "heavy",
    fontSize: "12px",
  },
  textRight: {
    textAlign: "right",
  },
  fontMd: {
    fontSize: "10px",
  },
  textCaps: {
    textTransform: "capitalize",
  },
});

const border = "1px solid #000";
const Header = ({ chart, center, patient, doctor, admission }) => {
  const chkDoctor =
    doctor?.name ||
    doctor?.degrees ||
    doctor?.specializations ||
    doctor?.regNumber;

  const age = () =>
    differenceInYears(new Date(), new Date(patient?.dateOfBirth));
  return (
    <React.Fragment>
      <View>
        <View
          style={{
            ...styles.row,
            ...styles.justifyBetween,
            alignItems: "center",
          }}
        >
          <View style={styles.col6}>
            <Text style={{ fontFamily: "Roboto", fontSize: "15px" }}>
              {center?.name || "JAGRUTI REHABILITATION CENTRE"}
            </Text>
          </View>
          <View style={styles.col6}>
            <Text style={{ whiteSpace: "pre-line" }}>
              {center?.address || "center address goes here"}
            </Text>
            <Text style={styles.padding5}>
              {center?.numbers || "+91 77458 80088 / 98222 07761"}
            </Text>
            <Text style={styles.padding5}>www.jagrutirehab.org</Text>
          </View>
        </View>
        <View
          style={{
            ...styles.row,
            ...styles.justifyBetween,
            borderTop: border,
            marginTop: 20,
            paddingTop: 5,
          }}
        >
          <Text style={styles.textCaps}>
            Created By: {capitalizeWords(chart.author?.name) || ""}
          </Text>
          <Text>
            On:{" "}
            {chart.date
              ? format(new Date(chart.date), "dd MMM yyyy hh:mm a")
              : ""}
          </Text>
        </View>
        {/* <View style={{ textAlign: 'center', marginTop: 20 }}>
          <Text>Phone: +917977232565</Text>
        </View> */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 5,
            paddingBottom: 10,
            borderBottom: border,
            borderTop: border,
            paddingTop: 5,
            marginBottom: 10,
          }}
        >
          {chkDoctor && (
            <View style={{ width: "50%" }}>
              <View style={{ ...styles.row }}>
                {doctor?.name && (
                  <Text
                    style={{
                      ...styles.fontHeavy,
                      ...styles.paddingBottom3,
                      ...styles.paddingRight5,
                      ...styles.textCaps,
                    }}
                  >
                    Dr. {capitalizeWords(doctor.name) || ""}
                  </Text>
                )}
                {doctor?.degrees && (
                  <Text
                    style={{
                      ...styles.fontMd,
                      ...styles.paddingBottom3,
                      ...styles.textCaps,
                    }}
                  >
                    ({capitalizeWords(doctor.degrees) || ""})
                  </Text>
                )}
              </View>
              {doctor?.specializations && (
                <Text style={{ ...styles.fontMd, ...styles.paddingTop3 }}>
                  {capitalizeWords(doctor.specializations) || ""}
                </Text>
              )}
              {doctor?.regNumber && (
                <Text style={{ ...styles.fontMd, ...styles.paddingTop3 }}>
                  Reg No. - {doctor.regNumber || ""}
                </Text>
              )}
            </View>
          )}
          <View
            style={
              chkDoctor
                ? { width: "50%", ...styles.textRight }
                : { width: "50%" }
            }
          >
            <Text style={{ ...styles.fontMd, ...styles.textCaps }}>
              Patient:{" "}
              {/* {`${capitalizeWords(patient?.name)} - ${patient?.id?.prefix}${
                patient?.id?.value
              }` || ""} */}
              {`${patient?.name} - ${patient?.id?.prefix}${patient?.id?.value}` ||
                ""}
            </Text>
            {admission?.Ipdnum ? (
              <Text
                style={{
                  ...styles.fontMd,
                  ...styles.padding5,
                  ...styles.textCaps,
                }}
              >
                IPD Num: {admission?.Ipdnum}
              </Text>
            ) : (
              ""
            )}
            <Text
              style={{
                ...styles.fontMd,
                ...styles.padding5,
                ...styles.textCaps,
              }}
            >
              {patient?.phoneNumber && <>Ph: {patient?.phoneNumber}</>}
              {patient?.email && <>, Email: {patient?.email}</>}
            </Text>
            {patient?.address && (
              <Text
                style={{
                  ...styles.fontMd,
                  ...styles.paddingTop3,
                  ...styles.textCaps,
                }}
              >
                {/* Address: {capitalizeWords(patient?.address) || ""} */}
                Address: {patient?.address || ""}
              </Text>
            )}
            {patient?.gender && (
              <Text style={styles.paddingTop3}>{patient?.gender},</Text>
            )}
            {patient?.dateOfBirth && (
              <Text style={{ ...styles.paddingTop3 }}>{age()}</Text>
            )}
          </View>
        </View>
        <View
          style={{
            paddingBottom: 10,
            borderBottom: border,
            ...styles.row,
            ...styles.justifyBetween,
          }}
        >
          <Text>
            {admission?.addmissionDate && (
              <>
                Date of Admission:{" "}
                {format(new Date(admission?.addmissionDate), "d MMM y")}
              </>
            )}
          </Text>
          <Text>
            {(admission?.dischargeDate ||
              chart?.dischargeSummary?.dischargeDate) && (
              <>
                Date of Discharge:{" "}
                {format(
                  new Date(
                    admission?.dischargeDate ||
                      chart?.dischargeSummary?.dischargeDate
                  ),
                  "d MMM y"
                )}
              </>
            )}
          </Text>
        </View>
      </View>
    </React.Fragment>
  );
};

export default Header;
