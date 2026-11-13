import React, { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import SeriesList from "./pages/SeriesList";
import SeriesDetail from "./pages/SeriesDetail";
import { usePermissions } from "../../Components/Hooks/useRoles";
import { LecturePermissions, PERMISSION_MODULE } from "./permissions";

// Therapy Lectures: 45-day lecture series per centre — each starts on any day and
// counts as its month's 1st half (started 1st–15th) or 2nd half (16th onwards),
// one per half — with their hosts, patients, daily activity, attendance and
// photo evidence. A patient's own record is also on the patient page's
// Therapy Lectures tab (pages/Patient/Views/TherapyLectures.js).
//
// Access comes from the user's role (THERAPY_LECTURES): READ opens the page,
// WRITE and DELETE unlock the actions (see permissions.js).
const TherapyLectures = () => {
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  const { loading: permissionLoader, roles, hasPermission } = usePermissions(token);
  const hasTherapyLecture = hasPermission(PERMISSION_MODULE, null, "READ");
  const permissions = useMemo(
    () => ({
      canWrite: hasPermission(PERMISSION_MODULE, null, "WRITE"),
      canDelete: hasPermission(PERMISSION_MODULE, null, "DELETE"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles],
  );

  if (permissionLoader) {
    return (
      <div className="page-content">
        <Container fluid className="text-center py-5">
          <Spinner color="primary" />
        </Container>
      </div>
    );
  }
  if (!hasTherapyLecture) return <Navigate to="/unauthorized" replace />;

  return (
    <LecturePermissions.Provider value={permissions}>
      <div className="page-content">
        <Container fluid>
          <Routes>
            <Route path="/" element={<SeriesList />} />
            <Route path=":seriesId" element={<SeriesDetail />} />
            <Route path="*" element={<Navigate to="/therapy-lectures" replace />} />
          </Routes>
        </Container>
      </div>
    </LecturePermissions.Provider>
  );
};

export default TherapyLectures;
