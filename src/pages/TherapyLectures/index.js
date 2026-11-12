import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { Container } from "reactstrap";
import SeriesList from "./pages/SeriesList";
import SeriesDetail from "./pages/SeriesDetail";
import { PAGE_NAME } from "./helpers";

// Therapy Lectures: half-month lecture series per centre (1st–15th, 16th–end),
// their hosts, patients, daily activity, attendance and photo evidence.
// Open to users given the "Therapy Lectures" page.
const TherapyLectures = () => {
  const pages = useSelector((state) => state.User?.user?.pageAccess?.pages);
  if (pages && !pages.some((p) => p?.name === PAGE_NAME)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Routes>
          <Route path="/" element={<SeriesList />} />
          <Route path=":seriesId" element={<SeriesDetail />} />
          <Route path="*" element={<Navigate to="/therapy-lectures" replace />} />
        </Routes>
      </Container>
    </div>
  );
};

export default TherapyLectures;
