import React, { useEffect } from "react";
import { Navigate, Route } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { connect, useDispatch } from "react-redux";
import { useProfile } from "../Components/Hooks/UserHooks";
import { logoutUser } from "../store/actions";

const AuthProtected = (props) => {
  const dispatch = useDispatch();
  let { userProfile, loading, token } = useProfile();

  useEffect(() => {
    if (userProfile && !loading && token) {
      setAuthorization(token);
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
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
    }
  }, [token, userProfile, loading, dispatch]);
  if (!userProfile && loading && !token) {
    return <Navigate to="/login" state={{ from: props.location }} />;
  }
  return <>{props.children}</>;
};

const mapStateToProps = (state) => ({
  patients: state.Patient.allPatients,
});

export default connect(mapStateToProps)(AuthProtected);

const AccessRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        return (
          <>
            {" "}
            <Component {...props} />{" "}
          </>
        );
      }}
    />
  );
};

export { AccessRoute };