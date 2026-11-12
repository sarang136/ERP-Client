import React, { useEffect, useState } from "react";
import Select from "react-select";
import { getLectureHostOptions } from "../../../helpers/backend_helper";

// Multi-select of the users who can host at a centre.
const HostSelect = ({ center, value, onChange, placeholder = "Choose hosts…", inputId, isDisabled }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!center) {
      setOptions([]);
      return undefined;
    }
    let live = true;
    setLoading(true);
    getLectureHostOptions(center)
      .then((res) => {
        if (live) setOptions((res?.data || []).map((u) => ({ value: u._id, label: u.name, role: u.role })));
      })
      .catch(() => live && setOptions([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [center]);

  const selected = (value || []).map((id) => options.find((o) => o.value === id) || { value: id, label: "…" });

  return (
    <Select
      inputId={inputId}
      isMulti
      isLoading={loading}
      isDisabled={isDisabled || !center}
      options={options}
      value={selected}
      onChange={(list) => onChange((list || []).map((o) => o.value))}
      placeholder={center ? placeholder : "Pick a centre first"}
      formatOptionLabel={(o, { context }) =>
        context === "menu" && o.role ? (
          <span>
            <span className="text-capitalize">{o.label}</span>
            <small className="text-muted ms-2">{o.role}</small>
          </span>
        ) : (
          <span className="text-capitalize">{o.label}</span>
        )
      }
      classNamePrefix="select"
    />
  );
};

export default HostSelect;
