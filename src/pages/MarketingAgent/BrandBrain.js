import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Table,
} from "reactstrap";
import {
  addBannedPhrase,
  addCity,
  addFact,
  deleteCity,
  deleteFact,
  getBannedPhrases,
  crawlWebsite,
  getCities,
  getFacts,
  getPlaybook,
  getPrompts,
  getWebsitePages,
  removeBannedPhrase,
  resetPrompt,
  savePrompt,
  retireFact,
  searchWebsite,
  setPlaybook,
  updateCity,
  updateFact,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FilterSelect,
  PageHeader,
  Pager,
  SearchBox,
  formatDate,
  labelOf,
  notifyError,
  refreshCities,
  useAction,
  useAgentAccess,
  useDefaultCity,
  useJob,
  usePagedList,
  CHANNELS,
  ChoiceChecks,
  FORMAT_CHOICES,
} from "./common";

const CONDITIONS = [
  "alcohol",
  "drugs",
  "psychiatric",
  "dual_diagnosis",
  "general",
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "hinglish", label: "Hinglish" },
];
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => [l.value, l.label]);
const LANGUAGE_NAME = Object.fromEntries(LANGUAGE_OPTIONS);

const FACT_STATUS = [
  ["true", "Active"],
  ["false", "Retired"],
];

const FactEditor = ({ fact, onClose, onSaved }) => {
  const [form, setForm] = useState({
    text: fact.text,
    condition: fact.condition,
    language: fact.language,
    source: fact.source || "",
    expires_at: fact.expires_at ? fact.expires_at.slice(0, 10) : "",
  });
  const { act, busy } = useAction();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const reworded =
    form.text.trim() !== fact.text ||
    form.condition !== fact.condition ||
    form.language !== fact.language;

  const save = async () => {
    const saved = await act(
      "save",
      () =>
        updateFact(fact.id, {
          text: form.text.trim(),
          condition: form.condition,
          language: form.language,
          source: form.source.trim() || null,
          expires_at: form.expires_at
            ? new Date(form.expires_at).toISOString()
            : null,
        }),
      "Fact saved",
    );
    if (saved) onSaved();
  };

  return (
    <Modal isOpen toggle={onClose}>
      <ModalHeader toggle={onClose}>Edit {fact.id}</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label>Fact</Label>
          <Input
            type="textarea"
            rows={4}
            value={form.text}
            onChange={(e) => set({ text: e.target.value })}
          />
        </FormGroup>
        <FormGroup className="d-flex gap-2">
          <FilterSelect
            value={form.condition}
            onChange={(v) => set({ condition: v })}
            options={CONDITIONS}
            style={{ width: "100%" }}
          />
          <FilterSelect
            value={form.language}
            onChange={(v) => set({ language: v })}
            options={LANGUAGE_OPTIONS}
            style={{ width: "100%" }}
          />
        </FormGroup>
        <FormGroup>
          <Label>Source</Label>
          <Input
            bsSize="sm"
            value={form.source}
            placeholder="Guideline or reference"
            onChange={(e) => set({ source: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <Label>Review again by</Label>
          <Input
            type="date"
            bsSize="sm"
            value={form.expires_at}
            onChange={(e) => set({ expires_at: e.target.value })}
          />
        </FormGroup>
        {reworded && (
          <div
            className="alert alert-warning py-2 mb-0"
            style={{ fontSize: 13 }}
          >
            Changing the wording, condition or language counts as a new approval
            by you. Posts already written keep their text.
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button size="sm" color="secondary" outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          color="primary"
          disabled={form.text.trim().length < 10 || !!busy}
          onClick={save}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const Facts = () => {
  const [q, setQ] = useState("");
  const [condition, setCondition] = useState("");
  const [language, setLanguage] = useState("");
  const [active, setActive] = useState("true");
  const list = usePagedList(getFacts, { q, condition, language, active });
  const [form, setForm] = useState({
    id: "",
    text: "",
    condition: "alcohol",
    language: "en",
    source: "",
    expires_at: "",
  });
  const { act, busy } = useAction();
  const { can } = useAgentAccess();
  const psychiatrist = can("CLINICAL_APPROVAL");
  const [editing, setEditing] = useState(null);

  const remove = async (fact) => {
    if (
      !window.confirm(
        `Delete ${fact.id}? This can't be undone. Facts that posts have used can only be retired.`,
      )
    )
      return;
    const done = await act(fact.id, () => deleteFact(fact.id), "Fact deleted");
    if (done !== undefined) list.reload();
  };

  const save = async () => {
    const body = {
      ...form,
      id: form.id.toUpperCase(),
      source: form.source || null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
    };
    if (await act("add", () => addFact(body), "Fact added")) {
      setForm({ ...form, id: "", text: "", source: "" });
      list.reload();
    }
  };

  return (
    <Row>
      <Col lg={psychiatrist ? 8 : 12}>
        <p className="text-muted">
          Content may only make clinical statements that come from these facts.
        </p>
        {!psychiatrist && (
          <div className="alert alert-info py-2" style={{ fontSize: 13 }}>
            You can view facts. Adding, editing, retiring and deleting them
            needs Write on{" "}
            <strong>AI Marketing Agent → Clinical Approval</strong> in Settings
            → Roles & Permissions (usually a psychiatrist).
          </div>
        )}
        <div className="d-flex gap-2 flex-wrap mb-2">
          <SearchBox onSearch={setQ} placeholder="Search id, fact or source" />
          <FilterSelect
            value={condition}
            onChange={setCondition}
            options={CONDITIONS}
            allLabel="All conditions"
          />
          <FilterSelect
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            allLabel="All languages"
          />
          <FilterSelect
            value={active}
            onChange={setActive}
            options={FACT_STATUS}
            allLabel="Active and retired"
          />
        </div>
        {!list.loading && list.total === 0 ? (
          <Empty>No facts match. A psychiatrist adds them.</Empty>
        ) : (
          <Table size="sm" responsive style={{ fontSize: 13 }}>
            <thead className="table-light">
              <tr>
                <th>Id</th>
                <th>Fact</th>
                <th>Condition</th>
                <th>Approved</th>
                <th>Expires</th>
                {psychiatrist && <th />}
              </tr>
            </thead>
            <tbody>
              {list.items.map((f) => (
                <tr key={f.id} className={f.active ? "" : "text-muted"}>
                  <td className="fw-semibold">{f.id}</td>
                  <td>
                    {f.text}
                    {f.source && <div className="text-muted">{f.source}</div>}
                  </td>
                  <td>{labelOf(f.condition)}</td>
                  <td>{formatDate(f.approved_at)}</td>
                  <td>{f.expires_at ? formatDate(f.expires_at) : "-"}</td>
                  {psychiatrist && (
                    <td className="text-nowrap">
                      <Button
                        size="sm"
                        color="link"
                        className="p-0 me-2"
                        onClick={() => setEditing(f)}
                      >
                        Edit
                      </Button>
                      {f.active ? (
                        <Button
                          size="sm"
                          color="link"
                          className="text-warning p-0 me-2"
                          disabled={busy === f.id}
                          onClick={async () =>
                            (await act(
                              f.id,
                              () => retireFact(f.id),
                              "Retired",
                            )) && list.reload()
                          }
                        >
                          Retire
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="link"
                          className="text-success p-0 me-2"
                          disabled={busy === f.id}
                          onClick={async () =>
                            (await act(
                              f.id,
                              () => updateFact(f.id, { active: true }),
                              "Fact active again",
                            )) && list.reload()
                          }
                        >
                          Reactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="link"
                        className="text-danger p-0"
                        disabled={busy === f.id}
                        onClick={() => remove(f)}
                      >
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pager list={list} />
        {editing && (
          <FactEditor
            fact={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              list.reload();
            }}
          />
        )}
      </Col>
      {psychiatrist && (
        <Col lg={4}>
          <Card>
            <CardBody>
              <h6>Add an approved fact</h6>
              <FormGroup>
                <Input
                  bsSize="sm"
                  placeholder="Id, e.g. ALC-WD-001"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="textarea"
                  rows={4}
                  placeholder="The fact, in plain words"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
              </FormGroup>
              <FormGroup className="d-flex gap-2">
                <FilterSelect
                  value={form.condition}
                  onChange={(v) => setForm({ ...form, condition: v })}
                  options={CONDITIONS}
                  style={{ width: "100%" }}
                />
                <FilterSelect
                  value={form.language}
                  onChange={(v) => setForm({ ...form, language: v })}
                  options={LANGUAGE_OPTIONS}
                  style={{ width: "100%" }}
                />
              </FormGroup>
              <FormGroup>
                <Input
                  bsSize="sm"
                  placeholder="Source (guideline or reference)"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label style={{ fontSize: 12 }}>Review again by</Label>
                <Input
                  type="date"
                  bsSize="sm"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </FormGroup>
              <Button
                color="primary"
                size="sm"
                disabled={form.id.length < 3 || form.text.length < 10 || !!busy}
                onClick={save}
              >
                Add fact
              </Button>
            </CardBody>
          </Card>
        </Col>
      )}
    </Row>
  );
};

const Banned = () => {
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const list = usePagedList(getBannedPhrases, { q, language });
  const [form, setForm] = useState({ phrase: "", language: "en", reason: "" });
  const { act, busy } = useAction();
  const { can } = useAgentAccess();
  const lead = can("BRAND");

  return (
    <>
      {lead && (
        <div className="d-flex gap-2 flex-wrap mb-3">
          <Input
            bsSize="sm"
            placeholder="Phrase"
            value={form.phrase}
            onChange={(e) => setForm({ ...form, phrase: e.target.value })}
            style={{ width: 220 }}
          />
          <FilterSelect
            value={form.language}
            onChange={(v) => setForm({ ...form, language: v })}
            options={LANGUAGE_OPTIONS}
            style={{ width: 120 }}
          />
          <Input
            bsSize="sm"
            placeholder="Why it is banned"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            style={{ width: 260 }}
          />
          <Button
            size="sm"
            color="primary"
            disabled={
              form.phrase.length < 2 || form.reason.length < 3 || !!busy
            }
            onClick={async () => {
              if (
                await act("add", () => addBannedPhrase(form), "Phrase banned")
              ) {
                setForm({ ...form, phrase: "", reason: "" });
                list.reload();
              }
            }}
          >
            Ban phrase
          </Button>
        </div>
      )}
      <div className="d-flex gap-2 flex-wrap mb-2">
        <SearchBox onSearch={setQ} placeholder="Search phrase or reason" />
        <FilterSelect
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
          allLabel="All languages"
        />
      </div>
      {!list.loading && list.total === 0 ? (
        <Empty>No banned phrases match.</Empty>
      ) : (
        <Table size="sm" responsive style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>Phrase</th>
              <th>Language</th>
              <th>Rule</th>
              <th>Why</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.items.map((b) => (
              <tr key={b.id}>
                <td className="fw-semibold">{b.phrase}</td>
                <td>{LANGUAGE_NAME[b.language] || b.language}</td>
                <td>
                  <Badge color={b.severity === "block" ? "danger" : "warning"}>
                    {b.rule_id}
                  </Badge>
                </td>
                <td>{b.reason}</td>
                <td className="text-end">
                  {lead && (
                    <Button
                      size="sm"
                      color="link"
                      className="text-danger p-0"
                      disabled={busy === b.id}
                      onClick={async () =>
                        (await act(
                          b.id,
                          () => removeBannedPhrase(b.id),
                          "Removed",
                        )) !== undefined && list.reload()
                      }
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager list={list} />
    </>
  );
};

const CITY_LISTS = [
  {
    key: "aliases",
    label: "Names people use",
    help: "Spellings and areas that mean this city in reviews and enquiries, e.g. bombay, andheri. One per line.",
  },
  {
    key: "page_keys",
    label: "Website page words",
    help: "Words in a website address that mean this city, e.g. pune for /rehab-centre-pune. One per line.",
  },
  {
    key: "exclude_page_keys",
    label: "Page words to skip",
    help: "Addresses that contain the words above but belong to another city, e.g. navi-mumbai for Mumbai. One per line.",
  },
  {
    key: "gbp_location_ids",
    label: "Google Business Profile locations",
    help: "Location ids, e.g. locations/1234567890. One per line.",
  },
];

const EMPTY_CITY = {
  slug: "",
  name: "",
  active: false,
  aliases: "",
  page_keys: "",
  exclude_page_keys: "",
  gbp_location_ids: "",
  alert_webhook_url: "",
  latitude: "",
  longitude: "",
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toForm = (city) => ({
  ...city,
  ...Object.fromEntries(
    CITY_LISTS.map(({ key }) => [key, (city[key] || []).join("\n")]),
  ),
  alert_webhook_url: city.alert_webhook_url || "",
  latitude: city.latitude ?? "",
  longitude: city.longitude ?? "",
});

const fromForm = (form) => ({
  name: form.name.trim(),
  active: form.active,
  ...Object.fromEntries(CITY_LISTS.map(({ key }) => [key, lines(form[key])])),
  alert_webhook_url: form.alert_webhook_url.trim() || null,
  latitude: form.latitude === "" ? null : Number(form.latitude),
  longitude: form.longitude === "" ? null : Number(form.longitude),
});

const CityEditor = ({ city, onClose, onSaved }) => {
  const isNew = !city.slug;
  const [form, setForm] = useState(isNew ? EMPTY_CITY : toForm(city));
  const [slugTouched, setSlugTouched] = useState(false);
  const { act, busy } = useAction();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    const body = fromForm(form);
    const saved = await act(
      "save",
      () =>
        isNew
          ? addCity({ ...body, slug: form.slug })
          : updateCity(city.slug, body),
      isNew ? `${body.name} added` : `${body.name} saved`,
    );
    if (saved) onSaved();
  };

  const coordsValid = ["latitude", "longitude"].every(
    (k) => form[k] === "" || !Number.isNaN(Number(form[k])),
  );

  return (
    <Modal isOpen toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>
        {isNew ? "Add a city" : `Edit ${city.name}`}
      </ModalHeader>
      <ModalBody>
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label>Name</Label>
              <Input
                bsSize="sm"
                value={form.name}
                placeholder="e.g. Surat"
                onChange={(e) =>
                  set({
                    name: e.target.value,
                    ...(isNew && !slugTouched
                      ? { slug: slugify(e.target.value) }
                      : {}),
                  })
                }
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label>Code</Label>
              <Input
                bsSize="sm"
                value={form.slug}
                disabled={!isNew}
                placeholder="e.g. surat"
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: slugify(e.target.value) });
                }}
              />
              <small className="text-muted">
                {isNew
                  ? "Lowercase letters, numbers and dashes. It can't be changed later."
                  : "The code can't be changed."}
              </small>
            </FormGroup>
          </Col>
        </Row>
        <FormGroup switch className="mb-3">
          <Input
            type="switch"
            checked={form.active}
            onChange={(e) => set({ active: e.target.checked })}
          />
          <Label check>
            Switched on (the agent plans, posts and listens for this city)
          </Label>
        </FormGroup>
        <Row>
          {CITY_LISTS.map(({ key, label, help }) => (
            <Col md={6} key={key}>
              <FormGroup>
                <Label>{label}</Label>
                <Input
                  type="textarea"
                  rows={3}
                  value={form[key]}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
                <small className="text-muted">{help}</small>
              </FormGroup>
            </Col>
          ))}
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label>Latitude</Label>
              <Input
                bsSize="sm"
                value={form.latitude}
                placeholder="e.g. 21.1702"
                onChange={(e) => set({ latitude: e.target.value })}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label>Longitude</Label>
              <Input
                bsSize="sm"
                value={form.longitude}
                placeholder="e.g. 72.8311"
                onChange={(e) => set({ longitude: e.target.value })}
              />
            </FormGroup>
          </Col>
        </Row>
        <FormGroup className="mt-2">
          <Label>Centre head alert webhook</Label>
          <Input
            bsSize="sm"
            value={form.alert_webhook_url}
            placeholder="https://… (Slack, Teams or Google Chat incoming webhook)"
            onChange={(e) => set({ alert_webhook_url: e.target.value })}
          />
          <small className="text-muted">
            Bad reviews for this city are sent here within the hour. Leave empty
            to use the main alert webhook.
          </small>
        </FormGroup>
        <small className="text-muted">
          The location is used to aim city ads at people nearby.
        </small>
      </ModalBody>
      <ModalFooter>
        <Button size="sm" color="light" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          color="primary"
          disabled={
            !form.name.trim() ||
            !form.slug ||
            !coordsValid ||
            (form.alert_webhook_url.trim() !== "" &&
              !form.alert_webhook_url.trim().startsWith("https://")) ||
            !!busy
          }
          onClick={save}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const CITY_STATUS = [
  ["true", "Switched on"],
  ["false", "Switched off"],
];

const Cities = () => {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const list = usePagedList(getCities, { q, active });
  const [editing, setEditing] = useState(null);
  const { act, busy } = useAction();
  const { can } = useAgentAccess();
  const lead = can("BRAND");

  const changed = () => {
    list.reload();
    refreshCities();
  };

  const toggle = async (city) =>
    (await act(
      city.slug,
      () => updateCity(city.slug, { active: !city.active }),
      `${city.name} switched ${city.active ? "off" : "on"}`,
    )) && changed();

  const remove = async (city) => {
    const sure = window.confirm(
      `Delete ${city.name}? This can't be undone. A city that already has signals, enquiries, content or ads can only be switched off.`,
    );
    if (!sure) return;
    const done = await act(
      city.slug,
      () => deleteCity(city.slug),
      `${city.name} deleted`,
    );
    if (done !== undefined) changed();
  };

  return (
    <>
      <p className="text-muted">
        Switched-on cities get weekly plans, posts, listening and ads. Switch a
        city off to pause it; delete is only for a city added by mistake.
      </p>
      <div className="d-flex gap-2 flex-wrap mb-2">
        <SearchBox onSearch={setQ} placeholder="Search name, code or area" />
        <FilterSelect
          value={active}
          onChange={setActive}
          options={CITY_STATUS}
          allLabel="All cities"
        />
        {lead && (
          <Button
            size="sm"
            color="primary"
            className="ms-auto"
            onClick={() => setEditing({})}
          >
            Add city
          </Button>
        )}
      </div>
      {!list.loading && list.total === 0 ? (
        <Empty>No cities match.</Empty>
      ) : (
        <Table size="sm" responsive style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>City</th>
              <th>Status</th>
              <th>Names people use</th>
              <th>Website page words</th>
              <th>Location</th>
              {lead && <th />}
            </tr>
          </thead>
          <tbody>
            {list.items.map((c) => (
              <tr key={c.slug}>
                <td>
                  <div className="fw-semibold">{c.name}</div>
                  <div className="text-muted">{c.slug}</div>
                </td>
                <td>
                  <Badge color={c.active ? "success" : "secondary"}>
                    {c.active ? "On" : "Off"}
                  </Badge>
                </td>
                <td>{c.aliases.join(", ") || "-"}</td>
                <td>
                  {c.page_keys.join(", ") || "-"}
                  {c.exclude_page_keys.length > 0 && (
                    <div className="text-muted">
                      skips {c.exclude_page_keys.join(", ")}
                    </div>
                  )}
                </td>
                <td>
                  {c.latitude !== null && c.longitude !== null
                    ? `${c.latitude}, ${c.longitude}`
                    : "-"}
                </td>
                {lead && (
                  <td className="text-end text-nowrap">
                    <Button
                      size="sm"
                      color="link"
                      className="p-0 me-2"
                      onClick={() => setEditing(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      color="link"
                      className="p-0 me-2"
                      disabled={busy === c.slug}
                      onClick={() => toggle(c)}
                    >
                      {c.active ? "Switch off" : "Switch on"}
                    </Button>
                    <Button
                      size="sm"
                      color="link"
                      className="text-danger p-0"
                      disabled={c.active || busy === c.slug}
                      title={
                        c.active ? "Switch the city off before deleting it" : ""
                      }
                      onClick={() => remove(c)}
                    >
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager list={list} />
      {editing && (
        <CityEditor
          city={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            changed();
          }}
        />
      )}
    </>
  );
};

const lines = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const Playbooks = () => {
  const [city, setCity] = useDefaultCity();
  const [book, setBook] = useState(null);
  const { act, busy } = useAction();
  const { can } = useAgentAccess();
  const lead = can("BRAND");

  useEffect(() => {
    if (!city) return;
    getPlaybook(city).then(setBook).catch(notifyError);
  }, [city]);

  const toggleLang = (value) =>
    setBook({
      ...book,
      languages: book.languages.includes(value)
        ? book.languages.filter((l) => l !== value)
        : [...book.languages, value],
    });

  return (
    <Card>
      <CardBody>
        <CitySelect
          value={city}
          onChange={setCity}
          activeOnly={false}
          style={{ width: 200 }}
        />
        {book && (
          <div className="mt-3">
            <Label>Languages to post in</Label>
            <div className="d-flex gap-3 mb-3">
              {LANGUAGES.map((l) => (
                <FormGroup check key={l.value}>
                  <Input
                    type="checkbox"
                    disabled={!lead}
                    checked={book.languages.includes(l.value)}
                    onChange={() => toggleLang(l.value)}
                  />
                  <Label check>{l.label}</Label>
                </FormGroup>
              ))}
            </div>
            <Label>What to make</Label>
            <div className="mb-3">
              <ChoiceChecks
                id="pb-formats"
                options={FORMAT_CHOICES}
                value={book.formats}
                disabled={!lead}
                onChange={(formats) => setBook({ ...book, formats })}
              />
            </div>
            <Label>Where to post</Label>
            <div className="mb-3">
              <ChoiceChecks
                id="pb-channels"
                options={CHANNELS}
                value={book.channels}
                disabled={!lead}
                onChange={(channels) => setBook({ ...book, channels })}
              />
              <small className="text-muted">
                Weekly plans only use the ticked formats and channels. You can
                change them for a single week when drafting the plan.
              </small>
            </div>
            <FormGroup>
              <Label>
                Notes for the writer (centre area, landmarks, what families ask)
              </Label>
              <Input
                type="textarea"
                rows={3}
                disabled={!lead}
                value={book.notes}
                onChange={(e) => setBook({ ...book, notes: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Off-limits topics</Label>
              <div style={{ fontSize: 13 }}>
                {book.off_limits_topics.length
                  ? book.off_limits_topics.join(", ")
                  : "None"}
                <div className="text-muted">
                  Set by the marketing lead in Owner settings.
                </div>
              </div>
            </FormGroup>
            {lead && (
              <Button
                color="primary"
                size="sm"
                disabled={
                  !!busy || !book.formats.length || !book.channels.length
                }
                onClick={() =>
                  act(
                    "save",
                    () =>
                      setPlaybook(city, {
                        city,
                        languages: book.languages,
                        formats: book.formats,
                        channels: book.channels,
                        notes: book.notes,
                        off_limits_topics: book.off_limits_topics,
                      }),
                    "Playbook saved",
                  )
                }
              >
                Save
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const SITE_SECTIONS = [
  ["home", "Home page"],
  ["city_page", "City pages"],
  ["therapy", "Therapies"],
  ["disorder", "Disorders"],
  ["treatment", "Treatments"],
  ["psychiatrist", "Psychiatrists"],
  ["case_study", "Case studies"],
  ["other", "Other pages"],
];
const SECTION_NAME = Object.fromEntries(SITE_SECTIONS);

const Website = () => {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [city, setCity] = useState("");
  const list = usePagedList(getWebsitePages, { q, section, city });
  const [question, setQuestion] = useState("");
  const [hits, setHits] = useState(null);
  const [embed, setEmbed] = useState(false);
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const lead = can("BRAND");

  const crawl = async () => {
    const job = await run(() => crawlWebsite(embed), {
      successText: embed
        ? "Website read and prepared for search"
        : "Website read",
    });
    if (job?.status === "succeeded") list.reload();
  };

  const tryIt = async () => {
    const found = await act("search", () =>
      searchWebsite({ query: question, city: city || null, k: 6 }),
    );
    if (found) setHits(found);
  };

  return (
    <>
      <p className="text-muted">
        Pages read from the Jagruti website. The planner and writer use them for
        centre details and links. Blog posts are not read. Medical statements
        still come only from Clinical facts. The site is read again every
        Sunday; only changed pages are processed.
      </p>
      <div className="d-flex gap-2 flex-wrap mb-2">
        <SearchBox onSearch={setQ} placeholder="Search title or address" />
        <FilterSelect
          value={section}
          onChange={setSection}
          options={SITE_SECTIONS}
          allLabel="All pages"
        />
        <CitySelect
          value={city}
          onChange={setCity}
          allowAll
          activeOnly={false}
          style={{ width: 150 }}
        />
        {lead && (
          <FormGroup check className="ms-auto mb-0 align-self-center">
            <Input
              type="checkbox"
              id="site-embed"
              checked={embed}
              onChange={(e) => setEmbed(e.target.checked)}
            />
            <Label check for="site-embed" style={{ fontSize: 13 }}>
              Also prepare for AI search (uses Gemini)
            </Label>
          </FormGroup>
        )}
        {lead && (
          <Button size="sm" color="primary" disabled={running} onClick={crawl}>
            {running ? "Reading the website…" : "Read the website now"}
          </Button>
        )}
      </div>
      {!list.loading && list.total === 0 ? (
        <Empty>No pages yet. Read the website to load them.</Empty>
      ) : (
        <Table size="sm" responsive style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>Page</th>
              <th>Type</th>
              <th>City</th>
              <th>Pieces</th>
              <th>FAQs</th>
              <th>Read on</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => (
              <tr key={p.id}>
                <td style={{ maxWidth: 380 }}>
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {p.title || p.path}
                  </a>
                  <div className="text-muted">{p.path}</div>
                  {p.address && <div className="text-muted">{p.address}</div>}
                  {p.error && <div className="text-danger">{p.error}</div>}
                </td>
                <td>{SECTION_NAME[p.section] || p.section}</td>
                <td className="text-capitalize">
                  {p.city === "unassigned" ? "-" : p.city}
                </td>
                <td>{p.chunk_count}</td>
                <td>{p.faqs.length || "-"}</td>
                <td>{formatDate(p.crawled_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager list={list} />

      <Card className="mt-3">
        <CardBody>
          <h6>Try a search</h6>
          <p className="text-muted" style={{ fontSize: 13 }}>
            Shows what the writer would get from the website for a topic.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <Input
              bsSize="sm"
              placeholder="e.g. alcohol detox in Mumbai"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && question.trim().length > 1 && tryIt()
              }
              style={{ flex: 1, minWidth: 240 }}
            />
            <Button
              size="sm"
              color="light"
              disabled={question.trim().length < 2 || !!busy}
              onClick={tryIt}
            >
              {busy === "search" ? "Searching…" : "Search"}
            </Button>
          </div>
          {hits &&
            (hits.length === 0 ? (
              <Empty>Nothing found.</Empty>
            ) : (
              hits.map((h) => (
                <div
                  key={`${h.page_id}-${h.heading}-${h.score}`}
                  className="border-bottom py-2"
                  style={{ fontSize: 13 }}
                >
                  <div className="d-flex gap-2 flex-wrap">
                    <a href={h.url} target="_blank" rel="noreferrer">
                      {h.title}
                    </a>
                    <span className="text-muted">· {h.heading}</span>
                    <span className="text-muted ms-auto">
                      match {h.score.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {h.text.slice(0, 400)}
                    {h.text.length > 400 && "…"}
                  </div>
                </div>
              ))
            ))}
        </CardBody>
      </Card>
    </>
  );
};

const PromptCard = ({ prompt, lead, onSaved }) => {
  const [text, setText] = useState(prompt.text);
  const [showDefault, setShowDefault] = useState(false);
  const { act, busy } = useAction();
  const editable = prompt.editable && lead;
  const changed = text !== prompt.text;

  useEffect(() => setText(prompt.text), [prompt.text]);

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
          <h6 className="mb-0">{prompt.title}</h6>
          {!prompt.editable ? (
            <Badge color="danger">Safety check · view only</Badge>
          ) : prompt.customised ? (
            <Badge color="warning" className="text-dark">
              Custom
            </Badge>
          ) : (
            <Badge color="light" className="text-dark">
              Default
            </Badge>
          )}
          {prompt.updated_by && (
            <span className="text-muted ms-auto" style={{ fontSize: 12 }}>
              Changed by {prompt.updated_by} · {formatDate(prompt.updated_at)}
            </span>
          )}
        </div>
        <div className="text-muted mb-2" style={{ fontSize: 13 }}>
          {prompt.purpose}
          {prompt.placeholders.length > 0 &&
            ` Keep these slots: ${prompt.placeholders.map((p) => `{${p}}`).join(", ")} (filled from the voice guide and banned phrases).`}
        </div>
        <Input
          type="textarea"
          rows={12}
          value={text}
          readOnly={!editable}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
        {editable && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              color="primary"
              disabled={!changed || !!busy}
              onClick={async () => {
                const saved = await act(
                  "save",
                  () => savePrompt(prompt.key, text),
                  "Prompt saved: used from the next Gemini call",
                );
                if (saved) onSaved(saved);
              }}
            >
              Save
            </Button>
            {changed && (
              <Button
                size="sm"
                color="secondary"
                outline
                onClick={() => setText(prompt.text)}
              >
                Undo changes
              </Button>
            )}
            {prompt.customised && (
              <Button
                size="sm"
                color="danger"
                outline
                disabled={!!busy}
                onClick={async () => {
                  if (
                    !window.confirm(`Reset "${prompt.title}" to the default?`)
                  )
                    return;
                  const reset = await act(
                    "reset",
                    () => resetPrompt(prompt.key),
                    "Back to the default prompt",
                  );
                  if (reset) onSaved(reset);
                }}
              >
                Reset to default
              </Button>
            )}
            {prompt.customised && (
              <Button
                size="sm"
                color="secondary"
                outline
                onClick={() => setShowDefault(!showDefault)}
              >
                {showDefault ? "Hide default" : "Show default"}
              </Button>
            )}
          </div>
        )}
        {showDefault && (
          <pre
            className="mt-2 p-2 bg-light"
            style={{ whiteSpace: "pre-wrap", fontSize: 12 }}
          >
            {prompt.default}
          </pre>
        )}
      </CardBody>
    </Card>
  );
};

const Prompts = () => {
  const [prompts, setPrompts] = useState(null);
  const { can } = useAgentAccess();
  const lead = can("BRAND");

  useEffect(() => {
    getPrompts().then(setPrompts).catch(notifyError);
  }, []);

  if (!prompts) return null;
  return (
    <>
      <p className="text-muted">
        The instructions sent to Gemini with every request. Changes apply from
        the next request. To see a full prompt with its data, use "Show full
        prompt" when drafting a plan or writing a post.
      </p>
      {prompts.map((p) => (
        <PromptCard
          key={p.key}
          prompt={p}
          lead={lead}
          onSaved={(saved) =>
            setPrompts((cur) =>
              cur.map((x) => (x.key === saved.key ? saved : x)),
            )
          }
        />
      ))}
    </>
  );
};

const TABS = [
  { id: "facts", label: "Clinical facts", element: <Facts /> },
  { id: "banned", label: "Banned phrases", element: <Banned /> },
  { id: "cities", label: "Cities", element: <Cities /> },
  { id: "website", label: "Website", element: <Website /> },
  { id: "playbooks", label: "City playbooks", element: <Playbooks /> },
  { id: "prompts", label: "Prompts", element: <Prompts /> },
];

const BrandBrain = () => {
  const [tab, setTab] = useState("facts");
  const tabs = TABS;
  return (
    <div className="p-3">
      <PageHeader
        title="Brand brain"
        subtitle="The rules every plan, post and review follows."
      />
      <Nav tabs className="mb-3">
        {tabs.map((t) => (
          <NavItem key={t.id}>
            <NavLink
              href="#"
              active={tab === t.id}
              onClick={(e) => {
                e.preventDefault();
                setTab(t.id);
              }}
            >
              {t.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {tabs.find((t) => t.id === tab)?.element}
    </div>
  );
};

export default BrandBrain;
