import { createContext, useContext } from "react";

// The access-role module for Therapy Lectures (src/Data/Roles.data.js):
//   READ   — open the page and see everything
//   WRITE  — create series, edit hosts, add / move patients, mark sessions,
//            attendance and photos
//   DELETE — also delete a series, remove a patient from a series, remove photos
// The server checks the same levels on every request (therapyLectures.route.js).
export const PERMISSION_MODULE = "THERAPY_LECTURES";

// Set once by the page (index.js) from the user's role; read-only until then.
export const LecturePermissions = createContext({ canWrite: false, canDelete: false });

export const useLecturePermissions = () => useContext(LecturePermissions);
