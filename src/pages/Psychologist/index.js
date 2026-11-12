import React from "react";
import { Container } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Route, Routes } from "react-router-dom";
import Main from "./Main";

const Psychologist = () => {
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Psychologist Dashboard" pageTitle="Psychologist Dashboard" />
          <Routes>
            <Route path="/" element={<Main />} />
          </Routes>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Psychologist;
