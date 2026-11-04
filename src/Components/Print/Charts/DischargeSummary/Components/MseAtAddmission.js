// import React from "react";
// import { View, Text } from "@react-pdf/renderer";

// const MseAtAddmission = (props) => {
//   const data = props?.data ?? {};
//   return (
//     <React.Fragment>
//       {(data?.mseAddmission?.appearance ||
//         data?.mseAddmission?.ecc ||
//         data?.mseAddmission?.speech ||
//         data?.mseAddmission?.mood ||
//         data?.mseAddmission?.affect ||
//         data?.mseAddmission?.thoughts ||
//         data?.mseAddmission?.perception ||
//         data?.mseAddmission?.memory ||
//         data?.mseAddmission?.abstractThinking ||
//         data?.mseAddmission?.socialJudgment ||
//         data?.mseAddmission?.insight) && (
//           <View style={props?.styles.marginBottom}>
//             {/* wrap={false} */}
//             <Text style={props?.styles.fontSize13}>MSE at Addmission</Text>
//             {data?.mseAddmission?.appearance && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Appearance and Behavior-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.appearance || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.ecc && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>ECC / RAPPORT-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.ecc || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.speech && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Speech-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.speech || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.mood && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Mood-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.mood || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.affect && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Affect-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.affect || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.thoughts && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Thoughts-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.thoughts || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.perception && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Perception-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.perception || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.memory && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Memory-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.memory || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.abstractThinking && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Abstract Thinking-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.abstractThinking || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.socialJudgment && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Social Judgment-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.socialJudgment || ""}
//                 </Text>
//               </View>
//             )}
//             {data?.mseAddmission?.insight && (
//               <View
//                 style={{
//                   ...props?.styles.checkBlock,
//                   ...props?.styles.paddingLeft5,
//                 }}
//                 wrap={false}
//               >
//                 <View style={{ ...props?.styles.w30, ...props?.styles.row }}>
//                   <Text style={props?.styles.blackCircle}></Text>
//                   <Text>Insight-</Text>
//                 </View>
//                 <Text style={{ ...props?.styles.w70 }}>
//                   {data?.mseAddmission?.insight || ""}
//                 </Text>
//               </View>
//             )}
//           </View>
//         )}
//     </React.Fragment>
//   );
// };

// export default MseAtAddmission;

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { MSE_FIELDS } from "./MSE_FIELDS";

const MseAtAddmission = ({ data, styles }) => {
  const mse = data?.mseAddmission ?? {};
  const hasAnyData = MSE_FIELDS.some((field) => mse[field.key]);

  if (!hasAnyData) return null;

  return (
    <View style={{ ...styles.marginBottom, marginTop: 15 }}>
      <Text style={styles.fontSize13}>MSE at Admission</Text>
      {MSE_FIELDS.map(({ key, label }) =>
        mse[key] ? (
          <View key={key} style={{ marginBottom: 20, paddingLeft: 5 }}>
            <Text style={styles.preText}>{`\u2022 ${label}- ${mse[key]}`}</Text>
          </View>
        ) : null,
      )}
    </View>
  );
};

export default MseAtAddmission;
