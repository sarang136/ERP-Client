import React from "react";
import { StyleSheet, View, Text, Font } from "@react-pdf/renderer";
import Roboto from "../../../../assets/fonts/Roboto-Bold.ttf";

//components
import MseAtDischarge from "./Components/MseAtDischarge";
import MseAtAddmission from "./Components/MseAtAddmission";
import PrescriptionTable from "../OPD/Prescription/Table";

//medicines table
// import PrescriptionTable from "../Prescription/Table";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: Roboto,
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  body: {
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
    // borderTop: '1px solid black',
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  blackCircle: {
    height: "5px",
    width: "5px",
    backgroundColor: "black",
    borderRadius: "3px",
    marginRight: 5,
  },
  preText: {
    lineHeight: 1.3,
    paddingLeft: 5,
  },
  marginBottom: {
    marginBottom: 20,
  },
  paddingLeft5: {
    paddingLeft: 5,
  },
  fontSize13: {
    fontSize: "13px",
    fontFamily: "Roboto",
    fontWeight: "bold",
    paddingBottom: 7,
  },
  checkBlock: {
    width: "100%",
    flexDirection: "row",
  },
  w25: {
    width: "25%",
    marginBottom: 5,
  },
  w30: {
    width: "30%",
  },
  w5: {
    width: "5%",
    marginBottom: 5,
  },
  w70: {
    width: "70%",
    marginBottom: 5,
  },
  marginBottom5: {
    marginBottom: 5,
  },
  textCenter: {
    textAlign: "center",
  },
});

const clean = (value) => {
  if (value == null) return "";

  let str = String(value)
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\u00AD/g, "")
    .trim();

  str = str.replace(/\S{40,}/g, (word) => word.replace(/(.{40})/g, "$1\u200B"));

  return str;
};

const SummaryBody = ({ chart, patient }) => {
  const data = chart?.dischargeSummary ?? {};
  // const splitTextIntoLines = (text) => {
  //   if (typeof text !== "string" || !text.trim()) return [];
  //   return text
  //     .trim()
  //     .split(/\r?\n/)
  //     .map((line) => line.trim())
  //     .filter((line) => line);
  // };
  return (
    <React.Fragment>
      <View style={styles.body} wrap>
        <Text
          style={{
            ...styles.fontSize13,
            ...styles.marginBottom5,
            ...styles.textCenter,
          }}
        >
          Discharge Summary
        </Text>
        {data?.diagnosis && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>Diagnosis:</Text>
            <Text style={styles.preText}>
              {clean(data?.diagnosis)?.trim() || ""}
            </Text>
          </View>
        )}
        {data?.presentingSymptoms && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>Presenting Symptoms:</Text>
            <Text style={styles.preText}>
              {clean(data?.presentingSymptoms) || ""}
            </Text>
          </View>
        )}
        <MseAtAddmission data={data} styles={styles} />
        {data?.pastHistory && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>PAST HISTORY:</Text>
            <Text style={styles.preText}>{clean(data?.pastHistory) || ""}</Text>
          </View>
        )}
        {data?.medicalHistory && (
          <View style={styles.marginBottom} break>
            <Text style={styles.fontSize13}>MEDICAL HISTORY:</Text>
            <Text style={styles.preText}>
              {clean(data?.medicalHistory) || ""}
            </Text>
          </View>
        )}
        {data?.familyHistory && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>RELEVANT FAMILY HISTORY :</Text>
            <Text style={styles.preText}>
              {clean(data?.familyHistory) || ""}
            </Text>
          </View>
        )}
        {(data?.personalHistory?.smoking ||
          data?.personalHistory?.chewingTobacco ||
          data?.personalHistory?.alcohol) && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>PERSONAL HISTORY:</Text>
            {data?.personalHistory?.smoking && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Smoking</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.personalHistory?.smoking) || ""}
                </Text>
              </View>
            )}
            {data?.personalHistory?.chewingTobacco && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Chewing Tobacco</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.personalHistory?.chewingTobacco) || ""}
                </Text>
              </View>
            )}
            {data?.personalHistory?.alcohol && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Alcohol</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.personalHistory?.alcohol) || ""}
                </Text>
              </View>
            )}
          </View>
        )}
        {!!(
          data?.physicalExamination?.temprature ||
          data?.physicalExamination?.pulse ||
          data?.physicalExamination?.bp ||
          data?.physicalExamination?.cvs ||
          data?.physicalExamination?.rs ||
          data?.physicalExamination?.abdomen ||
          data?.physicalExamination?.cns ||
          data?.physicalExamination?.others
        ) && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>PHYSICAL EXAMINATION:</Text>
            {!!data?.physicalExamination?.temprature && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Temprature</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.temprature) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.pulse && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>pulse</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.pulse) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.bp && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>B.P</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.bp) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.cvs && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>CVS</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.cvs) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.rs && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>RS</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.rs) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.abdomen && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Abdomen</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.abdomen) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.cns && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>CNS</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.cns) || ""}
                </Text>
              </View>
            )}
            {!!data?.physicalExamination?.others && (
              <View style={{ ...styles.checkBlock, ...styles.paddingLeft5 }}>
                <Text style={styles.w25}>Others</Text>
                <Text style={styles.w5}>:</Text>
                <Text style={{ ...styles.w70 }}>
                  {clean(data?.physicalExamination?.others) || ""}
                </Text>
              </View>
            )}
          </View>
        )}
        {!!data?.investigation && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>
              INVESTIGATIONS : (all reports attached with Discharge Card)
            </Text>
            <Text style={styles.preText}>
              {clean(data?.investigation) || ""}
            </Text>
          </View>
        )}
        {!!data?.discussion && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>DISCUSSION / WARD MANAGEMENT:</Text>
            <Text style={styles.preText}>{clean(data?.discussion) || ""}</Text>
          </View>
        )}
        {data?.treatment?.length && data.treatment instanceof Array ? (
          <>
            <View>
              <Text style={styles.fontSize13}>GIVEN TREATMENTS:</Text>
            </View>
            <View style={{ marginTop: 10, marginBottom: 15 }}>
              <PrescriptionTable medicines={data.treatment} blankIfNoDate />
            </View>
          </>
        ) : data?.treatment ? (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>GIVEN TREATMENTS:</Text>
            <Text style={styles.preText}>{clean(data?.treatment) || ""}</Text>
          </View>
        ) : null}
        {!!data?.refernces && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>References:</Text>
            <Text style={styles.preText}>{clean(data?.refernces) || ""}</Text>
          </View>
        )}
        {!!data?.modifiedTreatment && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>
              Modified ECTs / Ketamine / Other Treatment:
            </Text>
            <Text style={styles.preText}>
              {clean(data?.modifiedTreatment) || ""}
            </Text>
          </View>
        )}
        {!!data?.deportAdministered && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>LA / Depot Administered:</Text>
            <Text style={styles.preText}>
              {clean(data?.deportAdministered) || ""}
            </Text>
          </View>
        )}
        <MseAtDischarge data={data} styles={styles} />
        {!!data?.patientStatus && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>
              PATIENT CONDITION / STATUS AT THE TIME OF DISCHARGE:
            </Text>
            <Text wrap={true} style={styles.preText}>
              {clean(data?.patientStatus) || ""}
            </Text>
          </View>
        )}
        {!!(data?.medicine?.length || data?.followUp || data?.note) && (
          <View>
            <Text style={styles.fontSize13}>ADVISE ON DISCHARGE:</Text>
          </View>
        )}
        {Array.isArray(data?.medicine) && data.medicine.length > 0 && (
          <View style={{ marginTop: 10, marginBottom: 15 }}>
            <PrescriptionTable medicines={data?.medicine || []} blankIfNoDate />
          </View>
        )}
        {/* {typeof data?.followUp === "string" && data?.followUp.trim() && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>Follow-Up:</Text>
            <Text style={styles.preText}>
              {data.followUp
                .trim()
                .split(/\r?\n|(?<=\.)\s+/)
                .map((line, idx) => (
                  <Text key={idx}>{line.trim() + "\n"}</Text>
                ))}
            </Text>
          </View>
        )} */}
        {typeof data?.followUp === "string" && data?.followUp.trim() && (
          <View style={styles.marginBottom}>
            <Text style={styles.fontSize13}>Follow-Up:</Text>
            <View style={styles.paddingLeft5}>
              {clean(data.followUp)
                ?.trim()
                .split(/\r?\n|[.]\s+/)
                .map((line, idx) => (
                  <Text key={idx} style={styles.preText}>
                    {line.trim()}
                  </Text>
                ))}
            </View>
          </View>
        )}
        {/* {typeof data?.note === "string" && data?.note.trim() && (
          <View style={styles.marginBottom} wrap={false}>
            <Text style={styles.fontSize13}>Note:</Text>
            <Text style={styles.preText}>
              {data.note
                .trim()
                .split(/\r?\n|(?<=\.)\s+/)
                .map((line, idx) => (
                  <Text key={idx}>{line.trim() + "\n"}</Text>
                ))}
            </Text>
          </View>
        )} */}
        {typeof data?.note === "string" && data?.note.trim() && (
          <View style={styles.marginBottom} wrap={false}>
            <Text style={styles.fontSize13}>Note:</Text>
            <Text style={styles.preText}>{clean(data.note)?.trim()}</Text>
          </View>
        )}
      </View>
    </React.Fragment>
  );
};

export default SummaryBody;
