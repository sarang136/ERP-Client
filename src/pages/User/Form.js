import React, { useEffect, useRef, useState } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import CreatableSelect from "react-select/creatable";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { fetchCondition, fetchTherapy, updateUser } from "../../store/actions";
import pages from "../../Components/constants/pages";
import PropTypes from "prop-types";
import { getAllRoleslist, getJobRoles } from "../../helpers/backend_helper";
import { toast } from "react-toastify";
import { addNewUser } from "../../store/features/auth/user/userSlice";
import { useMediaQuery } from "../../Components/Hooks/useMediaQuery";
import RenderWhen from "../../Components/Common/RenderWhen";
import { useAuthError } from "../../Components/Hooks/useAuthError";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Input, Label } from "reactstrap";
import ProfessionalRegistrations, {
  missingRequiredRegistration,
  registrationSchema,
  registrationsPayload,
  toRegistrationFormValue,
} from "./ProfessionalRegistrations";
import { REGISTRATION_REQUIREMENT } from "../../Components/constants/professionalRegistration";

const UserForm = ({
  isOpen,
  toggleForm,
  userData,
  setUserData,
  hasUserPermission,
  onComplete,
  isFromIT = false,
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1023px)");
  const dispatch = useDispatch();
  const cropperRef = useRef(null);
  const profilePicRef = useRef(null);
  const dummyImage =
    "https://skala.or.id/wp-content/uploads/2024/01/dummy-post-square-1-1.jpg";
  const author = useSelector((state) => state.User.user);
  const userCenters = useSelector((state) => state.Center.data);
  const allCenters = useSelector((state) => state.Center.allCenters);

  const centers = isFromIT ? userCenters : allCenters;

  const accessibleCenters = isFromIT
    ? centers?.filter((c) => author?.centerAccess?.includes(c._id))
    : centers;

  const therapyOptions = useSelector((state) => state.Setting.therapies).map(
    (therapy) => ({
      value: therapy.title,
      label: therapy.title,
    }),
  );
  const conditionOptions = useSelector((state) => state.Setting.conditions).map(
    (condition) => ({
      value: condition.title,
      label: condition.title,
    }),
  );
  const userForm = useSelector((state) => state.User.form);
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const loader = useSelector((state) => state.User.loading);
  const [faqs, setFaqs] = useState(userData?.faqs?.length ? userData.faqs : []);
  const [signature, setSignature] = useState(null);
  const [cropSignature, setCropSignature] = useState(
    userData?.signature ? { dataURI: userData.signature } : null,
  );
  const [profilePic, setProfilePic] = useState(null);
  const [cropProfilePic, setCropProfilePic] = useState(
    userData?.profilePicture ? { dataURI: userData.profilePicture } : null,
  );
  const [options, setOptions] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [therapies, setTherapies] = useState([]);
  const [languages, setLanguages] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [accessroles, setAcccessRoles] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  // const [search, setSearch] = useState([]);
  const handleAuthError = useAuthError();

  const isITPrefill =
    userData?.isNewUserFromIT === true || userData?.isUpdateUserFromIT === true;

  const isEditing = Boolean(userData?._id) && !userData?.isNewUserFromIT;

  const fetchRoles = async () => {
    if (!token) return;
    if (!hasUserPermission) return;
    try {
      // setLoading(true);
      const response = await getAllRoleslist({ token });
      setAcccessRoles(response?.data || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to fetch access roles.");
      }
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Job roles from Setting → User Roles (active only). The select renders
  // `_id` as the option value, so the stored role value goes there. Each role
  // also says whether its users record a professional registration.
  useEffect(() => {
    getJobRoles({ active: true })
      .then((res) =>
        setJobRoles(
          (res?.payload || []).map((r) => ({
            _id: r.value,
            name: r.name,
            registration: r.registration,
            profession: r.profession,
          })),
        ),
      )
      .catch(() => toast.error("Failed to fetch user roles."));
  }, []);

  // Keep the user's current role selectable when editing, even if it is now
  // inactive or an old value no longer in the list — otherwise the dropdown
  // shows blank and the save is refused.
  const currentRole = userData?.role;
  const roleOptions =
    currentRole && !jobRoles.some((r) => r._id === currentRole)
      ? [...jobRoles, { _id: currentRole, name: currentRole }]
      : jobRoles;
  const jobRoleFor = (role) => roleOptions.find((r) => r._id === role);

  // The Professional Registration section shows for roles that ask for one,
  // and for anyone who already has registrations (so they can be removed).
  const showsRegistrations = (values) =>
    (jobRoleFor(values.role)?.registration ||
      REGISTRATION_REQUIREMENT.NOT_NEEDED) !==
      REGISTRATION_REQUIREMENT.NOT_NEEDED ||
    values.professionalRegistrations?.length > 0;

  useEffect(() => {
    if (!userForm.isOpen || userForm.data?.role !== "DOCTOR") return;

    if (!therapyOptions || therapyOptions.length === 0) {
      dispatch(fetchTherapy());
    }
    if (!conditionOptions || conditionOptions.length === 0) {
      dispatch(fetchCondition());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    therapyOptions?.length,
    conditionOptions?.length,
    dispatch,
    userForm.isOpen,
    userForm.data?.role,
  ]);

  const handleChange = (selectedOptions) => {
    setOptions(selectedOptions || []);
    validation.setFieldValue("patientsConcern", selectedOptions);
  };

  const handleCreate = (inputValue) => {
    const newOption = { value: inputValue.toLowerCase(), label: inputValue };
    setOptions((prev) => [...prev, newOption]);
    validation.setFieldValue("patientsConcern", [
      ...(validation.values.patientsConcern || []),
      newOption,
    ]);
  };

  const handleExpertiseChange = (selectedOptions) => {
    setExpertise(selectedOptions || []);
    validation.setFieldValue("expertise", selectedOptions);
  };

  const handleExpertiseCreate = (inputValue) => {
    const newOption = { value: inputValue.toLowerCase(), label: inputValue };
    setExpertise((prev) => [...prev, newOption]);
    validation.setFieldValue("expertise", [
      ...(validation.values.expertise || []),
      newOption,
    ]);
  };

  // CONDITIONS
  const handleConditionChange = (selectedOptions) => {
    setConditions(selectedOptions || []);
    validation.setFieldValue("conditions", selectedOptions);
  };

  const mergedConditionOptions = [
    ...conditionOptions,
    ...conditions.filter(
      (c) => !conditionOptions.some((opt) => opt.value === c.value),
    ),
  ];

  const handleConditionCreate = (inputValue) => {
    const newOption = { value: inputValue.toLowerCase(), label: inputValue };
    setConditions((prev) => [...prev, newOption]);
    validation.setFieldValue("conditions", [
      ...(validation.values.conditions || []),
      newOption,
    ]);
  };

  // THERAPIES
  const handleTherapiesChange = (selectedOptions) => {
    setTherapies(selectedOptions || []);
    validation.setFieldValue("therapies", selectedOptions);
  };

  const mergedTherapyOptions = [
    ...therapyOptions,
    ...therapies.filter(
      (t) => !therapyOptions.some((opt) => opt.value === t.value),
    ),
  ];

  const handleTherapiesCreate = (inputValue) => {
    const newOption = { value: inputValue.toLowerCase(), label: inputValue };
    setTherapies((prev) => [...prev, newOption]);
    validation.setFieldValue("therapies", [
      ...(validation.values.therapies || []),
      newOption,
    ]);
  };

  const handleLanChange = (selectedOptions) => {
    setLanguages(selectedOptions || []);
    validation.setFieldValue("languages", selectedOptions);
  };

  const handleLanCreate = (inputValue) => {
    const newOption = { value: inputValue.toLowerCase(), label: inputValue };
    setLanguages((prev) => [...prev, newOption]);
    validation.setFieldValue("languages", [
      ...(validation.values.languages || []),
      newOption,
    ]);
  };

  useEffect(() => {
    setFaqs(userData?.faqs || []);
    setOptions(
      userData?.patientsConcern?.map((p) => ({ label: p, value: p })) || [],
    );
    setExpertise(
      userData?.expertise?.map((e) => ({ label: e, value: e })) || [],
    );
    setConditions(
      userData?.conditions?.map((e) => ({ label: e, value: e })) || [],
    );
    setTherapies(
      userData?.therapies?.map((e) => ({ label: e, value: e })) || [],
    );
    setLanguages(
      userData?.languages?.map((e) => ({ label: e, value: e })) || [],
    );
    setCropProfilePic(
      userData?.profilePicture ? { dataURI: userData.profilePicture } : null,
    );
    setCropSignature(
      userData?.signature ? { dataURI: userData.signature } : null,
    );
    setSignature(null);
    setProfilePic(null);
  }, [userData]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      authorId: author?._id || "",
      name: userData ? userData.name : "",
      email: userData ? userData.email : "",
      accessroles: userData?.accessroles?._id || "",
      role: userData ? userData.role : "",
      gender: userData ? userData.gender : "",
      phoneNumber: userData ? userData.phoneNumber : "",
      degrees: userData ? userData.degrees : "",
      speciality: userData ? userData?.speciality : "",
      registrationNo: userData ? userData?.registrationNo : "",
      unit: userData ? userData?.unit : "",
      centerAccess: userData?.centerAccess
        ? userData?.centerAccess.map((cn) => cn._id)
        : [],
      pageAccess: userData ? userData.pageAccess?.pages : [],
      confirm_password: "",
      password: "",
      patientsConcern: userData
        ? userData?.patientsConcern?.map((p) => ({ label: p, value: p }))
        : [],
      languages: userData
        ? userData?.languages?.map((p) => ({ label: p, value: p }))
        : [],
      bio: userData ? userData?.bio : "",
      experience: userData ? userData?.experience : "",
      expertise: userData
        ? userData?.expertise?.map((e) => ({ label: e, value: e }))
        : [],
      conditions: userData
        ? userData?.conditions?.map((e) => ({ label: e, value: e }))
        : [],
      therapies: userData
        ? userData?.therapies?.map((e) => ({ label: e, value: e }))
        : [],
      availabilityMode: userData ? userData?.availabilityMode : [],
      professionalRegistrations: (userData?.professionalRegistrations || []).map(
        toRegistrationFormValue,
      ),
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Please Enter Your Email"),
      name: Yup.string().required("Please Enter Your Username"),
      gender: Yup.string().required("Please Select Gender"),
      ...(!isEditing && {
        password: Yup.string().required("Please Enter Your Password"),
      }),
      ...(!isEditing && {
        confirm_password: Yup.string().oneOf(
          [Yup.ref("password")],
          "Confirm Password Doesn't Match",
        ),
      }),
      // phoneNumber: Yup.string()
      //   .required("Please Enter Phone Number")
      //   .test("is-valid-phone", "Invalid phone number", function (value) {
      //     return isValidPhoneNumber(value || "");
      //   }),
      centerAccess: Yup.array().test(
        "notEmpty",
        "Center Access is required",
        (value) => {
          if (!value || value.length === 0) {
            return false;
          }
          return true;
        },
      ),
      accessroles: Yup.string().required("Access Role is required"),
      pageAccess: Yup.array().test(
        "notEmpty",
        "Pages Access is required",
        (value) => {
          if (!value || value.length === 0) {
            return false;
          }
          return true;
        },
      ),
      role: Yup.string().required("Please Select User Role"),
      professionalRegistrations: Yup.array()
        .of(registrationSchema)
        .test("required-for-role", function (list) {
          const missing = missingRequiredRegistration(
            jobRoleFor(this.parent.role),
            list,
          );
          return missing ? this.createError({ message: missing }) : true;
        }),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("authorId", values.authorId);
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("accessroles", values.accessroles);
      formData.append("role", values.role);
      formData.append("gender", values.gender);
      formData.append("phoneNumber", values.phoneNumber);
      // `?? ""`: FormData turns undefined into the text "undefined", which used
      // to be saved — and printed on prescriptions as the Reg. No.
      formData.append("degrees", values.degrees ?? "");
      formData.append("speciality", values.speciality ?? "");
      formData.append("registrationNo", values.registrationNo ?? "");
      formData.append("unit", values.unit ?? "");
      formData.append("centerAccess", values?.centerAccess.join(","));
      formData.append("pageAccess", JSON.stringify(values.pageAccess));
      formData.append("password", values.password);
      formData.append("bio", values.bio ?? "");
      // Sent only while the section shows; otherwise the Login Service leaves
      // the stored list alone.
      if (showsRegistrations(values)) {
        const { registrations, files } = registrationsPayload(
          values.professionalRegistrations,
        );
        formData.append(
          "professionalRegistrations",
          JSON.stringify(registrations),
        );
        files.forEach((file) =>
          formData.append("registrationCertificates", file),
        );
      }
      formData.append("availabilityMode", values.availabilityMode);
      if (values.experience) {
        formData.append("experience", values.experience);
      }
      if (expertise?.length)
        formData.append(
          "expertise",
          JSON.stringify(expertise?.map((o) => o.value)),
        );
      if (conditions?.length)
        formData.append(
          "conditions",
          JSON.stringify(conditions?.map((o) => o.value)),
        );
      if (therapies?.length)
        formData.append(
          "therapies",
          JSON.stringify(therapies?.map((o) => o.value)),
        );
      if (options?.length)
        formData.append(
          "patientsConcern",
          JSON.stringify(options?.map((o) => o.value)),
        );
      if (languages?.length)
        formData.append(
          "languages",
          JSON.stringify(languages?.map((o) => o.value)),
        );
      if (faqs?.length) formData.append("faqs", JSON.stringify(faqs));
      if (cropSignature?.file) {
        formData.append("signature", cropSignature.file);
      } else if (cropSignature === null) {
        formData.append("clearSignature", "true");
      }
      if (cropProfilePic?.file)
        formData.append("profilePicture", cropProfilePic.file);
      if (isEditing) {
        formData.append("pageAccessId", userData.pageAccess?._id);
        // if (userData.education?._id)
        //   formData.append("educationId", userData.education?._id);
        formData.append("id", userData._id);

        try {
          const updatedUser = await dispatch(
            updateUser({ data: formData, id: userData._id, token }),
          ).unwrap();
          if (onComplete) {
            onComplete(updatedUser.data[0]._id);
          }
          setUserData(null);
        } catch (error) {
          if (!handleAuthError(error)) {
            toast.error(error.message || "Failed to update user.");
          }
        }
      } else {
        try {
          const newUser = await dispatch(
            addNewUser({ data: formData, token }),
          ).unwrap();
          if (onComplete) {
            onComplete(newUser.data[0]._id);
          }
        } catch (error) {
          if (!handleAuthError(error)) {
            toast.error(error.message || "Failed to add new user.");
          }
        }
      }
      // validation.resetForm();
      // toggleForm();
    },
  });

  const fieldsArray = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Enter full name",
      disabled: isITPrefill,
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "Enter email address",
      disabled: isITPrefill,
    },
    {
      label: "Acccess Role",
      name: "accessroles",
      type: "select",
      options: accessroles,
      placeholder: "Select Access role",
    },
    {
      label: "Role",
      name: "role",
      type: "select",
      options: roleOptions,
      placeholder: "Select role",
    },
    {
      label: "Phone number",
      name: "phoneNumber",
      type: "phoneNumber",
      handleChange: (e) => validation.handleChange(e),
      disabled: isITPrefill,
    },
    {
      label: "Gender",
      name: "gender",
      type: "radio",
      options: ["MALE", "FEMALE", "OTHERS"],
      handleChange: (e) => validation.handleChange(e),
      disabled: isITPrefill,
    },
    !isEditing && {
      label: "Password",
      name: "password",
      type: "password",
      placeholder: "Enter password",
    },
    !isEditing && {
      label: "Confirm Password",
      name: "confirm_password",
      type: "password",
      placeholder: "Confirm password",
    },
    {
      label: "Availability Mode",
      name: "availabilityMode",
      type: "checkbox",
      value: "_id",
      options: [
        { _id: "in-person", title: "In-Person" },
        { _id: "virtual", title: "Video" },
      ],
      check: (field, item) =>
        validation.values[field.name]?.includes(item?._id),
    },
    // hidden input
    {
      name: "hidden_input",
    },
    {
      label: "Page Access",
      name: "pageAccess",
      type: "checkbox",
      value: "label",
      options: pages,
      check: (field, item) =>
        validation.values[field.name]?.find((tm) => tm.name === item.name),
      subCheck: (fieldName, parentName, subName) => {
        const parent = validation.values[fieldName]?.find(
          (pg) => pg.name === parentName,
        );
        return (
          parent &&
          Array.isArray(parent.subAccess) &&
          parent.subAccess.some((sb) => sb.name === subName)
        );
      },
      checkPermission: (a, b, c) => {
        const result = validation.values.pageAccess?.find((tm) => {
          if (tm.name === a) {
            if (c) {
              const subAccess = tm.subAccess?.find((sub) => sub.name === c);
              return subAccess?.permissions?.[b] === true;
            } else {
              return tm.permissions?.[b] === true;
            }
          }
          return false;
        });
        return !!result;
      },
      handleChange: (e, field, item, val) => handleAccess(e, field, item, val),
    },
  ];

  const cancelForm = () => {
    toggleForm();
    setUserData(null);
    setCropSignature(null);
    setSignature(null);
    setCropProfilePic(null);
    setProfilePic(null);
    validation.resetForm();
  };

  const handleAccess = (e, field, item, val) => {
    const currentPageAccess = validation.values.pageAccess || [];
    let updatedPageAccess = [];

    if (val) {
      updatedPageAccess = currentPageAccess.map((pg) => {
        if (item.name === pg.name) {
          const subAccessArr = Array.isArray(pg.subAccess) ? pg.subAccess : [];
          const exists = subAccessArr.some((sb) => sb.name === val.name);
          if (exists) {
            return {
              ...pg,
              subAccess: subAccessArr.filter((sb) => sb.name !== val.name),
            };
          } else {
            return {
              ...pg,
              subAccess: [
                ...subAccessArr,
                { ...val, permissions: { ...val.permissions } },
              ],
            };
          }
        }
        return pg;
      });
    } else {
      const exists = currentPageAccess.some((pg) => pg.name === item.name);
      if (exists) {
        updatedPageAccess = currentPageAccess.filter(
          (pg) => pg.name !== item.name,
        );
      } else {
        updatedPageAccess = [
          ...currentPageAccess,
          {
            ...item,
            permissions: { ...item.permissions },
            subAccess: item.children ? [] : [],
          },
        ];
      }
    }

    validation.setFieldValue("pageAccess", updatedPageAccess);
  };

  const handlePermission = (item, perm, subItem) => {
    let currentPageAccess = [...validation.values.pageAccess];
    if (subItem) {
      currentPageAccess = currentPageAccess.map((pg) => {
        if (item.name === pg.name) {
          return {
            ...pg,
            subAccess: pg.subAccess.map((sb) => {
              if (sb.name === subItem.name) {
                return {
                  ...sb,
                  permissions: {
                    ...sb.permissions,
                    [perm]: !sb.permissions[perm],
                  },
                };
              }
              return sb;
            }),
          };
        }
        return pg;
      });
    } else {
      currentPageAccess = currentPageAccess.map((pg) => {
        if (item.name === pg.name) {
          return {
            ...pg,
            permissions: {
              ...(pg.permissions || {}),
              [perm]: !pg.permissions?.[perm],
            },
          };
        }
        return pg;
      });
    }
    validation.setFieldValue("pageAccess", currentPageAccess);
  };

  const onProfileChange = (e) => {
    const files = e.target.files;
    const reader = new FileReader();
    reader.onload = () => setProfilePic(reader.result);
    reader.readAsDataURL(files[0]);
  };

  const onSignatureChange = (e) => {
    const files = e.target.files || e.dataTransfer.files;
    const reader = new FileReader();
    reader.onload = () => setSignature(reader.result);
    reader.readAsDataURL(files[0]);
  };

  const getCropData = async (type) => {
    const ref = type === "profile" ? profilePicRef : cropperRef;
    if (ref.current?.cropper) {
      const dataURI = ref.current.cropper.getCroppedCanvas().toDataURL();
      const blob = await fetch(dataURI).then((res) => res.blob());
      const file = new File([blob], `${type}.jpg`, {
        type: "image/jpeg",
        lastModified: new Date(),
      });
      if (type === "profile") {
        setCropProfilePic({ file, dataURI });
        setProfilePic(null);
      } else {
        setCropSignature({ file, dataURI });
        setSignature(null);
      }
    }
  };

  const handleFaqChange = (index, event) => {
    const { name, value } = event.target;
    const updatedFaqs = [...faqs];
    updatedFaqs[index][name] = value;
    setFaqs(updatedFaqs);
  };

  return (
    <div
      style={{
        display: isOpen ? "flex" : "none",
        position: "fixed",
        top: 50,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        transition: "opacity 0.3s ease",
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1f2937",
            }}
          >
            {isEditing ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={cancelForm}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <svg
              style={{ width: "28px", height: "28px", color: "#6b7280" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={validation.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <img
                src={
                  userData?.profilePicture?.url ||
                  cropProfilePic?.dataURI ||
                  dummyImage
                }
                alt="Profile"
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #e5e7eb",
                }}
              />
              <label
                htmlFor="profilePicInput"
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  borderRadius: "50%",
                  padding: "10px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2563eb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3b82f6")
                }
              >
                <svg
                  style={{ width: "22px", height: "22px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onProfileChange}
              />
            </div>
          </div>

          {(signature || profilePic) && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "32px",
                  maxWidth: "600px",
                  width: "100%",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px",
                    color: "#1f2937",
                  }}
                >
                  {signature ? "Crop Signature" : "Crop Profile Picture"}
                </h3>
                <Cropper
                  ref={signature ? cropperRef : profilePicRef}
                  src={signature || profilePic}
                  style={{ height: "350px", width: "100%" }}
                  initialAspectRatio={1}
                  viewMode={1}
                  minCropBoxHeight={100}
                  minCropBoxWidth={100}
                  dragMode="move"
                  cropBoxMovable={false}
                  cropBoxResizable={false}
                  background={false}
                  responsive={true}
                  autoCropArea={1}
                  checkOrientation={false}
                  guides={true}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "16px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#d1d5db")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e5e7eb")
                    }
                    onClick={() =>
                      signature ? setSignature(null) : setProfilePic(null)
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#2563eb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#3b82f6")
                    }
                    onClick={() =>
                      getCropData(signature ? "signature" : "profile")
                    }
                  >
                    Crop
                  </button>
                </div>
              </div>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "20px",
            }}
          >
            {fieldsArray
              .filter(Boolean)
              .filter((field) => field.name !== "pageAccess")
              .map((field, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                  className="justify-end"
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {field.label}
                  </label>
                  {field.name === "phoneNumber" ? (
                    <>
                      <PhoneInputWithCountrySelect
                        placeholder="Enter phone number"
                        name={field.name}
                        disabled={field.disabled}
                        value={validation.values[field.name]}
                        // onBlur={validation.handleBlur}
                        onChange={(value) =>
                          field.handleChange({
                            target: {
                              name: field.name,
                              value: value,
                            },
                          })
                        }
                        limitMaxLength={true}
                        defaultCountry="IN"
                        className="w-100"
                        style={{
                          width: "100%",
                          height: "42px",
                          padding: "0.5rem 0.75rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "1rem",
                        }}
                      />
                    </>
                  ) : field.type === "select" ? (
                    <select
                      name={field.name}
                      style={{
                        padding: "10px",
                        border: `1px solid ${validation.touched[field.name] &&
                          validation.errors[field.name]
                          ? "#ef4444"
                          : "#d1d5db"
                          }`,
                        borderRadius: "6px",
                        fontSize: "15px",
                        outline: "none",
                        width: "100%",
                        backgroundColor: "#ffffff",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.target.style.border = "1px solid #3b82f6")
                      }
                      onBlur={(e) => {
                        e.target.style.border = `1px solid ${validation.touched[field.name] &&
                          validation.errors[field.name]
                          ? "#ef4444"
                          : "#d1d5db"
                          }`;
                        validation.handleBlur(e);
                      }}
                      onChange={validation.handleChange}
                      value={validation.values[field.name] || ""}
                    >
                      <option value="" disabled>
                        {field.placeholder}
                      </option>
                      {field.options.map((option, idx) => (
                        <option
                          key={idx}
                          value={
                            typeof option === "object" ? option._id : option
                          }
                        >
                          {typeof option === "object" ? option.name : option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" &&
                    field.name === "availabilityMode" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {field.options.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              name={field.name}
                              value={item[field.value]}
                              checked={field.check(field, item)}
                              onChange={(e) =>
                                field.handleChange
                                  ? field.handleChange(e, field, item)
                                  : validation.handleChange(e)
                              }
                              style={{
                                marginRight: "10px",
                                width: "18px",
                                height: "18px",
                              }}
                            />
                            <label
                              style={{
                                fontSize: "15px",
                                color: "#374151",
                              }}
                            >
                              {item.title || item.label}
                            </label>
                          </div>
                          {field.check(field, item) && item.permissions && (
                            <div
                              style={{
                                marginLeft: "30px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                              }}
                            >
                              {Object.entries(item.permissions).map(
                                ([perm, value]) => (
                                  <div
                                    key={perm}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name={field.name}
                                      value={perm}
                                      checked={field.checkPermission(
                                        item.name,
                                        perm,
                                      )}
                                      onChange={() =>
                                        handlePermission(item, perm)
                                      }
                                      style={{
                                        marginRight: "10px",
                                        width: "18px",
                                        height: "18px",
                                      }}
                                    />
                                    <label
                                      style={{
                                        fontSize: "15px",
                                        color: "#374151",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {perm}
                                    </label>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                          {field.check(field, item) &&
                            item.children?.map((val, id) => (
                              <div
                                key={id}
                                style={{
                                  marginLeft: "30px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    name={field.name}
                                    value={val.name}
                                    checked={field.subCheck(
                                      field.name,
                                      item.name,
                                      val.name,
                                    )}
                                    disabled={!field.check(field, item)}
                                    onChange={(e) =>
                                      field.handleChange(e, field, item, val)
                                    }
                                    style={{
                                      marginRight: "10px",
                                      width: "18px",
                                      height: "18px",
                                    }}
                                  />
                                  <label
                                    style={{
                                      fontSize: "15px",
                                      color: "#374151",
                                    }}
                                  >
                                    {val.name}
                                  </label>
                                </div>
                                {field.subCheck(
                                  field.name,
                                  item.name,
                                  val.name,
                                ) &&
                                  val.permissions && (
                                    <div
                                      style={{
                                        marginLeft: "30px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                      }}
                                    >
                                      {Object.entries(val.permissions).map(
                                        ([perm, value]) => (
                                          <div
                                            key={perm}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                          >
                                            <input
                                              type="checkbox"
                                              name={field.name}
                                              value={perm}
                                              checked={field.checkPermission(
                                                item.name,
                                                perm,
                                                val.name,
                                              )}
                                              onChange={() =>
                                                handlePermission(
                                                  item,
                                                  perm,
                                                  val,
                                                )
                                              }
                                              style={{
                                                marginRight: "10px",
                                                width: "18px",
                                                height: "18px",
                                              }}
                                            />
                                            <label
                                              style={{
                                                fontSize: "15px",
                                                color: "#374151",
                                                textTransform: "capitalize",
                                              }}
                                            >
                                              {perm}
                                            </label>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                        </div>
                      ))}
                      {validation.touched[field.name] &&
                        validation.errors[field.name] && (
                          <p
                            style={{
                              color: "#ef4444",
                              fontSize: "13px",
                              marginTop: "6px",
                              gridColumn: "1 / -1",
                            }}
                          >
                            {validation.errors[field.name]}
                          </p>
                        )}
                    </div>
                  ) : field.type === "radio" ? (
                    <>
                      <div className="d-flex flex-wrap">
                        {(field.options || []).map((item, idx) => (
                          <div
                            key={item + idx}
                            className="d-flex me-4 align-items-center"
                          >
                            <Input
                              className="me-2 mt-0"
                              type="radio"
                              name={field.name}
                              disabled={field.disabled}
                              readOnly={field.disabled}
                              value={item}
                              onChange={validation.handleChange}
                              checked={validation.values[field.name] === item}
                            />
                            <Label className="form-label fs-14 mb-0">
                              {item}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </> // hidden input
                  ) : field.name === "hidden_input" ? (
                    <>
                      <label style={{ display: "hidden" }}></label>
                      <input type="hidden" name={field.name} />
                    </>
                  ) : (
                    <input
                      type={field.type}
                      disabled={field.disabled}
                      name={field.name}
                      placeholder={field.placeholder}
                      autoComplete={
                        field.type === "password" ? "new-password" : "off"
                      }
                      style={{
                        padding: "10px",
                        border: `1px solid ${validation.touched[field.name] &&
                          validation.errors[field.name]
                          ? "#ef4444"
                          : "#d1d5db"
                          }`,
                        borderRadius: "6px",
                        fontSize: "15px",
                        outline: "none",
                        width: "100%",
                        textTransform:
                          field.name === "name" ? "capitalize" : "none",
                        transition: "border-color 0.2s",
                        backgroundColor: "#ffffff",
                      }}
                      onFocus={(e) =>
                        (e.target.style.border = "1px solid #3b82f6")
                      }
                      onBlur={(e) => {
                        e.target.style.border = `1px solid ${validation.touched[field.name] &&
                          validation.errors[field.name]
                          ? "#ef4444"
                          : "#d1d5db"
                          }`;
                        validation.handleBlur(e);
                      }}
                      onChange={validation.handleChange}
                      value={validation.values[field.name] || ""}
                    />
                  )}
                  {validation.touched[field.name] &&
                    validation.errors[field.name] && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors[field.name]}
                      </p>
                    )}
                </div>
              ))}
          </div>
          {fieldsArray.find((field) => field.name === "pageAccess") && (
            <div style={{ marginTop: "30px" }}>
              {(() => {
                const field = fieldsArray.find((f) => f.name === "pageAccess");
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      {field.label}
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : isTablet
                            ? "repeat(2, 1fr)"
                            : "repeat(3, 1fr)",
                        gap: "20px",
                        width: "100%",
                      }}
                    >
                      {field.options.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#F9FAFB",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              name={field.name}
                              value={item[field.value]}
                              checked={field.check(field, item)}
                              onChange={(e) =>
                                field.handleChange
                                  ? field.handleChange(e, field, item)
                                  : validation.handleChange(e)
                              }
                              style={{
                                marginRight: "12px",
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                              }}
                            />
                            <label
                              style={{
                                fontSize: "16px",
                                color: "#111827",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {item.title || item.displayLabel || item.label}
                            </label>
                          </div>

                          {field.check(field, item) && item.permissions && (
                            <div
                              style={{
                                marginLeft: "24px",
                                display: "flex",
                                flexWrap: isMobile ? "wrap" : "nowrap",
                                gap: "20px",
                                overflowX: isMobile ? "visible" : "auto",
                              }}
                            >
                              {Object.entries(item.permissions).map(
                                ([perm, value]) => (
                                  <div
                                    key={perm}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name={field.name}
                                      value={perm}
                                      checked={field.checkPermission(
                                        item.name,
                                        perm,
                                      )}
                                      onChange={() =>
                                        handlePermission(item, perm)
                                      }
                                      style={{
                                        marginRight: "10px",
                                        width: "16px",
                                        height: "16px",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <label
                                      style={{
                                        fontSize: "15px",
                                        color: "#4b5563",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {perm}
                                    </label>
                                  </div>
                                ),
                              )}
                            </div>
                          )}

                          {field.check(field, item) && item.children && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobile
                                  ? "1fr"
                                  : isTablet
                                    ? "1fr 1fr"
                                    : "1fr 1fr",
                                gap: "16px",
                                marginTop: "10px",
                              }}
                            >
                              {item.children.map((val, id) => (
                                <div
                                  key={id}
                                  style={{
                                    background: "#f3f4f6",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name={field.name}
                                      value={val.name}
                                      checked={field.subCheck(
                                        field.name,
                                        item.name,
                                        val.name,
                                      )}
                                      disabled={!field.check(field, item)}
                                      onChange={(e) =>
                                        field.handleChange(e, field, item, val)
                                      }
                                      style={{
                                        marginRight: "10px",
                                        width: "16px",
                                        height: "16px",
                                        cursor: !field.check(field, item)
                                          ? "not-allowed"
                                          : "pointer",
                                      }}
                                    />
                                    <label
                                      style={{
                                        fontSize: "15px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {val.name}
                                    </label>
                                  </div>
                                  {field.subCheck(
                                    field.name,
                                    item.name,
                                    val.name,
                                  ) &&
                                    val.permissions && (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "row",
                                          flexWrap: "wrap",
                                          gap: "8px",
                                          marginLeft: "10px",
                                        }}
                                      >
                                        {Object.entries(val.permissions).map(
                                          ([perm, value]) => (
                                            <div
                                              key={perm}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                name={field.name}
                                                value={perm}
                                                checked={field.checkPermission(
                                                  item.name,
                                                  perm,
                                                  val.name,
                                                )}
                                                onChange={() =>
                                                  handlePermission(
                                                    item,
                                                    perm,
                                                    val,
                                                  )
                                                }
                                                style={{
                                                  marginRight: "10px",
                                                  width: "16px",
                                                  height: "16px",
                                                  cursor: "pointer",
                                                }}
                                              />
                                              <label
                                                style={{
                                                  fontSize: "14px",
                                                  color: "#6b7280",
                                                  textTransform: "capitalize",
                                                }}
                                              >
                                                {perm}
                                              </label>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {validation.touched[field.name] &&
                        validation.errors[field.name] && (
                          <p
                            style={{
                              color: "#ef4444",
                              fontSize: "13px",
                              marginTop: "6px",
                              gridColumn: "1 / -1",
                            }}
                          >
                            {validation.errors[field.name]}
                          </p>
                        )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "20px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <label
              style={{
                fontSize: "15px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Center Access
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              {accessibleCenters?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    name="centerAccess"
                    value={item._id}
                    checked={validation.values?.centerAccess?.includes(
                      item._id,
                    )}
                    onChange={validation.handleChange}
                    style={{
                      marginRight: "10px",
                      width: "18px",
                      height: "18px",
                    }}
                  />
                  <label
                    style={{
                      fontSize: "15px",
                      color: "#374151",
                    }}
                  >
                    {item.title}
                  </label>
                </div>
              ))}
              {validation.touched?.centerAccess &&
                validation.errors?.centerAccess && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "13px",
                      marginTop: "6px",
                      gridColumn: "1 / -1",
                    }}
                  >
                    {validation.errors?.centerAccess}
                  </p>
                )}
            </div>
          </div>

          {(validation.values.role === "DOCTOR" ||
            validation.values.role === "COUNSELLOR" || validation.values.role === "PSYCHOLOGIST") && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Signature
                  </label>
                  {cropSignature ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <img
                        src={cropSignature.dataURI}
                        alt="Edited Signature"
                        style={{
                          maxWidth: "250px",
                          height: "auto",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          padding: "4px",
                          backgroundColor: "#f9fafb",
                        }}
                      />
                      <button
                        type="button"
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#dc2626")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#ef4444")
                        }
                        onClick={() => setCropSignature(null)}
                      >
                        Clear Signature
                      </button>
                    </div>
                  ) : userData?.signature?.url ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <img
                        src={userData.signature}
                        alt="Current Signature"
                        style={{
                          maxWidth: "250px",
                          height: "auto",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          padding: "4px",
                          backgroundColor: "#f9fafb",
                        }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#dc2626")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ef4444")
                          }
                          onClick={() => {
                            setCropSignature(null);
                            validation.setFieldValue("signature", "");
                          }}
                        >
                          Remove
                        </button>
                        <label
                          htmlFor="signatureInput"
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#3b82f6",
                            color: "#ffffff",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#2563eb")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#3b82f6")
                          }
                        >
                          Change
                        </label>
                        <input
                          id="signatureInput"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={onSignatureChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{
                          padding: "10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "15px",
                          outline: "none",
                          width: "100%",
                          backgroundColor: "#ffffff",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.border = "1px solid #3b82f6")
                        }
                        onBlur={(e) =>
                          (e.target.style.border = "1px solid #d1d5db")
                        }
                        onChange={onSignatureChange}
                      />
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginTop: "8px",
                        }}
                      >
                        Upload a clear signature image (PNG format recommended)
                      </p>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Patient Concerns
                  </label>
                  <CreatableSelect
                    isMulti
                    name="patientsConcern"
                    options={options}
                    classNamePrefix="react-select"
                    onChange={handleChange}
                    onCreateOption={handleCreate}
                    value={validation.values.patientsConcern || []}
                  />
                  {validation.touched.patientsConcern &&
                    validation.errors.patientsConcern && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.patientsConcern}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Degrees
                  </label>
                  <input
                    type="text"
                    name="degrees"
                    placeholder="Enter degrees"
                    style={{
                      padding: "10px",
                      border: `1px solid ${validation.touched.degrees && validation.errors.degrees
                        ? "#ef4444"
                        : "#d1d5db"
                        }`,
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = `1px solid ${validation.touched.degrees && validation.errors.degrees
                        ? "#ef4444"
                        : "#d1d5db"
                        }`;
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.degrees || ""}
                  />
                  {validation.touched.degrees && validation.errors.degrees && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "13px",
                        marginTop: "6px",
                      }}
                    >
                      {validation.errors.degrees}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Languages Spoken
                  </label>
                  <CreatableSelect
                    isMulti
                    name="languages"
                    options={languages}
                    classNamePrefix="react-select"
                    onChange={handleLanChange}
                    onCreateOption={handleLanCreate}
                    value={validation.values.languages || []}
                  />
                  {validation.touched.languages &&
                    validation.errors.languages && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.languages}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Speciality
                  </label>
                  <input
                    type="text"
                    name="speciality"
                    placeholder="Enter speciality"
                    style={{
                      padding: "10px",
                      border: `1px solid ${validation.touched.speciality &&
                        validation.errors.speciality
                        ? "#ef4444"
                        : "#d1d5db"
                        }`,
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = `1px solid ${validation.touched.speciality &&
                        validation.errors.speciality
                        ? "#ef4444"
                        : "#d1d5db"
                        }`;
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.speciality || ""}
                  />
                  {validation.touched.speciality &&
                    validation.errors.speciality && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.speciality}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNo"
                    placeholder="Enter registration number"
                    style={{
                      padding: "10px",
                      border: `1px solid ${validation.touched.registrationNo &&
                        validation.errors.registrationNo
                        ? "#ef4444"
                        : "#d1d5db"
                        }`,
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = `1px solid ${validation.touched.registrationNo &&
                        validation.errors.registrationNo
                        ? "#ef4444"
                        : "#d1d5db"
                        }`;
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.registrationNo || ""}
                  />
                  {validation.touched.registrationNo &&
                    validation.errors.registrationNo && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.registrationNo}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    placeholder="Enter Unit"
                    style={{
                      padding: "10px",
                      border: `1px solid ${validation.touched.unit && validation.errors.unit
                        ? "#ef4444"
                        : "#d1d5db"
                        }`,
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = `1px solid ${validation.touched.unit && validation.errors.unit
                        ? "#ef4444"
                        : "#d1d5db"
                        }`;
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.unit || ""}
                  />
                  {validation.touched.unit && validation.errors.unit && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "13px",
                        marginTop: "6px",
                      }}
                    >
                      {validation.errors.unit}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    placeholder="Enter bio"
                    style={{
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      minHeight: "120px",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid #d1d5db";
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.bio || ""}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Expertise
                  </label>
                  <CreatableSelect
                    isMulti
                    name="expertise"
                    options={expertise}
                    classNamePrefix="react-select"
                    onChange={handleExpertiseChange}
                    onCreateOption={handleExpertiseCreate}
                    value={validation.values.expertise || []}
                  />
                  {validation.touched.expertise &&
                    validation.errors.expertise && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.expertise}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Conditions
                  </label>
                  <CreatableSelect
                    isMulti
                    name="conditions"
                    options={mergedConditionOptions}
                    classNamePrefix="react-select"
                    onChange={handleConditionChange}
                    onCreateOption={handleConditionCreate}
                    value={validation.values.conditions || []}
                  />
                  {validation.touched.conditions &&
                    validation.errors.conditions && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.conditions}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Therapies
                  </label>
                  <CreatableSelect
                    isMulti
                    name="therapies"
                    options={mergedTherapyOptions}
                    classNamePrefix="react-select"
                    onChange={handleTherapiesChange}
                    onCreateOption={handleTherapiesCreate}
                    value={validation.values.therapies || []}
                  />
                  {validation.touched.therapies &&
                    validation.errors.therapies && (
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        {validation.errors.therapies}
                      </p>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    placeholder="Enter years of experience"
                    style={{
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "15px",
                      outline: "none",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #3b82f6")}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid #d1d5db";
                      validation.handleBlur(e);
                    }}
                    onChange={validation.handleChange}
                    value={validation.values.experience || ""}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    FAQs
                  </label>
                  {faqs.map((faq, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        padding: "20px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          Question
                        </label>
                        <input
                          type="text"
                          name="question"
                          placeholder="Enter question"
                          style={{
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "15px",
                            outline: "none",
                            width: "100%",
                            backgroundColor: "#ffffff",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) =>
                            (e.target.style.border = "1px solid #3b82f6")
                          }
                          onBlur={(e) =>
                            (e.target.style.border = "1px solid #d1d5db")
                          }
                          onChange={(e) => handleFaqChange(i, e)}
                          value={faq.question || ""}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          Answer
                        </label>
                        <textarea
                          name="answer"
                          placeholder="Enter answer"
                          style={{
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "15px",
                            outline: "none",
                            width: "100%",
                            minHeight: "100px",
                            backgroundColor: "#ffffff",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) =>
                            (e.target.style.border = "1px solid #3b82f6")
                          }
                          onBlur={(e) =>
                            (e.target.style.border = "1px solid #d1d5db")
                          }
                          onChange={(e) => handleFaqChange(i, e)}
                          value={faq.answer || ""}
                        />
                      </div>
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            padding: "10px 16px",
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#dc2626")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ef4444")
                          }
                          onClick={() =>
                            setFaqs(faqs.filter((_, index) => index !== i))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      alignSelf: "flex-start",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#2563eb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#3b82f6")
                    }
                    onClick={() =>
                      setFaqs([...faqs, { question: "", answer: "" }])
                    }
                  >
                    Add FAQ
                  </button>
                </div>
              </div>
            )}

          {showsRegistrations(validation.values) && (
            <ProfessionalRegistrations
              validation={validation}
              jobRole={jobRoleFor(validation.values.role)}
            />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "16px",
            }}
          >
            <button
              type="button"
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#d1d5db")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#e5e7eb")
              }
              onClick={cancelForm}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loader}
              style={{
                padding: "10px 20px",
                backgroundColor: loader ? "#2563eb" : "#3b82f6",
                color: "#ffffff",
                borderRadius: "6px",
                cursor: loader ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "none",
                minWidth: "100px",
              }}
              onMouseOver={(e) => {
                if (!loader) e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                if (!loader) e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              <RenderWhen isTrue={loader}>
                <div
                  className="spinner-border spinner-border-sm text-light"
                  role="status"
                  style={{ width: "1rem", height: "1rem" }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </RenderWhen>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

UserForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleForm: PropTypes.func.isRequired,
  userData: PropTypes.object,
  setUserData: PropTypes.func.isRequired,
};

export default UserForm;
