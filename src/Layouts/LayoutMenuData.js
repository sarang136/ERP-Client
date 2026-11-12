import React from "react";
import { useSelector } from "react-redux";
import pages from "../Components/constants/pages";

const Navdata = () => {
  const userPages = useSelector(
    (state) => state.User.user?.pageAccess?.pages || [],
  );

  const dynamicPages = userPages?.map((pg) => {
    const pageIndex = pages?.findIndex((r) => r.label === pg.name);
    const page = pages[pageIndex];
    if (!page) return page;
    return page.displayLabel ? { ...page, label: page.displayLabel } : page;
  });

  const filteredDynamicPages = dynamicPages?.filter(
    (page) => page && page.id !== "hrms",
  );

  const sortPages = (routes) => {
    const sortOrder = [
      "centerDashboard",
      "misMaster",
      "nurse",
      "emergency",
      "lead",
      "booking",
      "intern",
      "patient",
      "alert",
      "referral",
      "roundnotes",
      "mireporting",
      "users",
      "cash",
      "centralpayment",
      "incidentreporting",
      "grievances",
      "setting",
      "recyclebin",
      "pharmacy",
      "masterdata",
      "training",
      "utilities",
      "guidelines",
      "hr",
      "audit",
      "compliance",
      "therapylectures",
      "issues",
      "marketing",
      "recordings",
      // "hrms",
      "webcamstats",
      "tally",
      "pospayments",
      "sop-configs"
    ];

    routes?.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.id);
      const indexB = sortOrder.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) {
        return -1;
      }

      if (indexB !== -1) {
        return 1;
      }
      return 0;
    });

    return routes;
  };




  const menuItems = [
    {
      label: "Menu",
      isHeader: true,
    },
    {
      id: "centers",
      label: "Centers",
      icon: "bx bx-layer",
      link: "/centers",
    },
    ...sortPages(filteredDynamicPages),
    // pages.find((p) => p.id === "issues"),
    // pages.find((p) => p.id === "recordings"),
    // ...safeStaticPages,
  ];


  return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
