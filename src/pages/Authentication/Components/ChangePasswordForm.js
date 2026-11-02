import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import CustomModal from "../../../Components/Common/Modal";
import { firstchange } from "../../../helpers/backend_helper";
import { logoutUser } from "../../../store/actions";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const ChangePasswordForm = ({ isOpen, toggle }) => {
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  useEffect(() => {
    if (!isOpen) {
      formik.resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);




  const formik = useFormik({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },

    validationSchema: Yup.object({
      oldPassword: Yup.string().required("Old password is Required"),
      newPassword: Yup.string().min(6, "Min 6 characters are required").required("New Password is Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Old and new Passwords must match")
        .required("Confirm Password is Required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        await firstchange({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
          token,
        });

        toast.success("Password changed successfully");

        dispatch(logoutUser(token));
        Object.keys(localStorage).forEach((key) => {
          if (
            !key.startsWith("detail_admission_draft_") &&
            !key.startsWith("detail_admission_audio_") &&
            !key.startsWith("detailAdmissionDraft_")
          ) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();

        resetForm();

        navigate("/login");

      } catch (err) {
        toast.error(err?.message || "Failed to change password");
      }
    },

  });

  return (
    <React.Fragment>
      <CustomModal
        title={"Change Password Form"}
        size={"md"}
        centered
        isOpen={isOpen}
        toggle={toggle}
      >
        <Form onSubmit={formik.handleSubmit}>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label className="fw-bold">Old Password</Label>
                <div className="position-relative">
                  <Input
                    type={show.old ? "text" : "password"}
                    name="oldPassword"
                    value={formik.values.oldPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.oldPassword && !!formik.errors.oldPassword}
                    style={{ paddingRight: "40px" }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      background: "#fff",
                      paddingLeft: "4px",
                    }}
                    onClick={() => toggleShow("old")}
                  >
                    {show.old ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                {formik.touched.oldPassword && formik.errors.oldPassword && (
                  <small className="text-danger">{formik.errors.oldPassword}</small>
                )}
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <Label className="fw-bold">New Password</Label>
                <div className="position-relative">
                  <Input
                    type={show.new ? "text" : "password"}
                    name="newPassword"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.newPassword && !!formik.errors.newPassword
                    }
                    style={{ paddingRight: "40px" }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      background: "#fff",
                      paddingLeft: "4px",
                    }}
                    onClick={() => toggleShow("new")}
                  >
                    {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                {formik.touched.newPassword && formik.errors.newPassword && (
                  <small className="text-danger">{formik.errors.newPassword}</small>
                )}
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <Label className="fw-bold">Confirm Password</Label>
                <div className="position-relative">
                  <Input
                    type={show.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.confirmPassword &&
                      !!formik.errors.confirmPassword
                    }
                    style={{ paddingRight: "40px" }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      background: "#fff",
                      paddingLeft: "4px",
                    }}
                    onClick={() => toggleShow("confirm")}
                  >
                    {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                {formik.touched.confirmPassword &&
                  formik.errors.confirmPassword && (
                    <small className="text-danger">
                      {formik.errors.confirmPassword}
                    </small>
                  )}
              </FormGroup>
            </Col>
          </Row>

          <div className="mt-4 d-flex justify-content-end">
            <Button type="submit" color="primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? <Spinner size="sm" /> : "Change Password"}
            </Button>
          </div>
        </Form>

      </CustomModal>
    </React.Fragment>
  );
};

export default ChangePasswordForm;
