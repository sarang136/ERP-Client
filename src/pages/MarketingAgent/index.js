import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import Basic404 from "../AuthenticationInner/Errors/Basic404";
import { usePermissions } from "../../Components/Hooks/useRoles.js";
import Sidebar from "./Sidebar";
import { AGENT_PAGES, MODULE } from "./pages";

const MarketingAgent = () => {
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission, loading } = usePermissions(token);

  useEffect(() => {
    document.title = "AI Marketing Agent | Jagruti Rehab";
  }, []);

  if (loading) {
    return (
      <div
        className="page-content d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  const allowed = AGENT_PAGES.filter((page) =>
    hasPermission(MODULE, page.permission, "READ"),
  );
  if (allowed.length === 0) {
    return <Basic404 />;
  }

  return (
    <div className="page-content">
      <Container fluid>
        <div
          className="chat-wrapper d-lg-flex gap-1 mx-n4 my-n4 mb-n5 p-1"
          style={{ alignItems: "flex-start", overflowX: "visible" }}
        >
          <Sidebar pages={allowed} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <Routes>
              {allowed.map((page) => (
                <Route
                  key={page.id}
                  path={page.path}
                  element={<page.component />}
                />
              ))}
              <Route
                index
                element={<Navigate to={allowed[0].path} replace />}
              />
              <Route
                path="*"
                element={<Navigate to={allowed[0].path} replace />}
              />
            </Routes>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MarketingAgent;
