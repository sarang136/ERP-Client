import React, { useRef, useState } from "react";
import { Button, Input, Spinner } from "reactstrap";
import {
  generateContentImage,
  getContent,
  makeReel,
  removeContentImage,
  removeContentVideo,
  uploadContentImage,
  uploadContentVideo,
} from "../../helpers/marketingAgentApi";
import { formatDateTime, useAction, useJob } from "./common";

const PAGE_NAME = "Jagruti Rehabilitation Centre";
const HANDLE = "jagrutirehab";

const frame = {
  maxWidth: 420,
  background: "#fff",
  border: "1px solid #dbdbdb",
  borderRadius: 10,
  overflow: "hidden",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontSize: 14,
  color: "#1c1e21",
};

const Avatar = ({ size = 32 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #0045a5, #2fa4e7)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: size * 0.45,
      flexShrink: 0,
    }}
  >
    J
  </div>
);

const Header = ({ name, sub }) => (
  <div className="d-flex align-items-center gap-2" style={{ padding: 10 }}>
    <Avatar />
    <div style={{ lineHeight: 1.2 }}>
      <div style={{ fontWeight: 600 }}>{name}</div>
      {sub && <div style={{ fontSize: 12, color: "#65676b" }}>{sub}</div>}
    </div>
    <div className="ms-auto" style={{ color: "#65676b" }}>
      •••
    </div>
  </div>
);

const Media = ({ image, ratio = "1 / 1", children }) => (
  <div
    style={{
      position: "relative",
      aspectRatio: ratio,
      background: image ? "#000" : "#f0f2f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {image ? (
      <img
        src={image.url}
        alt="Post visual"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <span style={{ color: "#8a8d91", fontSize: 13 }}>No image yet</span>
    )}
    {children}
  </div>
);

const Tags = ({ tags }) =>
  tags?.length > 0 ? (
    <div style={{ color: "#00376b", marginTop: 4 }}>
      {tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}
    </div>
  ) : null;

const Caption = ({ body, cta }) => (
  <div style={{ whiteSpace: "pre-wrap" }}>
    {body}
    {cta && `\n\n${cta}`}
  </div>
);

const Carousel = ({ image, slides, ratio }) => {
  const [index, setIndex] = useState(0);
  const last = slides.length - 1;
  const arrow = (side) => ({
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
  });
  return (
    <Media image={image} ratio={ratio}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          padding: 16,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 60%)",
        }}
      >
        <div style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>
          {slides[index]}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 12,
          padding: "2px 8px",
          fontSize: 12,
        }}
      >
        {index + 1}/{slides.length}
      </div>
      {index > 0 && (
        <button
          type="button"
          style={arrow("left")}
          onClick={() => setIndex(index - 1)}
          aria-label="Previous slide"
        >
          ‹
        </button>
      )}
      {index < last && (
        <button
          type="button"
          style={arrow("right")}
          onClick={() => setIndex(index + 1)}
          aria-label="Next slide"
        >
          ›
        </button>
      )}
    </Media>
  );
};

const Instagram = ({ item }) => {
  const b = item.body;
  const reel = item.format === "reel_script";
  const slides = b.slides?.length ? b.slides : null;
  return (
    <div style={frame}>
      <Header name={HANDLE} sub={reel ? "Reels" : null} />
      {reel && item.video ? (
        <video
          src={item.video.url}
          poster={item.image?.url}
          controls
          playsInline
          style={{
            width: "100%",
            aspectRatio: "9 / 16",
            background: "#000",
            display: "block",
          }}
        />
      ) : reel && !item.image ? (
        <div
          style={{
            aspectRatio: "9 / 16",
            background: "linear-gradient(160deg, #0045a5, #11182b)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 40 }}>▶</div>
          <div style={{ fontWeight: 600 }}>No video yet</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Film it from the script, then upload it here.
          </div>
        </div>
      ) : slides ? (
        <Carousel image={item.image} slides={slides} ratio="4 / 5" />
      ) : (
        <Media image={item.image} ratio={reel ? "9 / 16" : "1 / 1"}>
          {reel && (
            <div
              style={{
                position: "absolute",
                fontSize: 48,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              ▶
            </div>
          )}
        </Media>
      )}
      <div style={{ padding: "8px 12px", fontSize: 20 }}>♡ 💬 ➤</div>
      <div style={{ padding: "0 12px 12px" }}>
        <span style={{ fontWeight: 600 }}>{HANDLE}</span>{" "}
        <Caption body={b.body} cta={b.cta} />
        <Tags tags={b.hashtags} />
      </div>
    </div>
  );
};

const FeedPost = ({ item, sub, actions }) => {
  const b = item.body;
  const slides = b.slides?.length ? b.slides : null;
  return (
    <div style={frame}>
      <Header name={PAGE_NAME} sub={sub} />
      <div style={{ padding: "0 12px 10px" }}>
        <Caption body={b.body} cta={b.cta} />
        <Tags tags={b.hashtags} />
      </div>
      {slides ? (
        <Carousel image={item.image} slides={slides} ratio="1 / 1" />
      ) : (
        <Media image={item.image} ratio="1.91 / 1" />
      )}
      <div
        className="d-flex justify-content-around"
        style={{
          borderTop: "1px solid #e4e6eb",
          padding: 8,
          color: "#65676b",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {actions.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </div>
  );
};

const Ad = ({ item }) => {
  const b = item.body;
  return (
    <div style={frame}>
      <Header name={PAGE_NAME} sub="Sponsored" />
      <div style={{ padding: "0 12px 10px", whiteSpace: "pre-wrap" }}>
        {b.body}
      </div>
      <Media image={item.image} ratio="1 / 1" />
      <div
        className="d-flex align-items-center gap-2"
        style={{ background: "#f0f2f5", padding: "10px 12px" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#65676b" }}>JAGRUTIREHAB.ORG</div>
          <div style={{ fontWeight: 600 }}>{b.headline}</div>
        </div>
        <button
          type="button"
          style={{
            background: "#e4e6eb",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            fontWeight: 600,
          }}
        >
          Learn more
        </button>
      </div>
    </div>
  );
};

const GoogleUpdate = ({ item }) => {
  const b = item.body;
  return (
    <div style={frame}>
      <Header name={PAGE_NAME} sub="Update on Google" />
      <Media image={item.image} ratio="4 / 3" />
      <div style={{ padding: 12 }}>
        <div style={{ whiteSpace: "pre-wrap" }}>{b.body}</div>
        <button
          type="button"
          style={{
            marginTop: 10,
            background: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 18,
            padding: "6px 16px",
            fontWeight: 500,
          }}
        >
          Learn more
        </button>
      </div>
    </div>
  );
};

const WebPage = ({ item }) => {
  const b = item.body;
  return (
    <div style={{ ...frame, maxWidth: 560 }}>
      <div
        style={{
          background: "#f1f3f4",
          padding: "6px 10px",
          fontSize: 12,
          color: "#5f6368",
        }}
      >
        www.jagrutirehab.org
      </div>
      <Media image={item.image} ratio="16 / 9" />
      <div style={{ padding: 16 }}>
        <h4 style={{ fontWeight: 700 }}>{b.headline}</h4>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{b.body}</div>
        <div style={{ marginTop: 12, fontWeight: 600, color: "#0045a5" }}>
          {b.cta}
        </div>
      </div>
    </div>
  );
};

export const PostPreview = ({ item }) => {
  if (item.format === "ad_copy") return <Ad item={item} />;
  if (item.format === "gbp_post" || item.channel === "gbp")
    return <GoogleUpdate item={item} />;
  if (
    item.format === "city_page" ||
    item.format === "blog" ||
    item.channel === "website"
  )
    return <WebPage item={item} />;
  if (item.channel === "instagram" || item.channel === "youtube")
    return <Instagram item={item} />;
  if (item.channel === "linkedin")
    return (
      <FeedPost
        item={item}
        sub="Healthcare · 1,000+ followers"
        actions={["👍 Like", "💬 Comment", "🔁 Repost", "➤ Send"]}
      />
    );
  return (
    <FeedPost
      item={item}
      sub="Just now · 🌐"
      actions={["👍 Like", "💬 Comment", "↪ Share"]}
    />
  );
};

export const ImageTools = ({ item, onChanged, canEdit }) => {
  const [prompt, setPrompt] = useState(null);
  const file = useRef(null);
  const { act, busy } = useAction();
  const image = item.image;

  const done = (updated) => {
    if (updated) {
      setPrompt(null);
      onChanged(updated);
    }
  };

  const regenerate = async (text) =>
    done(
      await act(
        "image",
        () => generateContentImage(item.id, text),
        "New image ready",
      ),
    );

  const upload = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    done(
      await act(
        "image",
        () => uploadContentImage(item.id, chosen),
        "Image uploaded",
      ),
    );
  };

  return (
    <div style={{ fontSize: 13 }}>
      <div className="fw-semibold mb-1">
        {item.format === "reel_script" ? "Cover image (optional)" : "Image"}
      </div>
      <div className="text-muted mb-2">
        {image
          ? `${image.source === "uploaded" ? "Uploaded" : "Made by AI"} · ${formatDateTime(image.created_at)}`
          : "No image yet."}
      </div>
      {busy === "image" && (
        <div className="d-flex align-items-center gap-2 mb-2">
          <Spinner size="sm" color="primary" /> Working on the image…
        </div>
      )}
      {canEdit && (
        <>
          <div className="d-flex flex-wrap gap-2">
            <Button
              size="sm"
              color="secondary"
              outline
              disabled={!!busy}
              onClick={() => file.current?.click()}
            >
              Upload your own
            </Button>
            <Button
              size="sm"
              color="primary"
              outline
              disabled={!!busy}
              onClick={() => regenerate(null)}
            >
              {image ? "Regenerate" : "Make an image"}
            </Button>
            {image && (
              <Button
                size="sm"
                color="danger"
                outline
                disabled={!!busy}
                onClick={async () =>
                  done(
                    await act(
                      "image",
                      () => removeContentImage(item.id),
                      "Image removed",
                    ),
                  )
                }
              >
                Remove image
              </Button>
            )}
            <Button
              size="sm"
              color="primary"
              outline
              disabled={!!busy}
              onClick={() =>
                setPrompt(image?.prompt || item.body.image_prompt || "")
              }
            >
              Regenerate with my prompt
            </Button>
          </div>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={upload}
          />
          {prompt !== null && (
            <div className="mt-2">
              <Input
                type="textarea"
                rows={3}
                value={prompt}
                placeholder="Describe the picture you want"
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="primary"
                  disabled={!!busy || prompt.trim().length < 3}
                  onClick={() => regenerate(prompt.trim())}
                >
                  Make this image
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  outline
                  onClick={() => setPrompt(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className="text-muted mt-2" style={{ fontSize: 12 }}>
            The previous image is deleted when you upload or make a new one.
          </div>
        </>
      )}
    </div>
  );
};

export const VideoTools = ({ item, onChanged, canEdit }) => {
  const [progress, setProgress] = useState(null);
  const file = useRef(null);
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const video = item.video;

  const [script, setScript] = useState(null);

  const generate = async (ownScript) => {
    setScript(null);
    const job = await run(() => makeReel(item.id, ownScript), {
      successText: "Reel made: check the preview",
    });
    if (job) onChanged(await getContent(item.id));
  };

  const upload = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    setProgress(0);
    const updated = await act(
      "video",
      () => uploadContentVideo(item.id, chosen, setProgress),
      "Reel video uploaded",
    );
    setProgress(null);
    if (updated) onChanged(updated);
  };

  const remove = async () => {
    const updated = await act(
      "video",
      () => removeContentVideo(item.id),
      "Video removed",
    );
    if (updated) onChanged(updated);
  };

  return (
    <div style={{ fontSize: 13 }} className="mb-3">
      <div className="fw-semibold mb-1">Reel video</div>
      <div className="text-muted mb-2">
        {video
          ? `${video.source === "generated" ? `Made by AI · ${video.scenes} scenes` : "Uploaded"} · ${(video.size / 1024 / 1024).toFixed(1)} MB · ${formatDateTime(video.created_at)}`
          : "No video yet. Make one with AI from the script, or film it and upload it (MP4, MOV or WebM, up to 200 MB)."}
      </div>
      {running && (
        <div className="d-flex align-items-center gap-2 mb-2">
          <Spinner size="sm" color="primary" /> Making the reel: pictures,
          voice-over and video. About 1–2 minutes…
        </div>
      )}
      {progress !== null && (
        <div className="d-flex align-items-center gap-2 mb-2">
          <Spinner size="sm" color="primary" /> Uploading… {progress}%
        </div>
      )}
      {canEdit && (
        <div className="d-flex flex-wrap gap-2">
          <Button
            size="sm"
            color="primary"
            disabled={!!busy || running}
            onClick={() => generate(null)}
          >
            {video?.source === "generated"
              ? "Make reel again with AI"
              : "Make reel with AI"}
          </Button>
          <Button
            size="sm"
            color="primary"
            outline
            disabled={!!busy || running}
            onClick={() => setScript(item.body.script || "")}
          >
            Make reel with my script
          </Button>
          <Button
            size="sm"
            color="primary"
            outline
            disabled={!!busy || running}
            onClick={() => file.current?.click()}
          >
            {video ? "Replace with my video" : "Upload my video"}
          </Button>
          {video && (
            <Button
              size="sm"
              color="danger"
              outline
              disabled={!!busy}
              onClick={remove}
            >
              Remove video
            </Button>
          )}
          <input
            ref={file}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            hidden
            onChange={upload}
          />
        </div>
      )}
      {script !== null && (
        <div className="mt-2">
          <Input
            type="textarea"
            rows={10}
            value={script}
            placeholder="Write the scenes and voice-over lines"
            onChange={(e) => setScript(e.target.value)}
          />
          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
            Your script is saved to this post and checked against the rules
            first. The reel is made only if it passes, and the post goes back
            for approval.
          </div>
          <div className="d-flex gap-2 mt-2">
            <Button
              size="sm"
              color="primary"
              disabled={script.trim().length < 20 || running}
              onClick={() => generate(script.trim())}
            >
              Check and make reel
            </Button>
            <Button
              size="sm"
              color="secondary"
              outline
              onClick={() => setScript(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
