import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
} from "reactstrap";
import {
  cancelPublication,
  getContentList,
  getControls,
  getPublications,
  markPublished,
  runPublish,
  schedulePublication,
  setControls,
} from "../../helpers/marketingAgentApi";
import {
  CHANNELS as CHANNEL_CHOICES,
  CitySelect,
  DateRange,
  Empty,
  FilterSelect,
  Loading,
  PageHeader,
  Pager,
  SearchBox,
  StateBadge,
  dayEnd,
  dayStart,
  formatDateTime,
  notifyError,
  useAction,
  useAgentAccess,
  useJob,
  usePagedList,
} from "./common";

const CHANNELS = CHANNEL_CHOICES.map(([value]) => value);

const ScheduleModal = ({ item, onClose, onDone }) => {
  const [channel, setChannel] = useState(item.channel);
  const [when, setWhen] = useState("");
  const [media, setMedia] = useState("");
  const [manual, setManual] = useState(item.channel === "youtube");
  const { act, busy } = useAction();

  const submit = async () => {
    const pub = await act(
      "schedule",
      () =>
        schedulePublication({
          content_id: item.id,
          channel,
          scheduled_at: when ? new Date(when).toISOString() : null,
          media_urls: media
            .split("\n")
            .map((m) => m.trim())
            .filter(Boolean),
          manual,
        }),
      "Scheduled",
    );
    if (pub) onDone();
  };

  return (
    <Modal isOpen toggle={onClose}>
      <ModalHeader toggle={onClose}>
        Schedule “{item.body.headline}”
      </ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label>Channel</Label>
          <Input
            type="select"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Input>
        </FormGroup>
        <FormGroup>
          <Label>When (leave empty for the planned day at 10:00)</Label>
          <Input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>
            Image or video links, one per line. Leave empty to use the post's
            image.
          </Label>
          <Input
            type="textarea"
            rows={3}
            value={media}
            onChange={(e) => setMedia(e.target.value)}
          />
        </FormGroup>
        <FormGroup check>
          <Input
            type="checkbox"
            id="manual"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          <Label check for="manual">
            I'll post it by hand and paste the link afterwards
          </Label>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" disabled={busy === "schedule"} onClick={submit}>
          Schedule
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const POST_STATUS = [
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
];

const Publishing = () => {
  const [controls, setControlsState] = useState(null);
  const [readyQ, setReadyQ] = useState("");
  const [readyCity, setReadyCity] = useState("");
  const [readyChannel, setReadyChannel] = useState("");
  const ready = usePagedList(getContentList, {
    state: "approved",
    q: readyQ,
    city: readyCity,
    channel: readyChannel,
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [city, setCity] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const posts = usePagedList(getPublications, {
    q,
    status,
    channel,
    city,
    since: dayStart(since),
    until: dayEnd(until),
  });
  const [scheduling, setScheduling] = useState(null);
  const [marking, setMarking] = useState(null);
  const [url, setUrl] = useState("");
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const lead = can("PUBLISHING");
  const adsLead = can("ADS");

  useEffect(() => {
    getControls().then(setControlsState).catch(notifyError);
  }, []);

  const load = () => {
    ready.reload();
    posts.reload();
  };

  const toggle = async (field) => {
    const updated = await act(
      field,
      () => setControls({ [field]: !controls[field] }),
      "Updated",
    );
    if (updated) setControlsState(updated);
  };

  return (
    <div className="p-3">
      <PageHeader
        title="Publishing"
        subtitle="Approved content goes out on schedule. Every link is tagged so enquiries can be traced back to the post."
      >
        {lead && (
          <Button
            size="sm"
            color="primary"
            disabled={running}
            onClick={async () =>
              (await run(runPublish, {
                successText: "Publish run finished",
              })) && load()
            }
          >
            Publish due posts now
          </Button>
        )}
      </PageHeader>

      {controls && (
        <Alert
          color={
            controls.publishing_paused || controls.ads_paused
              ? "danger"
              : "light"
          }
          className="d-flex flex-wrap gap-3 align-items-center"
        >
          <span>
            Publishing:{" "}
            <strong>{controls.publishing_paused ? "PAUSED" : "running"}</strong>{" "}
            · Ads: <strong>{controls.ads_paused ? "PAUSED" : "running"}</strong>
          </span>
          {lead && (
            <Button
              size="sm"
              color={controls.publishing_paused ? "success" : "danger"}
              outline
              disabled={!!busy}
              onClick={() => toggle("publishing_paused")}
            >
              {controls.publishing_paused
                ? "Resume publishing"
                : "Pause all publishing"}
            </Button>
          )}
          {adsLead && (
            <Button
              size="sm"
              color={controls.ads_paused ? "success" : "danger"}
              outline
              disabled={!!busy}
              onClick={() => toggle("ads_paused")}
            >
              {controls.ads_paused ? "Resume ads" : "Pause all ads"}
            </Button>
          )}
        </Alert>
      )}

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
            <h6 className="mb-0 me-auto">Approved and ready</h6>
            <SearchBox
              onSearch={setReadyQ}
              placeholder="Search topic or text"
            />
            <CitySelect
              value={readyCity}
              onChange={setReadyCity}
              allowAll
              activeOnly={false}
              style={{ width: 150 }}
            />
            <FilterSelect
              value={readyChannel}
              onChange={setReadyChannel}
              options={CHANNEL_CHOICES}
              allLabel="All channels"
            />
          </div>
          {!ready.loading && ready.total === 0 ? (
            <Empty>No approved content waiting.</Empty>
          ) : (
            <Table size="sm" responsive style={{ fontSize: 13 }}>
              <tbody>
                {ready.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-semibold">{c.body.headline}</div>
                      <div className="text-muted">
                        {c.city} · {c.format.replace(/_/g, " ")} · {c.channel} ·{" "}
                        {c.language}
                      </div>
                    </td>
                    <td className="text-end">
                      {lead && (
                        <Button
                          size="sm"
                          color="primary"
                          outline
                          onClick={() => setScheduling(c)}
                        >
                          Schedule
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pager list={ready} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
            <h6 className="mb-0 me-auto">Posts</h6>
            <SearchBox onSearch={setQ} placeholder="Search post text or link" />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={POST_STATUS}
              allLabel="All statuses"
            />
            <FilterSelect
              value={channel}
              onChange={setChannel}
              options={CHANNEL_CHOICES}
              allLabel="All channels"
            />
            <CitySelect
              value={city}
              onChange={setCity}
              allowAll
              activeOnly={false}
              style={{ width: 150 }}
            />
            <DateRange
              since={since}
              until={until}
              onSince={setSince}
              onUntil={setUntil}
              label="Scheduled"
            />
          </div>
          {posts.loading && posts.items.length === 0 ? (
            <Loading />
          ) : posts.total === 0 ? (
            <Empty>No posts match.</Empty>
          ) : (
            <Table size="sm" responsive style={{ fontSize: 13 }}>
              <thead className="table-light">
                <tr>
                  <th>When</th>
                  <th>Channel</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {posts.items.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.published_at || p.scheduled_at)}</td>
                    <td>
                      {p.channel}
                      {p.manual && <div className="text-muted">by hand</div>}
                    </td>
                    <td className="text-capitalize">{p.city}</td>
                    <td>
                      <StateBadge state={p.status} />
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noreferrer">
                          View post
                        </a>
                      )}
                      {p.error && <div className="text-danger">{p.error}</div>}
                    </td>
                    <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                      {lead && ["scheduled", "failed"].includes(p.status) && (
                        <Button
                          size="sm"
                          color="link"
                          onClick={() => {
                            setMarking(p);
                            setUrl("");
                          }}
                        >
                          Mark published
                        </Button>
                      )}
                      {lead && p.status === "scheduled" && (
                        <Button
                          size="sm"
                          color="link"
                          className="text-danger"
                          disabled={busy === p.id}
                          onClick={async () =>
                            (await act(
                              p.id,
                              () => cancelPublication(p.id),
                              "Cancelled",
                            )) && posts.reload()
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pager list={posts} />
        </CardBody>
      </Card>

      {scheduling && (
        <ScheduleModal
          item={scheduling}
          onClose={() => setScheduling(null)}
          onDone={() => {
            setScheduling(null);
            load();
          }}
        />
      )}
      {marking && (
        <Modal isOpen toggle={() => setMarking(null)}>
          <ModalHeader toggle={() => setMarking(null)}>
            Paste the link of the published post
          </ModalHeader>
          <ModalBody>
            <Input
              value={url}
              placeholder="https://"
              onChange={(e) => setUrl(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              disabled={url.length < 8 || busy === "mark"}
              onClick={async () => {
                const done = await act(
                  "mark",
                  () => markPublished(marking.id, url),
                  "Marked as published",
                );
                if (done) {
                  setMarking(null);
                  load();
                }
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default Publishing;
