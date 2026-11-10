import React from "react";
import { View, Text, Font } from "@react-pdf/renderer";
import Roboto from "../../../../assets/fonts/Roboto-Bold.ttf";
import { differenceInYears } from "date-fns";
// import { differenceInYears } from "date-fns";

//table
// import PrescriptionTable from "./Table";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: Roboto,
      fontWeight: "heavy",
    },
  ],
});

const formatDate = (isoDateStr) => {
  if (!isoDateStr) return "N/A";
  const date = new Date(isoDateStr);

  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const year = date.getUTCFullYear();
  // const hour = date.getHours();
  // const minute = date.getMinutes();

  return `${day} ${month} ${year}`;
};

// Missing values, and the literal strings "undefined"/"null" (stored when a
// missing field was serialised through FormData on edit), render as empty.
const clean = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "undefined" || trimmed === "null" ? "" : trimmed;
};

const DetailInfo = ({ chart, patient, data: rawData, styles, admission }) => {
  // The detailAdmission sub-object is absent on records saved without any of
  // its fields (e.g. created from the mobile app).
  const source = rawData || {};
  // The chart's own value wins. The patient's registration record fills in
  // only when the chart value is missing, blank or the literal "undefined".
  const withFallback = (chartValue, patientValue) =>
    clean(chartValue) || clean(patientValue);
  const data = {
    doctorConsultant: clean(source.doctorConsultant),
    religion: withFallback(source.religion, patient?.religion),
    maritalStatus: withFallback(source.maritalStatus, patient?.maritalstatus),
    occupation: withFallback(source.occupation, patient?.occupation),
    education: withFallback(source.education, patient?.education),
    // The chart's "address" is the area type (Urban / Semi-urban / Rural),
    // so it maps to patient.areatype, not the patient's street address.
    address: withFallback(source.address, patient?.areatype),
    referral: clean(source.referral),
    provisionalDiagnosis: clean(source.provisionalDiagnosis),
    revisedDiagnosis: clean(source.revisedDiagnosis),
  };

  // const age = () =>
  //   differenceInYears(new Date(), new Date(patient?.dateOfBirth));

  const age = () => {
    if (patient?.age) return patient.age;

    if (patient?.dateOfBirth) {
      return differenceInYears(new Date(), new Date(patient.dateOfBirth));
    }

    return null;
  };

  console.log("chart.id:", chart.id);
  console.log("chart.id.detailAdmission:", chart.id?.detailAdmission);

  const admissionDate =
    admission?.addmissionDate || patient?.addmission?.addmissionDate;

  console.log("patient", patient);
  const Row = ({ label, value }) => (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text
        style={{
          ...styles.fontMd,
          textTransform: "capitalize",
          width: 120,
        }}
      >
        {label}
      </Text>
      <Text style={{ ...styles.fontMd, flex: 1, textTransform: "capitalize" }}>
        {value}
      </Text>
    </View>
  );

  const formatDiagnosisValue = (value) => {
    if (!value) return "";

    // If array
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (!item) return "";

          // new format → object with code
          if (typeof item === "object" && item.code) {
            return item.code;
          }

          // weird old object like {0:"N",1:"A",2:"A"}
          if (typeof item === "object") {
            const chars = Object.keys(item)
              .filter((k) => !isNaN(k))
              .sort((a, b) => a - b)
              .map((k) => item[k]);

            return chars.length ? chars.join("") : "";
          }

          // pure string
          if (typeof item === "string") {
            return item;
          }

          return "";
        })
        .filter(Boolean)
        .join(", ");
    }

    // If already string
    if (typeof value === "string") {
      return value;
    }

    return "";
  };
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <View
        style={{
          width: "60%",
          ...styles.column,
          ...styles.mrgnTop10,
          ...styles.mrgnBottom10,
        }}
      >
        {/* <Row
        label="age:"
        value={data.age.toUpperCase()}
      /> */}
        {admission?.Ipdnum ? (
          <Row label="IPD Num:" value={admission?.Ipdnum} />
        ) : (
          ""
        )}

        <Row
          label="doctor consultant:"
          value={String(data.doctorConsultant).toUpperCase()}
        />
        <Row label="name:" value={patient?.name} />
        {data.religion && <Row label="religion:" value={data.religion} />}
        {age() !== null && <Row label="age:" value={age()} />}
        {/* {age() && <Row label="age:" value={age()} />} */}
        {patient?.gender && (
          <Row label="gender:" value={patient.gender.toLowerCase()} />
        )}
        {data.maritalStatus && (
          <Row label="marital status:" value={data.maritalStatus} />
        )}
        {patient?.occupation && (
          <Row label="occupation:" value={patient?.occupation} />
        )}
        {patient?.education && (
          <Row label="education:" value={patient?.education} />
        )}
        {patient?.address && <Row label="address:" value={patient?.address} />}
        {patient?.referredBy?.doctorName && (
          <Row
            label="source of referral:"
            value={patient?.referredBy?.doctorName}
          />
        )}
        {data.provisionalDiagnosis && (
          <Row
            label="provisional diagnosis:"
            value={formatDiagnosisValue(data.provisionalDiagnosis)}
          />
        )}

        {data.revisedDiagnosis && (
          <Row
            label="revised diagnosis:"
            value={formatDiagnosisValue(data.revisedDiagnosis)}
          />
        )}
      </View>
      <View
        style={{ width: "35%", alignItems: "flex-end", ...styles.mrgnTop10 }}
      >
        {admissionDate && (
          <Text>Admission Date: {formatDate(admissionDate)}</Text>
        )}
      </View>
    </View>
  );
};

export default DetailInfo;
