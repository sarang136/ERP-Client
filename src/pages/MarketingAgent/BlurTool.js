import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import {
  blurContentImage,
  getImageFaces,
} from "../../helpers/marketingAgentApi";
import { notifyError, useAction } from "./common";

const TOOLS = [
  ["select", "bx bx-pointer", "Select, move or resize"],
  ["ellipse", "bx bx-circle", "Circle or oval"],
  ["rect", "bx bx-rectangle", "Rectangle"],
  ["brush", "bx bx-brush", "Brush"],
];
const HANDLE = 10;
const MIN_SIZE = 0.012;
let nextId = 1;

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const round = (v) => Math.round(v * 10000) / 10000;

const toPayload = (shapes) =>
  shapes.map((s) =>
    s.type === "brush"
      ? {
          type: "brush",
          size: round(s.size),
          points: s.points
            .filter((_, i, all) => all.length <= 4000 || i % 2 === 0)
            .map(([x, y]) => [round(x), round(y)]),
        }
      : {
          type: s.type,
          x: round(s.x),
          y: round(s.y),
          w: round(s.w),
          h: round(s.h),
        },
  );

const shapePath = (ctx, s, W, H) => {
  ctx.beginPath();
  if (s.type === "rect") ctx.rect(s.x * W, s.y * H, s.w * W, s.h * H);
  if (s.type === "ellipse")
    ctx.ellipse(
      (s.x + s.w / 2) * W,
      (s.y + s.h / 2) * H,
      Math.max(1, (s.w / 2) * W),
      Math.max(1, (s.h / 2) * H),
      0,
      0,
      Math.PI * 2,
    );
};

const paintMask = (ctx, shapes, W, H) => {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  shapes.forEach((s) => {
    if (s.type === "brush") {
      const width = Math.max(1, s.size * W);
      ctx.lineWidth = width;
      ctx.beginPath();
      s.points.forEach(([x, y], i) =>
        i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H),
      );
      if (s.points.length === 1)
        ctx.lineTo(s.points[0][0] * W + 0.1, s.points[0][1] * H);
      ctx.stroke();
    } else {
      shapePath(ctx, s, W, H);
      ctx.fill();
    }
  });
};

const bounds = (s) => {
  if (s.type !== "brush") return s;
  const xs = s.points.map((p) => p[0]);
  const ys = s.points.map((p) => p[1]);
  const pad = s.size / 2;
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
};

const hits = (s, p, W, H) => {
  if (s.type === "brush") {
    const r = (s.size * W) / 2 + 4;
    return s.points.some(
      ([x, y]) => Math.hypot((x - p.x) * W, (y - p.y) * H) <= r,
    );
  }
  if (s.type === "rect")
    return p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
  const dx = (p.x - (s.x + s.w / 2)) / (s.w / 2);
  const dy = (p.y - (s.y + s.h / 2)) / (s.h / 2);
  return dx * dx + dy * dy <= 1;
};

export const BlurTool = ({
  item,
  isOpen,
  onClose,
  onBlurred,
  justUploaded,
}) => {
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tool, setTool] = useState("ellipse");
  const [brush, setBrush] = useState(5);
  const [intensity, setIntensity] = useState(7);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(null);
  const [size, setSize] = useState(null);
  const [hover, setHover] = useState(null);
  const [draft, setDraft] = useState(null);
  const wrap = useRef(null);
  const canvas = useRef(null);
  const img = useRef(null);
  const blurLayer = useRef(null);
  const drag = useRef(null);
  const { act, busy } = useAction();

  const commit = useCallback(
    (next) => {
      setHistory((h) => [...h.slice(-49), shapes]);
      setShapes(next);
    },
    [shapes],
  );

  const scan = useCallback(() => {
    setScanning(true);
    getImageFaces(item.id)
      .then((result) => {
        const faces = result.boxes.map((b) => ({
          ...b,
          type: "ellipse",
          id: nextId++,
          face: true,
        }));
        setFound(faces.length);
        setShapes((current) => {
          setHistory((h) => [...h.slice(-49), current]);
          return [...current.filter((s) => !s.face), ...faces];
        });
      })
      .catch(notifyError)
      .finally(() => setScanning(false));
  }, [item.id]);

  useEffect(() => {
    if (isOpen) {
      setShapes([]);
      setHistory([]);
      setSelected(null);
      setFound(null);
      setSize(null);
      scan();
    }
  }, [isOpen, item.image?.key, scan]);

  const measure = useCallback(() => {
    const image = img.current;
    const box = wrap.current;
    if (!image || !box || !image.naturalWidth) return;
    const scale = Math.min(
      box.clientWidth / image.naturalWidth,
      (window.innerHeight * 0.58) / image.naturalHeight,
    );
    setSize({
      W: Math.round(image.naturalWidth * scale),
      H: Math.round(image.naturalHeight * scale),
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!size || !img.current) return;
    const { W, H } = size;
    const longest = Math.max(W, H);
    const block = Math.max(1, Math.round((longest * intensity) / 450));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(W / block));
    small.height = Math.max(1, Math.round(H / block));
    const sctx = small.getContext("2d");
    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const lctx = layer.getContext("2d");
    if (!sctx || !lctx) return;
    sctx.drawImage(img.current, 0, 0, small.width, small.height);
    lctx.imageSmoothingEnabled = false;
    lctx.filter = `blur(${longest * (0.004 + 0.0022 * intensity)}px)`;
    lctx.drawImage(small, 0, 0, W, H);
    blurLayer.current = layer;
  }, [size, intensity]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !size || !img.current) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { W, H } = size;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img.current, 0, 0, W, H);
    const all = draft ? [...shapes, draft] : shapes;
    if (blurLayer.current && all.length) {
      const mask = document.createElement("canvas");
      mask.width = W;
      mask.height = H;
      const mctx = mask.getContext("2d");
      mctx.filter = `blur(${Math.max(1, Math.max(W, H) / 400)}px)`;
      paintMask(mctx, all, W, H);
      mctx.filter = "none";
      mctx.globalCompositeOperation = "source-in";
      mctx.drawImage(blurLayer.current, 0, 0);
      ctx.drawImage(mask, 0, 0);
    }
    all.forEach((s) => {
      const isSel = s.id === selected;
      if (s.type === "brush" && !isSel) return;
      ctx.save();
      ctx.lineWidth = isSel ? 2 : 1.5;
      ctx.setLineDash(isSel ? [] : [5, 4]);
      ctx.strokeStyle = s.face
        ? "#f06548"
        : isSel
          ? "#299cdb"
          : "rgba(255,255,255,0.9)";
      if (s.type === "brush") {
        const b = bounds(s);
        ctx.strokeRect(b.x * W, b.y * H, b.w * W, b.h * H);
      } else {
        shapePath(ctx, s, W, H);
        ctx.stroke();
      }
      if (isSel && s.type !== "brush") {
        ctx.setLineDash([]);
        ctx.fillStyle = "#299cdb";
        ctx.fillRect(
          (s.x + s.w) * W - HANDLE / 2,
          (s.y + s.h) * H - HANDLE / 2,
          HANDLE,
          HANDLE,
        );
      }
      ctx.restore();
    });
    if (tool === "brush" && hover) {
      ctx.save();
      ctx.strokeStyle = "#299cdb";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(
        hover.x * W,
        hover.y * H,
        ((brush / 100) * W) / 2,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
  }, [shapes, draft, selected, size, intensity, tool, hover, brush]);

  const point = (e) => {
    const rect = canvas.current.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  };

  const down = (e) => {
    if (busy || !size) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = point(e);
    const { W, H } = size;
    if (tool === "select") {
      const sel = shapes.find((s) => s.id === selected);
      if (
        sel &&
        sel.type !== "brush" &&
        Math.abs((sel.x + sel.w) * W - p.x * W) <= HANDLE &&
        Math.abs((sel.y + sel.h) * H - p.y * H) <= HANDLE
      ) {
        drag.current = { mode: "resize", start: p, before: shapes, shape: sel };
        return;
      }
      const hit = [...shapes].reverse().find((s) => hits(s, p, W, H));
      setSelected(hit ? hit.id : null);
      if (hit)
        drag.current = { mode: "move", start: p, before: shapes, shape: hit };
      return;
    }
    if (tool === "brush") {
      setDraft({
        id: nextId++,
        type: "brush",
        size: brush / 100,
        points: [[p.x, p.y]],
      });
      drag.current = { mode: "brush" };
      return;
    }
    setDraft({ id: nextId++, type: tool, x: p.x, y: p.y, w: 0, h: 0 });
    drag.current = { mode: "draw", start: p };
  };

  const move = (e) => {
    if (!size) return;
    const p = point(e);
    setHover(p);
    const d = drag.current;
    if (!d) return;
    if (d.mode === "brush") {
      setDraft((cur) => {
        const last = cur.points[cur.points.length - 1];
        return Math.hypot(last[0] - p.x, last[1] - p.y) < 0.003
          ? cur
          : { ...cur, points: [...cur.points, [p.x, p.y]] };
      });
    } else if (d.mode === "draw") {
      setDraft((cur) => ({
        ...cur,
        x: Math.min(d.start.x, p.x),
        y: Math.min(d.start.y, p.y),
        w: Math.abs(p.x - d.start.x),
        h: Math.abs(p.y - d.start.y),
      }));
    } else {
      const dx = p.x - d.start.x;
      const dy = p.y - d.start.y;
      const s = d.shape;
      const changed =
        d.mode === "resize"
          ? {
              ...s,
              w: clamp(s.w + dx, MIN_SIZE, 1 - s.x),
              h: clamp(s.h + dy, MIN_SIZE, 1 - s.y),
            }
          : s.type === "brush"
            ? {
                ...s,
                points: s.points.map(([x, y]) => [
                  clamp(x + dx),
                  clamp(y + dy),
                ]),
              }
            : {
                ...s,
                x: clamp(s.x + dx, 0, 1 - s.w),
                y: clamp(s.y + dy, 0, 1 - s.h),
              };
      setShapes(d.before.map((x) => (x.id === s.id ? changed : x)));
    }
  };

  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.mode === "brush" && draft) {
      commit([...shapes, draft]);
      setDraft(null);
    } else if (d.mode === "draw" && draft) {
      if (draft.w > MIN_SIZE && draft.h > MIN_SIZE) {
        commit([...shapes, draft]);
        setSelected(draft.id);
      }
      setDraft(null);
    } else if (d.mode === "move" || d.mode === "resize") {
      setHistory((h) => [...h.slice(-49), d.before]);
    }
  };

  const removeSelected = useCallback(() => {
    if (selected === null) return;
    commit(shapes.filter((s) => s.id !== selected));
    setSelected(null);
  }, [commit, selected, shapes]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setShapes(h[h.length - 1]);
      setSelected(null);
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Delete" || e.key === "Backspace") removeSelected();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, removeSelected, undo]);

  const apply = async () => {
    const updated = await act(
      "blur",
      () => blurContentImage(item.id, toPayload(shapes), intensity),
      `${shapes.length} area${shapes.length === 1 ? "" : "s"} blurred`,
    );
    if (updated) {
      onBlurred(updated);
      onClose();
    }
  };

  const faceWeak = intensity < 6 && shapes.some((s) => s.face);
  const n = shapes.length;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl" centered>
      <ModalHeader toggle={onClose}>
        <i className="bx bx-hide me-1" />
        Blur faces and private details
      </ModalHeader>
      <ModalBody>
        {justUploaded && (
          <div className="alert alert-warning py-2" style={{ fontSize: 13 }}>
            <strong>Check this photo before using it.</strong> Patients&apos;
            faces must never be shown without written consent.
          </div>
        )}
        <div className="d-flex flex-wrap gap-3 align-items-center mb-2">
          <ButtonGroup size="sm">
            {TOOLS.map(([id, icon, label]) => (
              <Button
                key={id}
                color="primary"
                outline={tool !== id}
                title={label}
                onClick={() => setTool(id)}
              >
                <i className={`${icon} me-1`} />
                {label.split(",")[0]}
              </Button>
            ))}
          </ButtonGroup>
          {tool === "brush" && (
            <div
              className="d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <span className="text-muted">Brush size</span>
              <Input
                type="range"
                min={1}
                max={20}
                value={brush}
                onChange={(e) => setBrush(Number(e.target.value))}
                style={{ width: 120 }}
                aria-label="Brush size"
              />
            </div>
          )}
          <div
            className="d-flex align-items-center gap-2"
            style={{ fontSize: 13 }}
          >
            <span className="text-muted">Blur strength</span>
            <span className="text-muted" style={{ fontSize: 11 }}>
              Light
            </span>
            <Input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              style={{ width: 140 }}
              aria-label="Blur strength"
            />
            <span className="text-muted" style={{ fontSize: 11 }}>
              Strong
            </span>
            <Badge color="dark" pill>
              {intensity}
            </Badge>
          </div>
          <div className="d-flex gap-2 ms-auto">
            <Button
              size="sm"
              color="secondary"
              outline
              disabled={!history.length}
              onClick={undo}
              title="Ctrl+Z"
            >
              <i className="bx bx-undo" /> Undo
            </Button>
            <Button
              size="sm"
              color="danger"
              outline
              disabled={selected === null}
              onClick={removeSelected}
              title="Delete key"
            >
              <i className="bx bx-trash" /> Delete selected
            </Button>
          </div>
        </div>
        <div
          className="d-flex flex-wrap gap-2 align-items-center mb-2"
          style={{ fontSize: 13 }}
        >
          {scanning ? (
            <>
              <Spinner size="sm" color="primary" /> Looking for faces…
            </>
          ) : found === null ? null : found > 0 ? (
            <span>
              <Badge color="danger" pill>
                {found} face{found === 1 ? "" : "s"} found
              </Badge>{" "}
              and circled in red.
            </span>
          ) : (
            <Badge color="secondary" pill>
              No faces found automatically
            </Badge>
          )}
          <span className="text-muted">
            Draw circles, rectangles or brush over anything else to hide. Use
            Select to move a shape or drag its blue corner to resize it.
          </span>
        </div>
        {faceWeak && (
          <div
            className="alert alert-danger py-1 mb-2"
            style={{ fontSize: 12 }}
          >
            Faces need strength 6 or more so they can&apos;t be recognised.
          </div>
        )}
        <div
          ref={wrap}
          className="d-flex justify-content-center rounded"
          style={{ background: "#f3f6f9", minHeight: 200 }}
        >
          {item.image && (
            <img
              ref={img}
              src={item.image.url}
              alt="Post"
              onLoad={measure}
              style={{ display: "none" }}
            />
          )}
          {size ? (
            <canvas
              ref={canvas}
              width={size.W}
              height={size.H}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerLeave={() => setHover(null)}
              style={{
                touchAction: "none",
                cursor:
                  tool === "select"
                    ? "pointer"
                    : tool === "brush"
                      ? "none"
                      : "crosshair",
                borderRadius: 6,
                maxWidth: "100%",
              }}
            />
          ) : (
            <div
              className="d-flex align-items-center gap-2 text-muted"
              style={{ fontSize: 13 }}
            >
              <Spinner size="sm" /> Loading the photo…
            </div>
          )}
        </div>
        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
          The preview shows the blur as it will be saved. Faces are found on our
          own server; the photo is not sent to any AI service. Saving makes a
          new file and deletes the unblurred one, so it can&apos;t be undone.
        </div>
      </ModalBody>
      <ModalFooter className="justify-content-between">
        <div className="d-flex gap-2">
          <Button
            color="secondary"
            outline
            size="sm"
            disabled={scanning || !!busy}
            onClick={scan}
          >
            <i className="bx bx-scan me-1" />
            Find faces again
          </Button>
          <Button
            color="secondary"
            outline
            size="sm"
            disabled={!n || !!busy}
            onClick={() => {
              commit([]);
              setSelected(null);
            }}
          >
            Clear all
          </Button>
        </div>
        <div className="d-flex gap-2">
          <Button color="secondary" outline onClick={onClose} disabled={!!busy}>
            {justUploaded ? "Nothing to hide" : "Cancel"}
          </Button>
          <Button color="danger" disabled={!n || !!busy} onClick={apply}>
            {busy ? "Blurring…" : `Blur ${n || ""} area${n === 1 ? "" : "s"}`}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default BlurTool;
