// import React, { useEffect, useMemo, useState } from "react";
// import PropTypes from "prop-types";
// import {
//   Form,
//   Row,
//   Col,
//   Card,
//   CardBody,
//   Input,
//   Button,
//   CardHeader,
// } from "reactstrap";
// import FileCard from "../../../Components/Common/FileCard";
// import Divider from "../../../Components/Common/Divider";
// import DeleteModal from "../../../Components/Common/DeleteModal";
// import { FilePond, registerPlugin } from "react-filepond";
// import "filepond/dist/filepond.min.css";
// import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
// import FilePondPluginImagePreview from "filepond-plugin-image-preview";
// import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
// import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
// import * as Yup from "yup";
// import { useFormik } from "formik";
// import {
//   COUNSELLING_NOTE,
//   counsellingNoteFields,
// } from "../../../Components/constants/patient";
// import { connect, useDispatch } from "react-redux";
// import {
//   createEditChart,
//   removeCounsellingNoteFile,
//   updateCounsellingNote,
//   addCounsellingNote,
// } from "../../../store/actions";
// import PreviewFile from "../../../Components/Common/PreviewFile";
// import axios from "axios";
// import {
//   addGeneralCounsellingNote,
//   fetchCounsellingNote,
// } from "../../../store/features/chart/chartSlice";
// import { format } from "date-fns";
// import { useRef } from "react";
// import AudioRecorder from "./AaudioRecorder";

// registerPlugin(
//   FilePondPluginImageExifOrientation,
//   FilePondPluginImagePreview,
//   FilePondPluginFileValidateType
// );

// const UploadedFiles = ({ id, chartId, files, appointment }) => {
//   const dispatch = useDispatch();
//   const [file, setFile] = useState({ img: null, isOpen: false });
//   const [deleteFile, setDeleteFile] = useState({ img: null, isOpen: false });

//   const deleteFilePermanently = () => {
//     dispatch(
//       removeCounsellingNoteFile({
//         id,
//         chartId,
//         fileId: deleteFile.img._id,
//         appointment,
//       })
//     );
//     setDeleteFile({ img: null, isOpen: false });
//   };

//   return (
//     <Row className="row-gap-3">
//       <Col xs={12}>
//         <div className="d-flex align-items-center gap-3">
//           <h6 className="display-6 fs-5 text-nowrap">Uploaded Files</h6>
//           <Divider />
//         </div>
//       </Col>
//       {(files || []).map((file, id) => (
//         <Col key={id} xs={12} md={4}>
//           <FileCard
//             file={file}
//             showDeleteButton
//             onDelete={() => setDeleteFile({ img: file, isOpen: true })}
//             onPreview={() => setFile({ img: file, isOpen: true })}
//           />
//         </Col>
//       ))}
//       <PreviewFile
//         file={file.img}
//         isOpen={file.isOpen}
//         toggle={() => setFile({ img: null, isOpen: false })}
//       />
//       <DeleteModal
//         onDeleteClick={deleteFilePermanently}
//         onCloseClick={() => setDeleteFile({ img: null, isOpen: false })}
//         show={deleteFile.isOpen}
//       />
//     </Row>
//   );
// };

// const CounsellingNote = ({
//   author,
//   patient,
//   chartDate,
//   editChartData,
//   appointment,
//   populatePreviousAppointment = false,
//   shouldPrintAfterSave = false,
//   type,
//   patientLatestCounsellingNote,
//   //   onSubmitClinicalForm,
// }) => {
//   const dispatch = useDispatch();
//   const [files, setFiles] = useState([]);
//   const [audioFile, setAudioFile] = useState(null);
//   const audioFinalizeRef = useRef(null);
//   const [fetchedNote, setFetchedNote] = useState(null);

//   const editCounsellingNote = editChartData?.counsellingNote;

//   // useEffect(() => {
//   //   const fetchCounsellingNote = async () => {
//   //     try {
//   //       const id = appointment?.patient?._id || patient?._id;
//   //       if (!id || editCounsellingNote) return;

//   //       const response = await axios.get(`/chart/counselling-note`, {
//   //         params: { id },
//   //       });

//   //       const counsellingNote = response?.payload?.pay;
//   //       setFetchedNote(counsellingNote || null);
//   //     } catch (error) {
//   //       setFetchedNote(null);
//   //     }
//   //   };

//   //   fetchCounsellingNote();
//   // }, [appointment, patient, populatePreviousAppointment, editCounsellingNote]);

//   const noteSource = editCounsellingNote || fetchedNote;

//   const onSubmitClinicalForm = (
//     values,
//     files,
//     editChartData,
//     editClinicalNote
//   ) => {
//     const {
//       author,
//       patient,
//       center,
//       centerAddress,
//       addmission,
//       chart,
//       type,
//       date,
//       conclusion,
//       objective,
//       shortTermGoals,
//       longTermGoals,
//       notes,
//       homework,
//       reviewPreviousTask,
//       nextEndGoal,
//       nextSessionDate,
//     } = values;
//     const formData = new FormData();
//     formData.append("author", author);
//     formData.append("patient", patient);
//     formData.append("center", center);
//     formData.append("centerAddress", centerAddress);
//     formData.append("addmission", addmission);
//     formData.append("chart", chart);
//     formData.append("type", type);
//     formData.append("date", date);
//     formData.append("conclusion", conclusion);
//     formData.append("objective", objective);
//     formData.append("shortTermGoals", shortTermGoals);
//     formData.append("longTermGoals", longTermGoals);
//     formData.append("notes", notes);
//     formData.append("homework", homework);
//     formData.append("reviewPreviousTask", reviewPreviousTask);
//     formData.append("nextEndGoal", nextEndGoal);
//     formData.append("nextSessionDate", nextSessionDate);
//     // files.forEach((file) => formData.append("file", file.file));
//     files.forEach((file) => {
//       const actualFile = file.file || file;
//       formData.append("file", actualFile);
//     });

//     if (editClinicalNote) {
//       formData.append("id", editChartData._id);
//       formData.append("chartId", editClinicalNote._id);
//       dispatch(updateCounsellingNote(formData));
//     } else if (type === "GENERAL") {
//       dispatch(addGeneralCounsellingNote(formData));
//     } else {
//       dispatch(addCounsellingNote(formData));
//     }
//   };

//   const validation = useFormik({
//     enableReinitialize: true,
//     initialValues: {
//       author: author._id,
//       patient: patient._id,
//       center: patient.center._id || patient.center,
//       centerAddress: patient.center.title,
//       appointment: appointment?._id,
//       addmission: patient.addmission?._id,
//       chart: COUNSELLING_NOTE,
//       conclusion: noteSource?.conclusion || "",
//       objective: noteSource?.objective || "",
//       shortTermGoals: noteSource?.shortTermGoals || "",
//       longTermGoals: noteSource?.longTermGoals || "",
//       notes: noteSource?.notes || "",
//       homework: noteSource?.homework || "",
//       reviewPreviousTask: noteSource?.reviewPreviousTask || "",
//       nextEndGoal: noteSource?.nextEndGoal || "",
//       nextSessionDate: noteSource?.nextSessionDate
//         ? format(new Date(noteSource?.nextSessionDate), "yyyy-MM-dd")
//         : "",
//       type,
//       date: chartDate,
//       shouldPrintAfterSave,
//     },
//     validationSchema: Yup.object({}),
//     // onSubmit: (values) => {
//     //   onSubmitClinicalForm(values, files, editChartData, editCounsellingNote);
//     // },
//     // onSubmit: async (values) => {
//     //   const allFiles = [...files];

//     //   // finalize recording if exists
//     //   if (audioFinalizeRef.current) {
//     //     const finalAudio = await audioFinalizeRef.current();
//     //     if (finalAudio) allFiles.push(finalAudio);
//     //   }

//     //   // fallback
//     //   if (audioFile && !audioFinalizeRef.current) {
//     //     allFiles.push(audioFile);
//     //   }

//     //   onSubmitClinicalForm(
//     //     values,
//     //     allFiles,
//     //     editChartData,
//     //     editCounsellingNote
//     //   );
//     // },
//     onSubmit: async (values) => {
//       const allFiles = [...files];

//       if (!editCounsellingNote) {
//         // finalize recording if exists
//         if (audioFinalizeRef.current) {
//           const finalAudio = await audioFinalizeRef.current();
//           if (finalAudio) allFiles.push(finalAudio);
//         }

//         // fallback
//         if (audioFile && !audioFinalizeRef.current) {
//           allFiles.push(audioFile);
//         }
//       }

//       onSubmitClinicalForm(
//         values,
//         allFiles,
//         editChartData,
//         editCounsellingNote
//       );
//     }
//   });

//   useEffect(() => {
//     if (!editCounsellingNote) {
//       validation.resetForm();
//     }
//   }, [dispatch, editCounsellingNote]);

//   const closeForm = () => {
//     validation.resetForm();
//     dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
//   };

//   const counsellingFiles = useMemo(() => {
//     return (
//       editCounsellingNote?.files?.length > 0 && (
//         <UploadedFiles
//           id={editChartData._id}
//           chartId={editCounsellingNote._id}
//           files={editCounsellingNote.files}
//           appointment={appointment?._id}
//         />
//       )
//     );
//   }, [editChartData, editCounsellingNote, appointment]);

//   useEffect(() => {
//     // if (patientLatestCounsellingNote) {
//     setFetchedNote(patientLatestCounsellingNote?.counsellingNote || null);
//     // }
//   }, [patientLatestCounsellingNote]);

//   useEffect(() => {
//     dispatch(fetchCounsellingNote({ id: patient?._id }));
//   }, [dispatch, patient]);

//   const dropFiles = useMemo(() => {
//     return (
//       <CardBody>
//         <FilePond
//           files={files}
//           onupdatefiles={setFiles}
//           allowMultiple={true}
//           maxFiles={10}
//           name="files"
//           acceptedFileTypes={[
//             "image/png",
//             "image/jpeg",
//             "image/jpg",
//             "image/webp"
//           ]}
//           className="filepond filepond-input-multiple"
//           labelFileTypeNotAllowed={true}
//         />
//       </CardBody>
//     );
//   }, [files]);


//   const showAudioRecorder = !editCounsellingNote && (editChartData ? true : type === "IPD");

//   return (
//     <Form
//       onSubmit={(e) => {
//         e.preventDefault();
//         validation.handleSubmit();
//         return false;
//       }}
//       className="needs-validation"
//       action="#"
//       encType="multipart/form-data"
//     >
//       <Row className="mt-3">
//         {(counsellingNoteFields || []).map((item, idx) =>
//           item.name === "nextSessionDate" ? (
//             <Col
//               xs={12}
//               md={6}
//               key={idx}
//               className="d-flex flex-column justify-content-end mb-3"
//             >
//               <label className="form-label me-auto">{item.label}</label>
//               <input
//                 type="date"
//                 name={item.name}
//                 onChange={validation.handleChange}
//                 onBlur={validation.handleBlur}
//                 value={validation.values[item.name] || ""}
//                 className="form-control rounded ms-3"
//                 aria-label="With textarea"
//               />
//             </Col>
//           ) : (
//             <Col xs={12} md={6} key={idx} className="mb-3">
//               <Card className="ribbon-box border shadow-none mb-0">
//                 <CardBody className="position-relative p-0">
//                   <div className="ribbon ribbon-primary w-75 ribbon-shape">
//                     {item.label}
//                   </div>
//                   <Input
//                     type="textarea"
//                     name={item.name}
//                     onChange={validation.handleChange}
//                     onBlur={validation.handleBlur}
//                     value={validation.values[item.name] || ""}
//                     className="form-control presc-border pt-5 rounded"
//                     aria-label="With textarea"
//                     rows="2"
//                   />
//                 </CardBody>
//               </Card>
//             </Col>
//           )
//         )}
//         {showAudioRecorder && (
//           <Col xs={12} className="mt-3">
//             <h5>Audio Recording</h5>
//             <AudioRecorder
//               onReady={(file, stopFn) => {
//                 if (file) setAudioFile(file);
//                 if (stopFn) audioFinalizeRef.current = stopFn;
//               }}
//             />
//           </Col>
//         )}
//         <Col xs={12} className="mt-3 mb-4">
//           {counsellingFiles}
//         </Col>
//         <Col>
//           <Card>
//             <CardHeader>
//               <h4 className="card-title mb-0">Multiple File Upload</h4>
//             </CardHeader>
//             {dropFiles}
//           </Card>
//         </Col>
//         <Col xs={12} className="mt-3">
//           <div className="d-flex gap-3 justify-content-end">
//             <Button onClick={closeForm} size="sm" color="danger" type="button">
//               Cancel
//             </Button>
//             <Button type="submit">Save</Button>
//           </div>
//         </Col>
//       </Row>
//     </Form>
//   );
// };

// CounsellingNote.propTypes = {
//   patient: PropTypes.object,
//   author: PropTypes.object,
//   chartDate: PropTypes.any,
//   editChartData: PropTypes.object,
//   type: PropTypes.string.isRequired,
//   //   onSubmitClinicalForm: PropTypes.func,
// };

// const mapStateToProps = (state) => ({
//   patient: state.Chart.chartForm?.patient,
//   author: state.User.user,
//   chartDate: state.Chart.chartDate,
//   editChartData: state.Chart.chartForm?.data,
//   populatePreviousAppointment:
//     state.Chart.chartForm.populatePreviousAppointment,
//   shouldPrintAfterSave: state.Chart.chartForm.shouldPrintAfterSave,
//   appointment: state.Chart.chartForm.appointment,
//   patientLatestCounsellingNote: state.Chart.patientLatestCounsellingNote,
// });

// export default connect(mapStateToProps)(CounsellingNote);




import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Row,
  Col,
  Card,
  CardBody,
  Input,
  Button,
  CardHeader,
} from "reactstrap";
import FileCard from "../../../Components/Common/FileCard";
import Divider from "../../../Components/Common/Divider";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  COUNSELLING_NOTE,
  counsellingNoteFields,
} from "../../../Components/constants/patient";
import { connect, useDispatch } from "react-redux";
import {
  createEditChart,
  removeCounsellingNoteFile,
  updateCounsellingNote,
  addCounsellingNote,
} from "../../../store/actions";
import PreviewFile from "../../../Components/Common/PreviewFile";
import {
  addGeneralCounsellingNote,
  fetchCounsellingNote,
} from "../../../store/features/chart/chartSlice";
import { format } from "date-fns";
import { useRef } from "react";
import AudioRecorder from "./AaudioRecorder";

registerPlugin(
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType
);

const UploadedFiles = ({ id, chartId, files, appointment }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState({ img: null, isOpen: false });
  const [deleteFile, setDeleteFile] = useState({ img: null, isOpen: false });

  const deleteFilePermanently = () => {
    dispatch(
      removeCounsellingNoteFile({
        id,
        chartId,
        fileId: deleteFile.img._id,
        appointment,
      })
    );
    setDeleteFile({ img: null, isOpen: false });
  };

  return (
    <Row className="row-gap-3">
      <Col xs={12}>
        <div className="d-flex align-items-center gap-3">
          <h6 className="display-6 fs-5 text-nowrap">Uploaded Files</h6>
          <Divider />
        </div>
      </Col>
      {(files || []).map((file, id) => (
        <Col key={id} xs={12} md={4}>
          <FileCard
            file={file}
            showDeleteButton
            onDelete={() => setDeleteFile({ img: file, isOpen: true })}
            onPreview={() => setFile({ img: file, isOpen: true })}
          />
        </Col>
      ))}
      <PreviewFile
        file={file.img}
        isOpen={file.isOpen}
        toggle={() => setFile({ img: null, isOpen: false })}
      />
      <DeleteModal
        onDeleteClick={deleteFilePermanently}
        onCloseClick={() => setDeleteFile({ img: null, isOpen: false })}
        show={deleteFile.isOpen}
      />
    </Row>
  );
};

const CounsellingNote = ({
  author,
  patient,
  chartDate,
  editChartData,
  appointment,
  populatePreviousAppointment = false,
  shouldPrintAfterSave = false,
  type,
  patientLatestCounsellingNote,
  //   onSubmitClinicalForm,
  onNoteSaved,
}) => {
  const dispatch = useDispatch();
  const [files, setFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const audioFinalizeRef = useRef(null);
  const audioDetailsRef = useRef(null);
  const [fetchedNote, setFetchedNote] = useState(null);
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState("recording")


  const editCounsellingNote = editChartData?.counsellingNote;

  // useEffect(() => {
  //   const fetchCounsellingNote = async () => {
  //     try {
  //       const id = appointment?.patient?._id || patient?._id;
  //       if (!id || editCounsellingNote) return;

  //       const response = await axios.get(`/chart/counselling-note`, {
  //         params: { id },
  //       });

  //       const counsellingNote = response?.payload?.pay;
  //       setFetchedNote(counsellingNote || null);
  //     } catch (error) {
  //       setFetchedNote(null);
  //     }
  //   };

  //   fetchCounsellingNote();
  // }, [appointment, patient, populatePreviousAppointment, editCounsellingNote]);

  const noteSource = editCounsellingNote || fetchedNote;

  const onSubmitClinicalForm = (
    values,
    files,
    editChartData,
    editClinicalNote,
    audioDetails
  ) => {
    const {
      author,
      patient,
      center,
      centerAddress,
      addmission,
      chart,
      type,
      date,
      conclusion,
      objective,
      shortTermGoals,
      longTermGoals,
      notes,
      homework,
      reviewPreviousTask,
      nextEndGoal,
      nextSessionDate,
    } = values;
    const formData = new FormData();
    formData.append("author", author);
    formData.append("patient", patient);
    formData.append("center", center);
    formData.append("centerAddress", centerAddress);
    formData.append("addmission", addmission);
    formData.append("chart", chart);
    formData.append("type", type);
    formData.append("date", date);
    formData.append("conclusion", conclusion);
    formData.append("objective", objective);
    formData.append("shortTermGoals", shortTermGoals);
    formData.append("longTermGoals", longTermGoals);
    formData.append("notes", notes);
    formData.append("homework", homework);
    formData.append("reviewPreviousTask", reviewPreviousTask);
    formData.append("nextEndGoal", nextEndGoal);
    formData.append("nextSessionDate", nextSessionDate);
    if (!editClinicalNote && audioDetails) {
      formData.append("audioDetails", JSON.stringify(audioDetails));
    }
    // files.forEach((file) => formData.append("file", file.file));
    files.forEach((file) => {
      const actualFile = file.file || file;
      formData.append("file", actualFile);
    });

    let action;
    if (editClinicalNote) {
      formData.append("id", editChartData._id);
      formData.append("chartId", editClinicalNote._id);
      action = updateCounsellingNote(formData);
    } else if (type === "GENERAL") {
      action = addGeneralCounsellingNote(formData);
    } else {
      action = addCounsellingNote(formData);
    }

    dispatch(action)
      .unwrap()
      .then(() => onNoteSaved?.())
      .catch(() => {});
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      author: author._id,
      patient: patient._id,
      center: patient.center._id || patient.center,
      centerAddress: patient.center.title,
      appointment: appointment?._id,
      addmission: patient.addmission?._id,
      chart: COUNSELLING_NOTE,
      conclusion: noteSource?.conclusion || "",
      objective: noteSource?.objective || "",
      shortTermGoals: noteSource?.shortTermGoals || "",
      longTermGoals: noteSource?.longTermGoals || "",
      notes: noteSource?.notes || "",
      homework: noteSource?.homework || "",
      reviewPreviousTask: noteSource?.reviewPreviousTask || "",
      nextEndGoal: noteSource?.nextEndGoal || "",
      nextSessionDate: noteSource?.nextSessionDate
        ? format(new Date(noteSource?.nextSessionDate), "yyyy-MM-dd")
        : "",
      type,
      date: chartDate,
      shouldPrintAfterSave,
    },
    validationSchema: Yup.object({}),
    // onSubmit: (values) => {
    //   onSubmitClinicalForm(values, files, editChartData, editCounsellingNote);
    // },
    // onSubmit: async (values) => {
    //   const allFiles = [...files];

    //   // finalize recording if exists
    //   if (audioFinalizeRef.current) {
    //     const finalAudio = await audioFinalizeRef.current();
    //     if (finalAudio) allFiles.push(finalAudio);
    //   }

    //   // fallback
    //   if (audioFile && !audioFinalizeRef.current) {
    //     allFiles.push(audioFile);
    //   }

    //   onSubmitClinicalForm(
    //     values,
    //     allFiles,
    //     editChartData,
    //     editCounsellingNote
    //   );
    // },
    onSubmit: async (values) => {
      const allFiles = [...files];

      if (!editCounsellingNote) {
        if (uploadedAudio) {
          allFiles.push(uploadedAudio);
        }
        else if (audioFile) {
          allFiles.push(audioFile);
        }
        else if (audioFinalizeRef.current) {
          const finalAudio = await audioFinalizeRef.current();
          if (finalAudio) allFiles.push(finalAudio);
        }
      }

      onSubmitClinicalForm(
        values,
        allFiles,
        editChartData,
        editCounsellingNote,
        audioDetailsRef.current
      );
    }
  });

  useEffect(() => {
    if (!editCounsellingNote) {
      validation.resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, editCounsellingNote]);

  const closeForm = () => {
    validation.resetForm();
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
  };

  const counsellingFiles = useMemo(() => {
    return (
      editCounsellingNote?.files?.length > 0 && (
        <UploadedFiles
          id={editChartData._id}
          chartId={editCounsellingNote._id}
          files={editCounsellingNote.files}
          appointment={appointment?._id}
        />
      )
    );
  }, [editChartData, editCounsellingNote, appointment]);

  useEffect(() => {
    // if (patientLatestCounsellingNote) {
    setFetchedNote(patientLatestCounsellingNote?.counsellingNote || null);
    // }
  }, [patientLatestCounsellingNote]);

  useEffect(() => {
    dispatch(fetchCounsellingNote({ id: patient?._id }));
  }, [dispatch, patient]);

  const dropFiles = useMemo(() => {
    return (
      <CardBody>
        <FilePond
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={true}
          maxFiles={10}
          name="files"
          acceptedFileTypes={[
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
          ]}
          className="filepond filepond-input-multiple"
          labelFileTypeNotAllowed={true}
        />
      </CardBody>
    );
  }, [files]);


  const showAudioRecorder = !editCounsellingNote && (editChartData ? true : type === "IPD");

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        validation.handleSubmit();
        return false;
      }}
      className="needs-validation"
      action="#"
      encType="multipart/form-data"
    >
      <Row className="mt-3">
        {(counsellingNoteFields || []).map((item, idx) =>
          item.name === "nextSessionDate" ? (
            <Col
              xs={12}
              md={6}
              key={idx}
              className="d-flex flex-column justify-content-end mb-3"
            >
              <label className="form-label me-auto">{item.label}</label>
              <input
                type="date"
                name={item.name}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                value={validation.values[item.name] || ""}
                className="form-control rounded ms-3"
                aria-label="With textarea"
              />
            </Col>
          ) : (
            <Col xs={12} md={6} key={idx} className="mb-3">
              <Card className="ribbon-box border shadow-none mb-0">
                <CardBody className="position-relative p-0">
                  <div className="ribbon ribbon-primary w-75 ribbon-shape">
                    {item.label}
                  </div>
                  <Input
                    type="textarea"
                    name={item.name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values[item.name] || ""}
                    className="form-control presc-border pt-5 rounded"
                    aria-label="With textarea"
                    rows="2"
                  />
                </CardBody>
              </Card>
            </Col>
          )
        )}
        {isRecording === "recording" && showAudioRecorder && (
          <Col xs={12} className="mt-3">
            <h5>Audio Recording</h5>
            <AudioRecorder
              onReady={(file, stopFn, audioDetails) => {
                if (file) setAudioFile(file);
                if (stopFn) audioFinalizeRef.current = stopFn;
                if (audioDetails) audioDetailsRef.current = audioDetails;
              }}
            />
          </Col>
        )}

        {/* {!editCounsellingNote && (
          <Col xs={12} className="mt-3">
            <h5>Upload Audio File</h5>
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const ext = file.name.split(".").pop().toLowerCase().trim();;

                  const allowedExt = ["mp3", "wav", "webm", "ogg", "aac", "mpeg", "m4a"];

                  const isAudio =
                    file.type.startsWith("audio/") ||
                    (file.type === "video/webm" && ext === "webm");

                  if (!isAudio || !allowedExt.includes(ext)) {
                    alert("Only valid audio files allowed");
                    e.target.value = null;
                    return
                  }

                  const audioFile = new File([file], file.name, {
                    type: file.type || `audio/${ext}`,
                  });
                  setUploadedAudio(audioFile);
                  setAudioFile(null);
                  setIsRecording("uploaded")
                }
              }}
            />
            {uploadedAudio && (
              <p className="text-success">
                Uploaded: {uploadedAudio.name}
              </p>
            )}
          </Col>
        )} */}

        {!editCounsellingNote && (
          <Col xs={12} className="mt-3">
            <h5>Upload Audio File</h5>
            <Input
              type="file"
              // accept="audio/*"
              // accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {


                  const ext = file.name.split(".").pop().toLowerCase().trim();;

                  const allowedExt = ["mp3", "wav", "webm", "ogg", "aac", "mpeg", "m4a"];

                  const isAudio =
                    file.type.startsWith("audio/") ||
                    (file.type === "video/webm" && ext === "webm") ||
                    (file.type === "" && allowedExt.includes(ext));

                  if (!isAudio && !allowedExt.includes(ext)) {
                    alert("Only valid audio files allowed");
                    e.target.value = null;
                    return
                  }

                  const audioFile = new File([file], file.name, {
                    type: file.type || `audio/${ext}`,
                  });
                  setUploadedAudio(audioFile);
                  setAudioFile(null);
                  setIsRecording("uploaded")
                }
              }}
            />
            {uploadedAudio && (
              <p className="text-success">
                Uploaded: {uploadedAudio.name}
              </p>
            )}
          </Col>
        )}

        <Col xs={12} className="mt-3 mb-4">
          {counsellingFiles}
        </Col>
        <Col>
          <Card>
            <CardHeader>
              <h4 className="card-title mb-0">Multiple File Upload</h4>
            </CardHeader>
            {dropFiles}
          </Card>
        </Col>
        <Col xs={12} className="mt-3">
          <div className="d-flex gap-3 justify-content-end">
            <Button onClick={closeForm} size="sm" color="danger" type="button">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

CounsellingNote.propTypes = {
  patient: PropTypes.object,
  author: PropTypes.object,
  chartDate: PropTypes.any,
  editChartData: PropTypes.object,
  type: PropTypes.string.isRequired,
  //   onSubmitClinicalForm: PropTypes.func,
};

const mapStateToProps = (state) => ({
  patient: state.Chart.chartForm?.patient,
  author: state.User.user,
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm?.data,
  populatePreviousAppointment:
    state.Chart.chartForm.populatePreviousAppointment,
  shouldPrintAfterSave: state.Chart.chartForm.shouldPrintAfterSave,
  appointment: state.Chart.chartForm.appointment,
  patientLatestCounsellingNote: state.Chart.patientLatestCounsellingNote,
});

export default connect(mapStateToProps)(CounsellingNote);
