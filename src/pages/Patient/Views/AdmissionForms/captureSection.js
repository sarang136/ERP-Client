// import html2canvas from "html2canvas";

// /**
//  * Rasterise a DOM section into one A4 page of a jsPDF document.
//  *
//  * Clones the node, syncs radio/checkbox checked state, collapses radio groups to
//  * a single value, swaps every input/textarea/select for an underlined span
//  * (honouring data-no-underline), scales fonts and borders, then html2canvas ->
//  * pdf.addImage scaled to fit one page.
//  *
//  * Extracted from AdmissionForms.js so the consent, admission, discharge and ECT
//  * consent flows all share one implementation rather than copying it.
//  */
// export const captureSection = async (ref, pdf, isFirstPage = false) => {
//   if (!ref?.current) return pdf;
//   const el = ref.current;

//   // wait for fonts
//   if (document.fonts && document.fonts.ready) {
//     try {
//       await document.fonts.ready;
//     } catch (e) {}
//   }

//   // === CLONE + replace inputs with spans ===
//   const clone = el.cloneNode(true);

//   // Sync radio/checkbox checked state from original to clone
//   const originalRadios = el.querySelectorAll(
//     "input[type='radio'], input[type='checkbox']",
//   );
//   const cloneRadios = clone.querySelectorAll(
//     "input[type='radio'], input[type='checkbox']",
//   );
//   originalRadios.forEach((orig, i) => {
//     if (cloneRadios[i]) cloneRadios[i].checked = orig.checked;
//   });

//   // Handle radio groups: replace each group with "Selected" or "A / B"
//   const handledRadioNames = new Set();
//   const allRadios = clone.querySelectorAll("input[type='radio']");
//   allRadios.forEach((radio) => {
//     const name = radio.getAttribute("name");
//     if (!name || handledRadioNames.has(name)) return;
//     handledRadioNames.add(name);

//     const group = clone.querySelectorAll(`input[type='radio'][name='${name}']`);
//     const labels = [];
//     let selectedValue = null;

//     group.forEach((r) => {
//       const label = r.closest("label");
//       const text = r.value || (label ? label.textContent.trim() : "");
//       if (r.checked) selectedValue = text;
//       labels.push({ radio: r, label, text });
//     });

//     // Build replacement span
//     const resultSpan = document.createElement("span");
//     resultSpan.style.fontWeight = "bold";
//     resultSpan.style.textTransform = "uppercase";
//     resultSpan.style.marginLeft = "10px";

//     if (selectedValue) {
//       resultSpan.innerText = selectedValue.toUpperCase();
//       // resultSpan.style.textDecoration = "underline";
//     } else {
//       resultSpan.innerText = labels
//         .map((l) => l.text)
//         .join(" / ")
//         .toUpperCase();
//     }

//     // Insert result span before first label, then remove all labels
//     const firstLabel = labels[0].label || labels[0].radio.parentNode;
//     firstLabel.parentNode.insertBefore(resultSpan, firstLabel);
//     labels.forEach(({ radio, label }) => {
//       if (label) label.remove();
//       else radio.remove();
//     });
//   });

//   const checkboxesInClone = clone.querySelectorAll("input[type='checkbox']");
//   checkboxesInClone.forEach((checkbox) => {
//     const span = document.createElement("span");
//     span.innerText = checkbox.checked ? "☑" : "☐";
//     span.style.fontSize = "16px";
//     span.style.marginRight = "4px";
//     span.style.display = "inline-block";
//     checkbox.parentNode.replaceChild(span, checkbox);
//   });

//   const inputsInClone = clone.querySelectorAll("input, textarea, select");

//   inputsInClone.forEach((input) => {
//     const span = document.createElement("span");
//     let value = "";
//     if (input.tagName.toLowerCase() === "select") value = input.value || "";
//     else if (input.type === "date" && input.value)
//       value = new Date(input.value).toLocaleDateString("en-GB");
//     else value = input.value || input.innerText || "";

//     span.innerText = value ? String(value).toUpperCase() : "\u00A0";
//     span.style.fontWeight = "bold";
//     span.style.textTransform = "uppercase";
//     if (!input.hasAttribute("data-no-underline")) {
//       span.style.borderBottom = "1px solid #000";
//     }
//     span.style.display = "inline-block";
//     span.style.minWidth = "100px";
//     span.style.maxWidth = "100%";
//     span.style.wordBreak = "break-word";
//     span.style.margin = "0 4px";
//     input.parentNode.replaceChild(span, input);
//   });

//   // === Fix known styled elements ===
//   const defaults = {
//     orgName: { fontSize: "26px" },
//     address: { fontSize: "18px" },
//     phone: { fontSize: "18px" },
//     website: { fontSize: "18px" },
//   };
//   Object.keys(defaults).forEach((cls) => {
//     const elems = clone.querySelectorAll(`.${cls}`);
//     elems.forEach((elx) => {
//       Object.assign(elx.style, defaults[cls]);
//     });
//   });

//   // wrapper
//   const wrapper = document.createElement("div");
//   while (clone.firstChild) wrapper.appendChild(clone.firstChild);
//   clone.appendChild(wrapper);

//   // Map PDF width → CSS px
//   const pdfW_pts = pdf.internal.pageSize.getWidth();
//   const pdfH_pts = pdf.internal.pageSize.getHeight();
//   const PT_TO_PX = 96 / 72;
//   const marginPts = 10;
//   const marginPx = Math.round(marginPts * PT_TO_PX);
//   const pdfWidthPx = Math.floor(pdfW_pts * PT_TO_PX);

//   clone.style.position = "absolute";
//   clone.style.left = "0";
//   clone.style.top = "0";
//   clone.style.zIndex = "2147483647";
//   clone.style.boxSizing = "border-box";
//   clone.style.background = "#fff";
//   clone.style.margin = "0";
//   clone.style.overflow = "visible";
//   clone.style.width = pdfWidthPx - marginPx * 2 + "px";

//   wrapper.style.display = "block";
//   wrapper.style.width = "100%";
//   wrapper.style.boxSizing = "border-box";

//   // improve borders & font scaling
//   const BORDER_MULT = 1.3;
//   const TEXT_MULT = 1.05;
//   const allElems = clone.querySelectorAll("*");
//   allElems.forEach((elx) => {
//     const cs = window.getComputedStyle(elx);
//     if (cs.fontSize) {
//       const fs = parseFloat(cs.fontSize);
//       if (!Number.isNaN(fs) && fs > 0) {
//         elx.style.fontSize = `${Math.round(fs * TEXT_MULT)}px`;
//       }
//     }
//     ["Top", "Right", "Bottom", "Left"].forEach((s) => {
//       const val = cs[`border${s}Width`];
//       if (val && val !== "0px") {
//         const num = parseFloat(val) || 0;
//         if (num > 0)
//           elx.style[`border${s}Width`] = `${Math.max(1, num * BORDER_MULT)}px`;
//       }
//     });

//     if (cs.display === "flex") {
//       elx.style.flexWrap = "wrap";
//       elx.style.justifyContent = "flex-start";
//     }
//   });

//   document.body.appendChild(clone);
//   await new Promise((r) => setTimeout(r, 100));

//   const cloneFullHeight = Math.ceil(wrapper.scrollHeight);
//   const DPR = window.devicePixelRatio || 1;
//   const PREFERRED_SCALE = 2;
//   let captureScale = Math.min(Math.max(1.5, DPR), PREFERRED_SCALE);

//   // === Always fit whole content into one single PDF page ===
//   // const addCanvasAsSinglePage = (canvas, firstPageFlag) => {
//   //   const usableWpts = pdfW_pts - marginPts * 2;
//   //   const usableHpts = pdfH_pts - marginPts * 2;

//   //   const cW_px = canvas.width;
//   //   const cH_px = canvas.height;

//   //   // const fitScale = Math.min(usableWpts / cW_px, usableHpts / cH_px);
//   //   const fitScale = usableWpts / cW_px;

//   //   const targetW_pts = cW_px * fitScale;
//   //   const targetH_pts = cH_px * fitScale;

//   //   const imgData = canvas.toDataURL("image/jpeg", 1.0);
//   //   if (!firstPageFlag) pdf.addPage();
//   //   pdf.addImage(
//   //     imgData,
//   //     "JPEG",
//   //     marginPts,
//   //     marginPts,
//   //     targetW_pts,
//   //     targetH_pts,
//   //     undefined,
//   //     "FAST",
//   //   );
//   // };

//   // Replace addCanvasAsSinglePage with this
//   const addCanvasAsPages = (canvas, firstPageFlag) => {
//     const usableWpts = pdfW_pts - marginPts * 2;
//     const usableHpts = pdfH_pts - marginPts * 2;

//     const cW_px = canvas.width;
//     const cH_px = canvas.height;

//     // Scale by width only
//     const fitScale = usableWpts / cW_px;
//     const targetW_pts = cW_px * fitScale;

//     // How many canvas px fit in one PDF page
//     const pageHeightPx = usableHpts / fitScale;
//     const totalPages = Math.ceil(cH_px / pageHeightPx);

//     for (let page = 0; page < totalPages; page++) {
//       const sourceY = page * pageHeightPx;
//       const sourceH = Math.min(pageHeightPx, cH_px - sourceY);

//       // Slice canvas for this page
//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = cW_px;
//       tempCanvas.height = sourceH;
//       const ctx = tempCanvas.getContext("2d");
//       ctx.drawImage(canvas, 0, sourceY, cW_px, sourceH, 0, 0, cW_px, sourceH);

//       const targetH_pts = sourceH * fitScale;
//       const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);

//       if (page === 0 && firstPageFlag) {
//         // first page already exists, don't add
//       } else {
//         pdf.addPage();
//       }

//       pdf.addImage(
//         imgData,
//         "JPEG",
//         marginPts,
//         marginPts,
//         targetW_pts,
//         targetH_pts,
//         undefined,
//         "FAST",
//       );
//     }
//   };

//   try {
//     wrapper.style.transform = "translateY(0px)";
//     clone.style.height = cloneFullHeight + "px";
//     const c = await html2canvas(clone, {
//       scale: captureScale,
//       useCORS: true,
//       backgroundColor: "#fff",
//       imageTimeout: 20000,
//       allowTaint: false,
//       // windowWidth: document.documentElement.scrollWidth,
//       windowWidth: clone.offsetWidth || pdfWidthPx,
//     });
//     addCanvasAsPages(c, isFirstPage);
//   } catch (err) {
//   } finally {
//     try {
//       document.body.removeChild(clone);
//     } catch (e) {}
//   }

//   return pdf;
// };
import html2canvas from "html2canvas";

/**
 * Reads a horizontal strip of the canvas in ONE getImageData call and returns
 * a boolean map: true = that row is entirely white (R,G,B ≥ 240).
 * Far faster than calling getImageData once per row.
 */
const buildWhiteRowMap = (canvas, fromY, toY) => {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const startY = Math.max(0, Math.floor(fromY));
  const endY = Math.min(canvas.height - 1, Math.ceil(toY));
  const h = endY - startY + 1;
  if (h <= 0) return { map: [], startY };

  const { data } = ctx.getImageData(0, startY, w, h);
  const map = new Array(h);

  for (let row = 0; row < h; row++) {
    let white = true;
    const base = row * w * 4;
    for (let col = 0; col < w * 4; col += 4) {
      if (
        data[base + col] < 240 ||
        data[base + col + 1] < 240 ||
        data[base + col + 2] < 240
      ) {
        white = false;
        break;
      }
    }
    map[row] = white;
  }

  return { map, startY };
};

/**
 * Scans UPWARD from idealY (canvas pixels) to find a safe page-break point.
 *
 * Rules:
 *  - Requires 2 consecutive white rows → never breaks at a 1-px table border.
 *  - 300 px scan range → walks back past entire signature tables / boxes so
 *    the whole block moves to the next page intact.
 *  - Falls back to idealY if no clean break is found (last resort).
 */
const findNaturalBreak = (canvas, idealY, scanRange = 300) => {
  const floor = Math.max(0, Math.floor(idealY) - scanRange);
  const { map, startY } = buildWhiteRowMap(canvas, floor, idealY);
  const len = map.length;

  for (let i = len - 1; i >= 1; i--) {
    if (map[i] && map[i - 1]) return startY + i;
  }
  return Math.floor(idealY);
};

/**
 * Slice a strip from `canvas` starting at `srcY` with height `sliceH`,
 * draw it into the PDF at (marginPts, pageY), and return the height added
 * in PDF points.
 */
const placeSlice = (
  canvas,
  srcY,
  sliceH,
  pdf,
  marginPts,
  pageY,
  usableW,
  fitScale,
) => {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = sliceH;
  temp
    .getContext("2d")
    .drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      sliceH,
      0,
      0,
      canvas.width,
      sliceH,
    );
  const h_pts = sliceH * fitScale;
  pdf.addImage(
    temp.toDataURL("image/jpeg", 1.0),
    "JPEG",
    marginPts,
    pageY,
    usableW,
    h_pts,
    undefined,
    "FAST",
  );
  return h_pts;
};

/**
 * Rasterise a DOM section and place it into the PDF.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PAGE STRATEGY
 * ─────────────────────────────────────────────────────────────────────────────
 * Every section (Admissionpage1, Admissionpage2, SeriousnessConsent,
 * MedicationConsent, AudioVideoConsent …) is a self-contained form with its
 * own header and is meant to start on its own page.
 *
 *  1. SCALE-TO-FIT (preferred):
 *     If the rendered content is ≤ 125 % of the usable page height, scale it
 *     down so it fits on ONE A4 page.  This eliminates the "2-lines overflow
 *     → blank next page" problem caused by minor rendering-height differences.
 *
 *  2. MULTI-PAGE FLOW (fallback for genuinely long content):
 *     If content is > 125 % of the page height, flow across pages using
 *     findNaturalBreak so cuts land in white-space, never mid-glyph or
 *     mid-table-row.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CALLERS (AddmissionForms.js) do NOT need to change.
 * The original call pattern is correct:
 *
 *   const pdf = new jsPDF("p", "pt", "a4");
 *   await captureSection(admission1Ref,  pdf, true);   // uses existing page 1
 *   await captureSection(admission2Ref,  pdf);          // adds page 2
 *   await captureSection(seriousnessRef, pdf);          // adds page 3
 *   await captureSection(medicationRef,  pdf);          // adds page 4
 *   await captureSection(audioVideoRef,  pdf);          // adds page 5
 *
 * @param {React.RefObject} ref         DOM node ref to capture.
 * @param {jsPDF}           pdf         jsPDF instance (mutated in place).
 * @param {boolean}         isFirstPage true → use the page jsPDF already created;
 *                                      false → call pdf.addPage() first.
 */
export const captureSection = async (
  ref,
  pdf,
  isFirstPage = false,
  maxRatio = 1.25,
) => {
  const marginPts = 10;
  if (!ref?.current) return;

  const el = ref.current;

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  // ── Clone the DOM node ─────────────────────────────────────────────────────
  const clone = el.cloneNode(true);

  // Remove screen-only elements (interactive widgets, toggle controls) that
  // must not appear in the PDF — marked with data-pdf-hide on the source element.
  clone.querySelectorAll("[data-pdf-hide]").forEach((el) => el.remove());

  // Sync radio / checkbox checked state from the live DOM to the clone
  const origChecked = el.querySelectorAll(
    "input[type='radio'],input[type='checkbox']",
  );
  const cloneChecked = clone.querySelectorAll(
    "input[type='radio'],input[type='checkbox']",
  );
  origChecked.forEach((orig, i) => {
    if (cloneChecked[i]) cloneChecked[i].checked = orig.checked;
  });

  // Sync native <select> values from live DOM to clone (cloneNode copies
  // HTML attributes only; the runtime .value property must be re-applied).
  const origSelects = el.querySelectorAll("select");
  const cloneSelects = clone.querySelectorAll("select");
  origSelects.forEach((orig, i) => {
    if (cloneSelects[i]) cloneSelects[i].value = orig.value;
  });

  // Collapse radio groups → single bold uppercase span
  const handled = new Set();
  clone.querySelectorAll("input[type='radio']").forEach((radio) => {
    const name = radio.getAttribute("name");
    if (!name || handled.has(name)) return;
    handled.add(name);

    const group = [
      ...clone.querySelectorAll(`input[type='radio'][name='${name}']`),
    ];
    let selected = null;
    const items = group.map((r) => {
      const label = r.closest("label");
      const text = r.value || label?.textContent.trim() || "";
      if (r.checked) selected = text;
      return { radio: r, label, text };
    });

    const span = document.createElement("span");
    span.style.fontWeight = "bold";
    span.style.textTransform = "uppercase";
    span.style.marginLeft = "10px";
    span.innerText = (
      selected ?? items.map((i) => i.text).join(" / ")
    ).toUpperCase();

    const anchor = items[0].label ?? items[0].radio.parentNode;
    anchor.parentNode.insertBefore(span, anchor);
    items.forEach(({ radio, label }) => (label ?? radio).remove());
  });

  // Checkboxes → ☑ / ☐ span
  clone.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    const span = document.createElement("span");
    span.innerText = cb.checked ? "☑" : "☐";
    span.style.fontSize = "16px";
    span.style.marginRight = "4px";
    span.style.display = "inline-block";
    cb.parentNode.replaceChild(span, cb);
  });

  // Remaining inputs / textareas / selects → underlined bold span
  clone.querySelectorAll("input,textarea,select").forEach((input) => {
    const span = document.createElement("span");
    let value = "";

    if (input.tagName.toLowerCase() === "select") {
      value = input.value || "";
    } else if (input.type === "date" && input.value) {
      value = new Date(input.value).toLocaleDateString("en-GB");
    } else {
      value = input.value || input.innerText || "";
    }

    span.innerText = value ? String(value).toUpperCase() : "\u00A0";
    span.style.fontWeight = "bold";
    span.style.textTransform = "uppercase";
    if (!input.hasAttribute("data-no-underline")) {
      span.style.borderBottom = "1px solid #000";
    }
    span.style.display = "inline-block";
    span.style.minWidth = "100px";
    span.style.maxWidth = "100%";
    span.style.wordBreak = "break-word";
    span.style.margin = "0 4px";
    input.parentNode.replaceChild(span, input);
  });

  // Known class font overrides
  const classStyles = {
    orgName: { fontSize: "26px" },
    address: { fontSize: "18px" },
    phone: { fontSize: "18px" },
    website: { fontSize: "18px" },
  };
  Object.entries(classStyles).forEach(([cls, styles]) =>
    clone
      .querySelectorAll(`.${cls}`)
      .forEach((elx) => Object.assign(elx.style, styles)),
  );

  // Wrap so scrollHeight is reliable
  const wrapper = document.createElement("div");
  while (clone.firstChild) wrapper.appendChild(clone.firstChild);
  clone.appendChild(wrapper);

  // ── Size clone to match PDF width ──────────────────────────────────────────
  const pdfW_pts = pdf.internal.pageSize.getWidth();
  const pdfH_pts = pdf.internal.pageSize.getHeight();
  const PT_TO_PX = 96 / 72;
  const marginPx = Math.round(marginPts * PT_TO_PX);
  const pdfWidthPx = Math.floor(pdfW_pts * PT_TO_PX);

  Object.assign(clone.style, {
    position: "absolute",
    left: "0",
    top: "0",
    zIndex: "2147483647",
    boxSizing: "border-box",
    background: "#fff",
    margin: "0",
    overflow: "visible",
    width: `${pdfWidthPx - marginPx * 2}px`,
  });
  Object.assign(wrapper.style, {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
  });

  // Slightly scale fonts and borders for crisp rasterisation
  clone.querySelectorAll("*").forEach((elx) => {
    const cs = window.getComputedStyle(elx);
    const fs = parseFloat(cs.fontSize);
    if (!isNaN(fs) && fs > 0) elx.style.fontSize = `${Math.round(fs * 1.05)}px`;
    ["Top", "Right", "Bottom", "Left"].forEach((side) => {
      const bw = parseFloat(cs[`border${side}Width`]) || 0;
      if (bw > 0)
        elx.style[`border${side}Width`] = `${Math.max(1, bw * 1.3)}px`;
    });
    if (cs.display === "flex") {
      elx.style.flexWrap = "wrap";
      elx.style.justifyContent = "flex-start";
    }
  });

  document.body.appendChild(clone);
  await new Promise((r) => setTimeout(r, 100));

  clone.style.height = `${Math.ceil(wrapper.scrollHeight)}px`;

  const captureScale = Math.min(Math.max(1.5, window.devicePixelRatio || 1), 2);

  let canvas;
  try {
    canvas = await html2canvas(clone, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#fff",
      imageTimeout: 20_000,
      allowTaint: false,
      windowWidth: clone.offsetWidth || pdfWidthPx,
    });
  } catch (err) {
    return;
  } finally {
    try {
      document.body.removeChild(clone);
    } catch (_) {}
  }

  // ── Open the page for this section ─────────────────────────────────────────
  if (!isFirstPage) pdf.addPage();

  const usableW_pts = pdfW_pts - marginPts * 2;
  const usableH_pts = pdfH_pts - marginPts * 2;

  // Scale factor when fitting content width to the PDF's usable width
  const fitScaleByWidth = usableW_pts / canvas.width; // canvas px → PDF pts
  const scaledH_pts = canvas.height * fitScaleByWidth;

  // ── Strategy 1: SCALE TO FIT ONE PAGE ──────────────────────────────────────
  // If the content height (when scaled to page width) is within 125 % of the
  // usable page height, compress it slightly so it fits on a single A4 page.
  // This handles the common case of a form that is just a few percent too tall
  // due to font-rendering differences, preventing the "2 lines on next page"
  // blank-page problem.
  if (scaledH_pts <= usableH_pts * maxRatio) {
    // Uniform scale that fits both width and height
    const uniformScale = Math.min(
      usableW_pts / canvas.width,
      usableH_pts / canvas.height,
    );
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      marginPts,
      marginPts,
      canvas.width * uniformScale,
      canvas.height * uniformScale,
      undefined,
      "FAST",
    );
    return;
  }

  // ── Strategy 2: MULTI-PAGE FLOW ────────────────────────────────────────────
  // Content is genuinely taller than 125 % of the page.  Flow it across
  // multiple pages, using findNaturalBreak (300 px scan, 2 consecutive white
  // rows) to keep tables and boxes intact.
  let pageY = marginPts;
  let srcY = 0;

  while (srcY < canvas.height) {
    const availH_pts = pdfH_pts - pageY - marginPts;
    const availH_px = availH_pts / fitScaleByWidth;

    if (availH_px <= 10) {
      pdf.addPage();
      pageY = marginPts;
      continue;
    }

    const rawSlice = Math.min(availH_px, canvas.height - srcY);

    // ── Last (or only) slice: place remaining content and finish ──────────
    if (srcY + rawSlice >= canvas.height) {
      const sliceH = Math.floor(canvas.height - srcY);
      placeSlice(
        canvas,
        srcY,
        sliceH,
        pdf,
        marginPts,
        pageY,
        usableW_pts,
        fitScaleByWidth,
      );
      break;
    }

    // ── Overflowing slice: find natural break ─────────────────────────────
    // 300 px scan range + 2 consecutive white rows ensures we skip entire
    // signature tables and place the whole box on the next page.
    const breakAt = findNaturalBreak(canvas, srcY + rawSlice);
    const sliceH = Math.max(Math.floor(breakAt) - srcY, 20); // advance ≥ 20 px
    const safeH = Math.min(sliceH, canvas.height - srcY);

    const placed_pts = placeSlice(
      canvas,
      srcY,
      safeH,
      pdf,
      marginPts,
      pageY,
      usableW_pts,
      fitScaleByWidth,
    );

    srcY += safeH;
    pageY += placed_pts;

    if (srcY < canvas.height) {
      pdf.addPage();
      pageY = marginPts;
    }
  }
};
