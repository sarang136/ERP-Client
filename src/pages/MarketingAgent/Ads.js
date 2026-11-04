import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Col,
  FormGroup,
  Input,
  Label,
  Row,
  Table,
} from "reactstrap";
import {
  approveBudgetChange,
  approveCampaign,
  changeCampaignBudget,
  getBudgetChanges,
  getBudgets,
  getCampaigns,
  getPublications,
  pauseCampaign,
  proposeCampaign,
  rejectBudgetChange,
  rejectCampaign,
  resumeCampaign,
  setBudget,
  syncAds,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FilterSelect,
  PageHeader,
  Pager,
  SearchBox,
  StateBadge,
  formatDateTime,
  money,
  notifyError,
  useAction,
  useAgentAccess,
  useDefaultCity,
  useJob,
  usePagedList,
} from "./common";

const thisMonth = () => new Date().toISOString().slice(0, 7);

const CAMPAIGN_STATUS = [
  "awaiting_approval",
  "active",
  "paused",
  "ended",
  "rejected",
  "failed",
];
const CHANGE_STATUS = ["awaiting_approval", "applied", "rejected"];
const PLATFORMS = [
  ["meta", "Meta"],
  ["google", "Google"],
];

const Ads = () => {
  const [city, setCity] = useDefaultCity();
  const [month, setMonth] = useState(thisMonth());
  const [budgetCity, setBudgetCity] = useState("");
  const budgets = usePagedList(getBudgets, { month, city: budgetCity });
  const [changeStatus, setChangeStatus] = useState("awaiting_approval");
  const [changeCity, setChangeCity] = useState("");
  const changes = usePagedList(getBudgetChanges, {
    status: changeStatus,
    city: changeCity,
  });
  const [q, setQ] = useState("");
  const [campaignCity, setCampaignCity] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const campaigns = usePagedList(getCampaigns, {
    q,
    city: campaignCity,
    status: campaignStatus,
    platform,
  });
  const [posts, setPosts] = useState([]);
  const [budgetForm, setBudgetForm] = useState({
    monthly_limit: "",
    daily_limit: "",
  });
  const [form, setForm] = useState({
    name: "",
    publication_id: "",
    daily_budget: "",
    platform: "meta",
    managed_externally: false,
  });
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const lead = can("ADS");

  useEffect(() => {
    if (!city) return;
    getPublications({
      status: "published",
      channel: "facebook",
      city,
      limit: 100,
    })
      .then((p) => setPosts(p.items))
      .catch(notifyError);
  }, [city]);

  const load = () => {
    budgets.reload();
    changes.reload();
    campaigns.reload();
  };

  const saveBudget = async () => {
    const done = await act(
      "budget",
      () =>
        setBudget({
          city,
          month,
          monthly_limit: Number(budgetForm.monthly_limit),
          daily_limit: Number(budgetForm.daily_limit),
        }),
      "Budget saved",
    );
    if (done) load();
  };

  const propose = async () => {
    const done = await act(
      "propose",
      () =>
        proposeCampaign({
          city,
          name: form.name,
          platform: form.platform,
          publication_id: form.publication_id || null,
          daily_budget: Number(form.daily_budget),
          managed_externally:
            form.platform === "google" || form.managed_externally,
        }),
      "Campaign proposed",
    );
    if (done) {
      setForm({ ...form, name: "", daily_budget: "" });
      load();
    }
  };

  const doAct = async (key, fn, text) => (await act(key, fn, text)) && load();

  const changeBudget = (c) => {
    const value = window.prompt(
      `New daily budget for ${c.name} (now ${c.daily_budget})`,
      c.daily_budget,
    );
    if (!value) return;
    const reason =
      window.prompt("Reason for the change") || "changed by the marketing lead";
    doAct(
      c.id,
      () => changeCampaignBudget(c.id, { daily_budget: Number(value), reason }),
      "Budget changed",
    );
  };

  return (
    <div className="p-3">
      <PageHeader
        title="Ads and budgets"
        subtitle="Ads stay inside each city's limits. Changes over 20% need the marketing lead."
      >
        <CitySelect value={city} onChange={setCity} style={{ width: 180 }} />
        {lead && (
          <Button
            size="sm"
            color="primary"
            disabled={running}
            onClick={async () =>
              (await run(syncAds, {
                successText: "Spend updated and limits checked",
              })) && load()
            }
          >
            Update spend and check limits
          </Button>
        )}
      </PageHeader>

      <Row>
        <Col lg={5}>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <h6 className="mb-0 me-auto">City budgets</h6>
                <Input
                  type="month"
                  bsSize="sm"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ width: 150 }}
                />
                <CitySelect
                  value={budgetCity}
                  onChange={setBudgetCity}
                  allowAll
                  activeOnly={false}
                  style={{ width: 140 }}
                />
              </div>
              {!budgets.loading && budgets.total === 0 ? (
                <Empty>No budgets set for {month || "any month"}.</Empty>
              ) : (
                <Table size="sm" style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>City</th>
                      <th>Monthly</th>
                      <th>Daily</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.items.map((b) => (
                      <tr key={b.id}>
                        <td className="text-capitalize">
                          {b.city}
                          {!month && (
                            <div className="text-muted">{b.month}</div>
                          )}
                        </td>
                        <td>{money(b.monthly_limit)}</td>
                        <td>{money(b.daily_limit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Pager list={budgets} />
              {lead && (
                <div className="d-flex gap-2 align-items-end flex-wrap">
                  <FormGroup className="mb-0">
                    <Label className="mb-0" style={{ fontSize: 12 }}>
                      Monthly (₹)
                    </Label>
                    <Input
                      bsSize="sm"
                      type="number"
                      value={budgetForm.monthly_limit}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          monthly_limit: e.target.value,
                        })
                      }
                      style={{ width: 120 }}
                    />
                  </FormGroup>
                  <FormGroup className="mb-0">
                    <Label className="mb-0" style={{ fontSize: 12 }}>
                      Daily (₹)
                    </Label>
                    <Input
                      bsSize="sm"
                      type="number"
                      value={budgetForm.daily_limit}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          daily_limit: e.target.value,
                        })
                      }
                      style={{ width: 100 }}
                    />
                  </FormGroup>
                  <Button
                    size="sm"
                    color="primary"
                    disabled={
                      !month ||
                      !budgetForm.monthly_limit ||
                      !budgetForm.daily_limit ||
                      !!busy
                    }
                    onClick={saveBudget}
                  >
                    Save for {city}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {lead && (
            <Card>
              <CardBody>
                <h6>New campaign for {city}</h6>
                <FormGroup>
                  <Input
                    type="select"
                    bsSize="sm"
                    value={form.platform}
                    onChange={(e) =>
                      setForm({ ...form, platform: e.target.value })
                    }
                  >
                    <option value="meta">
                      Meta: boost a published Facebook post
                    </option>
                    <option value="google">
                      Google Ads (run in Google Ads, spend imported)
                    </option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Input
                    bsSize="sm"
                    placeholder="Campaign name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Input
                    type="select"
                    bsSize="sm"
                    value={form.publication_id}
                    onChange={(e) =>
                      setForm({ ...form, publication_id: e.target.value })
                    }
                  >
                    <option value="">
                      {form.platform === "meta"
                        ? "Choose the Facebook post to boost"
                        : "Linked post (optional)"}
                    </option>
                    {posts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDateTime(p.published_at)} · {p.text.slice(0, 60)}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Input
                    bsSize="sm"
                    type="number"
                    placeholder="Daily budget (₹)"
                    value={form.daily_budget}
                    onChange={(e) =>
                      setForm({ ...form, daily_budget: e.target.value })
                    }
                  />
                </FormGroup>
                <Button
                  size="sm"
                  color="primary"
                  disabled={!form.name || !form.daily_budget || !!busy}
                  onClick={propose}
                >
                  Propose campaign
                </Button>
              </CardBody>
            </Card>
          )}
        </Col>

        <Col lg={7}>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <h6 className="mb-0 me-auto">Budget changes</h6>
                <FilterSelect
                  value={changeStatus}
                  onChange={setChangeStatus}
                  options={CHANGE_STATUS}
                  allLabel="All statuses"
                />
                <CitySelect
                  value={changeCity}
                  onChange={setChangeCity}
                  allowAll
                  activeOnly={false}
                  style={{ width: 140 }}
                />
              </div>
              {!changes.loading && changes.total === 0 ? (
                <Empty>No budget changes match.</Empty>
              ) : (
                <Table size="sm" style={{ fontSize: 13 }}>
                  <tbody>
                    {changes.items.map((ch) => (
                      <tr key={ch.id}>
                        <td>
                          <span className="text-capitalize">{ch.city}</span>:{" "}
                          {money(ch.from_budget)} → {money(ch.to_budget)} (
                          {ch.change_pct > 0 ? "+" : ""}
                          {ch.change_pct}%)
                          <div className="text-muted">{ch.reason}</div>
                          <div className="text-muted">
                            {formatDateTime(ch.created_at)} ·{" "}
                            <StateBadge state={ch.status} />
                          </div>
                        </td>
                        <td
                          className="text-end"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {lead && ch.status === "awaiting_approval" && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                outline
                                disabled={!!busy}
                                onClick={() =>
                                  doAct(
                                    ch.id,
                                    () => approveBudgetChange(ch.id),
                                    "Applied",
                                  )
                                }
                              >
                                Approve
                              </Button>{" "}
                              <Button
                                size="sm"
                                color="danger"
                                outline
                                disabled={!!busy}
                                onClick={() =>
                                  doAct(
                                    ch.id,
                                    () => rejectBudgetChange(ch.id),
                                    "Rejected",
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Pager list={changes} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <h6 className="mb-0 me-auto">Campaigns</h6>
                <SearchBox onSearch={setQ} placeholder="Search name" />
                <CitySelect
                  value={campaignCity}
                  onChange={setCampaignCity}
                  allowAll
                  activeOnly={false}
                  style={{ width: 140 }}
                />
                <FilterSelect
                  value={campaignStatus}
                  onChange={setCampaignStatus}
                  options={CAMPAIGN_STATUS}
                  allLabel="All statuses"
                />
                <FilterSelect
                  value={platform}
                  onChange={setPlatform}
                  options={PLATFORMS}
                  allLabel="All platforms"
                />
              </div>
              {!campaigns.loading && campaigns.total === 0 ? (
                <Empty>No campaigns match.</Empty>
              ) : (
                <Table size="sm" responsive style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Campaign</th>
                      <th>Daily</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.items.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-semibold">{c.name}</div>
                          <div className="text-muted">
                            <span className="text-capitalize">{c.city}</span> ·{" "}
                            {c.platform}
                            {c.managed_externally && " · run outside"}
                          </div>
                          {c.pause_reason && (
                            <div className="text-warning">{c.pause_reason}</div>
                          )}
                          {c.error && (
                            <div className="text-danger">{c.error}</div>
                          )}
                        </td>
                        <td>{money(c.daily_budget)}</td>
                        <td>
                          <StateBadge state={c.status} />
                        </td>
                        <td
                          className="text-end"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {lead && c.status === "awaiting_approval" && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                outline
                                disabled={!!busy}
                                onClick={() =>
                                  doAct(
                                    c.id,
                                    () => approveCampaign(c.id),
                                    "Campaign started",
                                  )
                                }
                              >
                                Approve
                              </Button>{" "}
                              <Button
                                size="sm"
                                color="danger"
                                outline
                                disabled={!!busy}
                                onClick={() =>
                                  doAct(
                                    c.id,
                                    () => rejectCampaign(c.id),
                                    "Rejected",
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {lead && c.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                color="light"
                                disabled={!!busy}
                                onClick={() =>
                                  doAct(
                                    c.id,
                                    () =>
                                      pauseCampaign(
                                        c.id,
                                        "paused by the marketing lead",
                                      ),
                                    "Paused",
                                  )
                                }
                              >
                                Pause
                              </Button>{" "}
                              <Button
                                size="sm"
                                color="light"
                                onClick={() => changeBudget(c)}
                              >
                                Budget
                              </Button>
                            </>
                          )}
                          {lead && c.status === "paused" && (
                            <Button
                              size="sm"
                              color="light"
                              disabled={!!busy}
                              onClick={() =>
                                doAct(
                                  c.id,
                                  () => resumeCampaign(c.id),
                                  "Resumed",
                                )
                              }
                            >
                              Resume
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Pager list={campaigns} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Ads;
