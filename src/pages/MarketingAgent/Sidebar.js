import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

const SIDEBAR_WIDTH = 240;
const TITLE = "AI Marketing Agent";

const Sidebar = ({ pages }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 992,
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const measure = () => {
      const header = document.getElementById("page-topbar");
      if (header) setTopOffset(header.getBoundingClientRect().bottom);
      const nav =
        document.querySelector(".navbar-menu") ||
        document.querySelector(".app-menu") ||
        document.getElementById("vertical-menu");
      if (nav) setLeftOffset(nav.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    const interval = setInterval(measure, 500);
    return () => {
      window.removeEventListener("resize", measure);
      clearInterval(interval);
    };
  }, []);

  const list = (
    <div style={{ padding: "0 8px 16px 8px" }}>
      {pages.map((page) => {
        const link = `/marketing-agent/${page.path}`;
        const active = location.pathname === link;
        return (
          <Link
            key={page.id}
            to={link}
            onClick={() => isMobile && setIsMobileOpen(false)}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "4px",
                background: active ? "rgba(53,119,241,0.1)" : "transparent",
                color: active ? "#3577f1" : "#495057",
              }}
            >
              <i
                className={page.icon}
                style={{ fontSize: 20, flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {page.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ background: "#fff", borderBottom: "1px solid #eef0f2" }}>
        <div className="px-3 pt-4 pb-3 d-flex align-items-center justify-content-between">
          <h4 className="fw-bold mb-0">{TITLE}</h4>
          <button
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="btn btn-sm px-2"
            style={{ background: "transparent", border: "none" }}
          >
            <i className={`bx ${isMobileOpen ? "bx-x" : "bx-menu"} fs-4`} />
          </button>
        </div>
        <div
          style={{
            maxHeight: isMobileOpen ? "1000px" : "0px",
            overflow: "hidden",
            transition: "max-height 0.3s ease",
          }}
        >
          {list}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, flexShrink: 0 }}
      />
      {createPortal(
        <div
          style={{
            position: "fixed",
            top: topOffset,
            left: leftOffset,
            height: `calc(100vh - ${topOffset}px)`,
            width: SIDEBAR_WIDTH,
            overflowY: "auto",
            overflowX: "hidden",
            background: "#fff",
            borderRight: "1px solid #eef0f2",
            zIndex: 100,
          }}
        >
          <div className="px-3 pt-4 pb-3">
            <h4 className="fw-bold mb-0 text-dark">{TITLE}</h4>
          </div>
          {list}
        </div>,
        document.body,
      )}
    </>
  );
};

export default Sidebar;
