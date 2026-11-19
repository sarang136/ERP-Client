import React from "react";
import { Container } from "reactstrap";
import Stats from "./Stats";
import Sidebar from "./Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Apikeys from "./Apikeys";
import Health from "./Health";
import Recipients from "./Recipients";

const Webcamstats = () => {
  return (
    <React.Fragment>
      <div className="page-conten overflow-hidden">
        <div className="patient-page">
          <Container fluid>
            <div className="chat-wrapper d-lg-flex gap-1 mx-n4 my-n4 mb-n5 p-1">
              <Sidebar />
              <Routes>
                <Route path={`/dashboard`} element={<Dashboard />} />
                <Route path={`/health`} element={<Health />} />
                <Route path={`/stats`} element={<Stats />} />
                <Route path={`/apikeys`} element={<Apikeys />} />
                <Route path={`/recipients`} element={<Recipients />} />
              </Routes>
            </div>
          </Container>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Webcamstats;
