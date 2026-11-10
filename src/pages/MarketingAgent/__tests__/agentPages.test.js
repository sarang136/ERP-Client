/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as agentApi from "../../../helpers/marketingAgentApi";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import Enquiries from "../Enquiries";
import ContentReview from "../ContentReview";
import Plans from "../Plans";
import Signals from "../Signals";
import Publishing from "../Publishing";
import Ads from "../Ads";
import Insights from "../Insights";
import BrandBrain from "../BrandBrain";
import RagOutput from "../RagOutput";
import ListenData from "../ListenData";
import OwnerSettings from "../OwnerSettings";

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("../../../helpers/marketingAgentApi");
jest.mock("../../../Components/Hooks/useRoles", () => ({
  usePermissions: jest.fn(),
}));

const now = new Date().toISOString();
const page = (items) => ({ items, total: items.length, limit: 50, offset: 0 });

const crisis = {
  enquiry: {
    id: "e1",
    source: "website",
    name: "Asha",
    phone: "+919000000001",
    message: "My brother says he wants to die",
    city: "pune",
    status: "crisis",
    priority: 100,
    qualification: null,
    crisis: { state: "paged", escalations: 1 },
    created_at: now,
  },
  waiting_minutes: 7,
  overdue: true,
};
const hot = {
  enquiry: {
    id: "e2",
    source: "justdial",
    name: "Rahul",
    phone: "+919000000002",
    message: "",
    city: "pune",
    status: "queued",
    priority: 80,
    qualification: {
      score: "hot",
      reason: "wants admission",
      who_needs_help: "family",
      concern: "alcohol",
      urgency: "today",
      summary: "Family wants admission for father today.",
      opener: "Thank you for calling about your father.",
    },
    crisis: null,
    created_at: now,
  },
  waiting_minutes: 3,
  overdue: false,
};

const content = {
  id: "c1",
  city: "pune",
  topic: "First call",
  condition: "alcohol",
  format: "carousel",
  channel: "instagram",
  language: "mr",
  audience: "family",
  state: "awaiting_b",
  tier: "B",
  version: 2,
  revisions: 1,
  updated_at: now,
  body: {
    headline: "पहिला फोन कसा करावा",
    body: "Body text",
    slides: ["Slide one", "Slide two"],
    script: null,
    hashtags: ["#recovery"],
    cta: "Talk to a counsellor",
    image_prompt: null,
    claims: [{ text: "Withdrawal can need supervision", fact_id: "ALC-1" }],
  },
};

const grant = (subs, level = "WRITE") =>
  usePermissions.mockReturnValue({
    loading: false,
    hasPermission: (module, sub, required) =>
      module === "MARKETING_AGENT" &&
      subs.includes(sub) &&
      ({ READ: 1, WRITE: 2 }[required] || 0) <= { READ: 1, WRITE: 2 }[level],
  });

beforeEach(() => {
  jest.clearAllMocks();
  grant([
    "ENQUIRIES",
    "CONTENT",
    "CLINICAL_APPROVAL",
    "PLANS",
    "SIGNALS",
    "PUBLISHING",
    "ADS",
    "INSIGHTS",
    "BRAND",
  ]);
  agentApi.getCities.mockResolvedValue(
    page([
      { slug: "pune", name: "Pune", active: true },
      { slug: "mumbai", name: "Mumbai", active: true },
    ]),
  );
  agentApi.listSignals.mockResolvedValue(page([]));
  agentApi.getPlanReadiness.mockResolvedValue({
    week_start: "2026-11-09",
    ready_by: "10:00",
    cities: [
      { city: "pune", name: "Pune", ready: true, status: "draft" },
      { city: "mumbai", name: "Mumbai", ready: false, status: null },
    ],
  });
  agentApi.getRagInventory.mockResolvedValue({
    signals: [
      {
        kind: "call",
        source: "ozonetel",
        total: 537,
        searchable: 537,
        newest: null,
      },
    ],
    signals_by_city: { pune: 38 },
    website_pages: 425,
    website_pieces: 4430,
    website_searchable: 0,
    facts_active: 0,
    facts_searchable: 0,
    erp_events: { admission: 205 },
    database_mb: 299.1,
  });
});

test("call queue shows crisis first and records outcomes", async () => {
  agentApi.getCallQueue.mockImplementation((params) =>
    Promise.resolve(
      params.status === "crisis" ? page([crisis]) : page([crisis, hot]),
    ),
  );
  agentApi.recordOutcome.mockResolvedValue({
    ...hot.enquiry,
    status: "contacted",
  });
  agentApi.acknowledgeCrisis.mockResolvedValue({ ...crisis.enquiry });
  render(<Enquiries />);

  expect(await screen.findByText("CRISIS")).toBeInTheDocument();
  expect(screen.getByText(/1 crisis enquiry/)).toBeInTheDocument();
  expect(
    screen.getByText("Family wants admission for father today."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /\+919000000002/ })).toHaveAttribute(
    "href",
    "tel:+919000000002",
  );

  fireEvent.click(screen.getByText("I'm handling this crisis"));
  await waitFor(() =>
    expect(agentApi.acknowledgeCrisis).toHaveBeenCalledWith("e1"),
  );

  fireEvent.click(screen.getAllByText("Called")[1]);
  await waitFor(() =>
    expect(agentApi.recordOutcome).toHaveBeenCalledWith("e2", {
      status: "contacted",
      note: null,
    }),
  );
});

test("content review shows findings and lets the marketing lead approve", async () => {
  agentApi.getContentList.mockResolvedValue(page([content]));
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.getContentChecks.mockResolvedValue([
    {
      content_version: 2,
      passed: true,
      tier: "B",
      tier_reasons: ["claim about Jagruti"],
      findings: [
        {
          rule_id: "TONE-001",
          source: "llm",
          severity: "warn",
          quote: "x",
          reason: "a bit cold",
          suggestion: "warmer",
        },
      ],
    },
  ]);
  agentApi.approveContent.mockResolvedValue({ ...content, state: "approved" });
  render(<ContentReview />);

  expect(
    (await screen.findAllByText("पहिला फोन कसा करावा")).length,
  ).toBeGreaterThan(0);
  expect(await screen.findByText("TONE-001")).toBeInTheDocument();
  expect(screen.getByText("ALC-1")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Approve"));
  await waitFor(() =>
    expect(agentApi.approveContent).toHaveBeenCalledWith("c1", null),
  );
});

test("weekly plan can be approved", async () => {
  const week = {
    id: "w1",
    city: "pune",
    week_start: now,
    status: "draft",
    summary: "Focus on Diwali",
    decision_reason: null,
  };
  agentApi.getPlans.mockResolvedValue(page([week]));
  agentApi.getPlan.mockResolvedValue({
    ...week,
    briefs: [
      {
        id: "b1",
        scheduled_for: now,
        format: "carousel",
        channel: "instagram",
        language: "mr",
        audience: "family",
        topic: "Festive drinking",
        angle: "gentle",
        rationale: "searches rising",
        score: 0.42,
        status: "planned",
        seasonal_event: null,
      },
    ],
    ad_suggestion: {
      month: "2026-11",
      monthly_limit: 31000,
      daily_limit: 1000,
      spent_this_month: 2000,
      committed_daily: 0,
      available_this_week: 6700,
      total: 6300,
      status: "proposed",
      items: [
        {
          platform: "meta",
          channel: "instagram",
          topic: "Festive drinking",
          brief_id: "b1",
          week_amount: 6300,
          daily_budget: 900,
          reason: "Boost this Instagram post once it is published",
        },
      ],
    },
  });
  agentApi.approveAdSuggestion.mockResolvedValue({
    id: "w1",
    city: "pune",
    week_start: now,
    status: "draft",
    summary: "Focus on Diwali",
    briefs: [],
    ad_suggestion: {
      month: "2026-11",
      items: [],
      status: "approved",
      decided_by: "user:1:Lead",
    },
  });
  agentApi.approvePlan.mockResolvedValue({
    ...week,
    status: "approved",
    briefs: [],
  });
  render(<Plans />);

  expect(await screen.findByText("Festive drinking")).toBeInTheDocument();
  expect(await screen.findByText("no plan yet")).toBeInTheDocument();
  expect(screen.getByText(/by Monday 10:00 IST/)).toBeInTheDocument();

  fireEvent.click(screen.getByText("Ad budget"));
  expect(
    await screen.findByText("₹6,300", { selector: "td" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Meta boost")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Approve ad budget"));
  await waitFor(() =>
    expect(agentApi.approveAdSuggestion).toHaveBeenCalledWith("w1"),
  );
  expect(await screen.findByText(/Approved by Lead/)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/^Post ideas/));
  fireEvent.click(screen.getByText("Approve plan"));
  await waitFor(() =>
    expect(agentApi.approvePlan).toHaveBeenCalledWith("w1", null),
  );
});

test("signals page answers a question with its evidence", async () => {
  agentApi.getLatestDigest.mockResolvedValue({
    day: now,
    cities: [],
    highlights: ["Searches rising in Pune"],
  });
  agentApi.getAlerts.mockResolvedValue(page([]));
  agentApi.getTrends.mockResolvedValue([]);
  const signal = {
    id: "s1",
    kind: "review",
    source: "gbp",
    text: "Nobody called back",
    rating: 1,
    sentiment: "negative",
    observed_at: now,
  };
  agentApi.askSignals.mockResolvedValue({
    answer: {
      answer: "Families are upset about missed callbacks.",
      cited_signal_ids: ["s1"],
      confidence: "medium",
    },
    signals: [{ signal, score: 0.71 }],
  });
  render(<Signals />);

  expect(
    await screen.findByText("Searches rising in Pune"),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/What are families/), {
    target: { value: "What are families worried about?" },
  });
  fireEvent.click(screen.getByText("Ask"));
  expect(
    await screen.findByText("Families are upset about missed callbacks."),
  ).toBeInTheDocument();
  expect(screen.getByText("Nobody called back")).toBeInTheDocument();
});

test("publishing, ads, insights and brand brain render", async () => {
  agentApi.getControls.mockResolvedValue({
    publishing_paused: false,
    ads_paused: true,
  });
  agentApi.getContentList.mockResolvedValue(
    page([{ ...content, state: "approved" }]),
  );
  agentApi.getPublications.mockResolvedValue(
    page([
      {
        id: "p1",
        channel: "facebook",
        city: "pune",
        status: "failed",
        scheduled_at: now,
        error: "token expired",
        manual: false,
        text: "t",
      },
    ]),
  );
  const { unmount } = render(<Publishing />);
  expect(await screen.findByText("token expired")).toBeInTheDocument();
  expect(screen.getByText("Resume ads")).toBeInTheDocument();
  unmount();

  agentApi.getBudgets.mockResolvedValue(
    page([
      { id: "b1", city: "pune", monthly_limit: 150000, daily_limit: 5000 },
    ]),
  );
  agentApi.getCampaigns.mockResolvedValue(
    page([
      {
        id: "a1",
        name: "Pune boost",
        city: "pune",
        platform: "meta",
        status: "paused",
        daily_budget: 1500,
        pause_reason: "city daily limit reached",
      },
    ]),
  );
  agentApi.getBudgetChanges.mockResolvedValue(page([]));
  const { unmount: unmountAds } = render(<Ads />);
  expect(
    await screen.findByText("city daily limit reached"),
  ).toBeInTheDocument();
  unmountAds();

  agentApi.getMetrics.mockResolvedValue({
    by_city: [
      {
        key: "pune",
        enquiries: 10,
        qualified: 6,
        assessments: 4,
        admissions: 2,
        spend: 6000,
        enquiry_to_admission: 0.2,
        cost_per_admission: 3000,
      },
    ],
    by_channel: [],
    by_topic: [],
    by_campaign: [],
    response: {
      hot_enquiries: 4,
      hot_called_within_target: 3,
      hot_within_target_rate: 0.75,
      median_minutes_to_first_call: 9,
      crisis_total: 0,
    },
    score_accuracy: [],
  });
  agentApi.getReports.mockResolvedValue(page([]));
  agentApi.getHooks.mockResolvedValue(page([]));
  const { unmount: unmountInsights } = render(<Insights />);
  expect(await screen.findByText("75%")).toBeInTheDocument();
  unmountInsights();

  agentApi.getFacts.mockResolvedValue(
    page([
      {
        id: "ALC-1",
        text: "Withdrawal can need supervision",
        condition: "alcohol",
        approved_at: now,
        expires_at: null,
      },
    ]),
  );
  render(<BrandBrain />);
  expect(
    await screen.findByText("Withdrawal can need supervision"),
  ).toBeInTheDocument();
  expect(screen.getByText("Add an approved fact")).toBeInTheDocument();
  expect(screen.queryByText("Agent access")).not.toBeInTheDocument();
});

test("clinical content can only be approved with Clinical Approval", async () => {
  grant(["CONTENT"]);
  agentApi.getContentList.mockResolvedValue(
    page([{ ...content, state: "awaiting_c", tier: "C" }]),
  );
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.getContentChecks.mockResolvedValue([]);
  render(<ContentReview />);

  expect(
    await screen.findByText(/Approving needs Write on "Clinical Approval"/),
  ).toBeInTheDocument();
  expect(screen.queryByText("Approve")).not.toBeInTheDocument();
});

test("read-only users see the queue without action buttons", async () => {
  grant(["ENQUIRIES"], "READ");
  agentApi.getCallQueue.mockResolvedValue(page([hot]));
  render(<Enquiries />);

  expect(
    await screen.findByText("Family wants admission for father today."),
  ).toBeInTheDocument();
  expect(screen.queryByText("Called")).not.toBeInTheDocument();
});

test("banned phrases page through the backend with page size and search", async () => {
  const phrases = Array.from({ length: 23 }, (_, i) => ({
    id: `b${i}`,
    phrase: `phrase ${i}`,
    language: "en",
    rule_id: "CLAIM-001",
    reason: "Promises a cure",
    severity: "block",
  }));
  agentApi.getFacts.mockResolvedValue(page([]));
  agentApi.getBannedPhrases.mockImplementation(({ limit, offset }) =>
    Promise.resolve({
      items: phrases.slice(offset, offset + limit),
      total: phrases.length,
      limit,
      offset,
    }),
  );
  render(<BrandBrain />);
  fireEvent.click(screen.getByText("Banned phrases"));

  expect(await screen.findByText("Showing 1–10 of 23")).toBeInTheDocument();
  expect(agentApi.getBannedPhrases).toHaveBeenLastCalledWith({
    limit: 10,
    offset: 0,
  });

  fireEvent.click(screen.getByText("3"));
  expect(await screen.findByText("Showing 21–23 of 23")).toBeInTheDocument();
  expect(screen.getByText("phrase 22")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Rows per page"), {
    target: { value: "20" },
  });
  expect(await screen.findByText("Showing 1–20 of 23")).toBeInTheDocument();
  expect(agentApi.getBannedPhrases).toHaveBeenLastCalledWith({
    limit: 20,
    offset: 0,
  });

  fireEvent.change(screen.getByPlaceholderText("Search phrase or reason"), {
    target: { value: "cure" },
  });
  await waitFor(() =>
    expect(agentApi.getBannedPhrases).toHaveBeenLastCalledWith({
      q: "cure",
      limit: 20,
      offset: 0,
    }),
  );
});

test("cities can be added from Brand brain", async () => {
  agentApi.getFacts.mockResolvedValue(page([]));
  agentApi.addCity.mockResolvedValue({ slug: "navi-mumbai-west" });
  agentApi.getCities.mockResolvedValue(
    page([
      {
        slug: "pune",
        name: "Pune",
        active: true,
        aliases: ["pune", "poona"],
        page_keys: ["pune"],
        exclude_page_keys: [],
        gbp_location_ids: [],
        latitude: 18.52,
        longitude: 73.85,
      },
    ]),
  );
  render(<BrandBrain />);
  fireEvent.click(screen.getByText("Cities"));
  expect(await screen.findByText("pune, poona")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Add city"));
  fireEvent.change(screen.getByPlaceholderText("e.g. Surat"), {
    target: { value: "Navi Mumbai West" },
  });
  expect(screen.getByPlaceholderText("e.g. surat")).toHaveValue(
    "navi-mumbai-west",
  );
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(agentApi.addCity).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "navi-mumbai-west",
        name: "Navi Mumbai West",
        active: false,
        aliases: [],
        latitude: null,
      }),
    ),
  );
});

test("review alerts show every city and do not follow the page city", async () => {
  const alert = {
    id: "a1",
    signal_id: "s1",
    city: "delhi",
    source: "gbp",
    rating: 1,
    severity: "high",
    summary: "Reviewer alleges medical negligence",
    text: "worst rehab",
    status: "open",
    created_at: now,
  };
  agentApi.getLatestDigest.mockResolvedValue(null);
  agentApi.getTrends.mockResolvedValue([]);
  agentApi.getAlerts.mockResolvedValue(page([alert]));
  render(<Signals />);

  expect(
    await screen.findByText("Reviewer alleges medical negligence"),
  ).toBeInTheDocument();
  await waitFor(() => expect(agentApi.getTrends).toHaveBeenCalledWith("pune"));
  expect(
    screen.getByText("Reviewer alleges medical negligence"),
  ).toBeInTheDocument();
  for (const [params] of agentApi.getAlerts.mock.calls) {
    expect(params.city).toBeUndefined();
  }
});

test("google reviews filter good, average and bad", async () => {
  agentApi.getLatestDigest.mockResolvedValue(null);
  agentApi.getTrends.mockResolvedValue([]);
  agentApi.getAlerts.mockResolvedValue(page([]));
  agentApi.listSignals.mockResolvedValue(page([]));
  render(<Signals />);

  fireEvent.click(await screen.findByText("Reviews"));
  const quality = await screen.findByDisplayValue("Good, average and bad");
  await waitFor(() =>
    expect(agentApi.listSignals).toHaveBeenCalledWith({
      kind: "review",
      limit: 10,
      offset: 0,
    }),
  );
  fireEvent.change(quality, { target: { value: "bad" } });
  await waitFor(() =>
    expect(agentApi.listSignals).toHaveBeenCalledWith({
      kind: "review",
      min_rating: 0,
      max_rating: 2.99,
      limit: 10,
      offset: 0,
    }),
  );
  fireEvent.change(quality, { target: { value: "good" } });
  await waitFor(() =>
    expect(agentApi.listSignals).toHaveBeenLastCalledWith({
      kind: "review",
      min_rating: 4,
      max_rating: 5,
      limit: 10,
      offset: 0,
    }),
  );
});

test("posts preview with their image and can be regenerated from a prompt", async () => {
  const withImage = {
    ...content,
    channel: "instagram",
    format: "post",
    image: {
      key: "marketing-agent/content/c1/a.jpg",
      url: "https://cdn.test/marketing-agent/content/c1/a.jpg",
      prompt: "A calm garden",
      source: "generated",
      created_at: now,
    },
  };
  agentApi.getContentList.mockResolvedValue(page([withImage]));
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.getContentChecks.mockResolvedValue([]);
  agentApi.generateContentImage.mockResolvedValue({
    ...withImage,
    image: { ...withImage.image, url: "https://cdn.test/b.jpg" },
  });
  render(<ContentReview />);

  expect(await screen.findByAltText("Post visual")).toHaveAttribute(
    "src",
    "https://cdn.test/marketing-agent/content/c1/a.jpg",
  );
  expect(screen.queryByText(/Image brief/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Regenerate with my prompt"));
  fireEvent.change(screen.getByDisplayValue("A calm garden"), {
    target: { value: "A sunlit reading corner" },
  });
  fireEvent.click(screen.getByText("Make this image"));
  await waitFor(() =>
    expect(agentApi.generateContentImage).toHaveBeenCalledWith(
      "c1",
      "A sunlit reading corner",
    ),
  );

  agentApi.getImageFaces.mockResolvedValue({
    width: 1080,
    height: 1080,
    boxes: [{ x: 0.2, y: 0.1, w: 0.3, h: 0.3 }],
  });
  agentApi.blurContentImage.mockResolvedValue({
    ...withImage,
    image: { ...withImage.image, blurred: true },
  });
  fireEvent.click(screen.getByText("Blur parts of the image"));
  expect(await screen.findByText("1 face found")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Blur 1 area"));
  await waitFor(() =>
    expect(agentApi.blurContentImage).toHaveBeenCalledWith(
      "c1",
      [{ type: "ellipse", x: 0.2, y: 0.1, w: 0.3, h: 0.3 }],
      7,
    ),
  );
});

test("plan inputs can be edited before they are sent to Gemini", async () => {
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.getPlanInputs.mockResolvedValue({
    city: "pune",
    week_start: "2026-11-02",
    inputs: {
      rising_searches: [],
      top_searches_28d: [],
      signals_by_condition: {
        alcohol: [
          { id: "s1", kind: "review", text: "Staff were rude", rating: 1 },
          { id: "s2", kind: "search_query", text: "alcohol rehab pune" },
        ],
      },
      seasonal_events: [],
      our_website_pages: [],
      headlines_that_brought_enquiries: [],
    },
    rules: {
      briefs_needed: 10,
      allowed_languages: ["en"],
      allowed_formats: ["post", "carousel"],
      allowed_channels: ["instagram"],
      off_limits_topics: [],
      city_notes: "",
    },
  });
  agentApi.generatePlan.mockResolvedValue({
    id: "j1",
    status: "succeeded",
    result: {},
  });
  render(<Plans />);

  fireEvent.click(await screen.findByText(/Draft next week's plan/));
  await waitFor(() =>
    expect(agentApi.getPlanInputs).toHaveBeenCalledWith(
      expect.objectContaining({ city: "pune", week_start: expect.any(String) }),
    ),
  );
  expect(
    await screen.findByDisplayValue("Staff were rude"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByTitle("Leave this out")[0]);
  fireEvent.change(screen.getByPlaceholderText(/Focus on families/), {
    target: { value: "Only family posts" },
  });
  fireEvent.click(screen.getByLabelText("Carousel"));
  fireEvent.click(screen.getByText("Send to Gemini"));
  await waitFor(() => expect(agentApi.generatePlan).toHaveBeenCalled());
  const body = agentApi.generatePlan.mock.calls[0][0];
  expect(body.notes).toBe("Only family posts");
  expect(body.formats).toEqual(["post"]);
  expect(body.channels).toEqual(["instagram"]);
  expect(body.inputs.signals_by_condition.alcohol.map((s) => s.id)).toEqual([
    "s2",
  ]);
});

test("approved plans show the RAG output used and can generate more", async () => {
  const inputs = {
    ranked_topics: [
      {
        id: "t1",
        topic: "Budget Issues",
        kind: "concern",
        condition: null,
        evidence: "103 times (not admitted)",
        score: 0.54,
        negative: 6,
        parts: { demand: 1, conversion: 0.71, concern: 1, capacity: 0 },
      },
    ],
    sentiment: {
      days: 90,
      counts: { positive: 15, neutral: 6, mixed: 4, negative: 2 },
      negative_topics: [{ topic: "cost", n: 3 }],
    },
    rising_searches: [],
    top_searches_28d: [],
    signals_by_condition: {
      alcohol: [
        {
          id: "s1",
          kind: "review",
          text: "Kind staff",
          rating: 5,
          sentiment: "positive",
        },
      ],
    },
    seasonal_events: [{ name: "Diwali" }],
    our_website_pages: [],
    headlines_that_brought_enquiries: ["A gentle first step"],
  };
  const week = {
    id: "w9",
    city: "pune",
    week_start: "2026-11-02",
    status: "approved",
    summary: "Approved week",
    formats: ["carousel"],
    channels: ["instagram"],
    inputs,
    notes: "Speak to mothers",
    briefs: [],
  };
  agentApi.getPlans.mockResolvedValue(page([week]));
  agentApi.getPlan.mockResolvedValue(week);
  agentApi.getPlanInputs.mockResolvedValue({
    city: "pune",
    week_start: "2026-11-02",
    inputs: { ...inputs, signals_by_condition: {} },
    rules: {
      briefs_needed: 10,
      allowed_languages: ["en"],
      allowed_formats: ["post"],
      allowed_channels: ["facebook"],
      off_limits_topics: [],
      city_notes: "",
    },
  });
  agentApi.regeneratePlan.mockResolvedValue({ id: "j2", status: "succeeded" });
  render(<Plans />);

  fireEvent.click(
    await screen.findByText("Why these topics (RAG output used)"),
  );
  expect(await screen.findByText("Kind staff")).toBeInTheDocument();
  expect(screen.getAllByText("Speak to mothers").length).toBeGreaterThan(0);
  expect(screen.getByText("Budget Issues")).toBeInTheDocument();
  expect(screen.getByText("Family worry")).toBeInTheDocument();
  expect(screen.getAllByText("Positive").length).toBeGreaterThan(0);
  expect(
    screen.getByText("How people feel (last 90 days)"),
  ).toBeInTheDocument();
  expect(screen.getByText("Negative · 6")).toBeInTheDocument();
  expect(screen.getByText("cost · 3")).toBeInTheDocument();
  expect(
    screen.getByText(
      "searches 100% · converts to admission 71% · family worry 100%",
    ),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByText("Generate more"));
  expect(await screen.findByDisplayValue("Kind staff")).toBeInTheDocument();
  fireEvent.change(screen.getByDisplayValue("3"), { target: { value: "5" } });
  fireEvent.click(screen.getByText("Send to Gemini"));
  await waitFor(() =>
    expect(agentApi.regeneratePlan).toHaveBeenCalledWith(
      "w9",
      expect.objectContaining({
        mode: "more",
        count: 5,
        formats: ["carousel"],
        channels: ["instagram"],
        notes: "Speak to mothers",
      }),
    ),
  );
});

test("the RAG output page shows what the planner would read and searches it", async () => {
  agentApi.getPlanInputs.mockResolvedValue({
    city: "pune",
    week_start: "2026-11-02",
    inputs: {
      rising_searches: [
        { query: "vyasan mukti kendra pune", this_week: 30, usual_week: 10 },
      ],
      top_searches_28d: [],
      signals_by_condition: {
        alcohol: [{ id: "s1", kind: "review", text: "Kind staff", rating: 5 }],
      },
      seasonal_events: [],
      our_website_pages: [],
      headlines_that_brought_enquiries: [],
    },
    rules: {
      briefs_needed: 10,
      allowed_languages: ["en"],
      allowed_formats: ["post"],
      allowed_channels: ["instagram"],
      off_limits_topics: [],
      city_notes: "",
    },
  });
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.searchSignals.mockResolvedValue([
    {
      score: 0.91,
      signal: {
        id: "s9",
        kind: "review",
        text: "Good detox care",
        city: "pune",
        rating: 5,
      },
    },
  ]);
  render(<RagOutput />);

  expect(await screen.findByText("Kind staff")).toBeInTheDocument();
  expect(screen.getByText("vyasan mukti kendra pune")).toBeInTheDocument();
  expect(
    await screen.findByText(/Call summaries \(anonymised\)/),
  ).toBeInTheDocument();
  expect(await screen.findByText(/Admissions 205/)).toBeInTheDocument();
  expect(agentApi.getPlanInputs).toHaveBeenCalledWith(
    expect.objectContaining({ city: "pune" }),
  );

  fireEvent.change(screen.getByPlaceholderText(/families worried/), {
    target: { value: "detox" },
  });
  fireEvent.click(screen.getByText("Search"));
  expect(await screen.findByText("Good detox care")).toBeInTheDocument();
  expect(screen.getByText("match 0.91")).toBeInTheDocument();
});

test("an existing week is regenerated from the RAG page and unsent edits are kept", async () => {
  localStorage.clear();
  const inputs = {
    rising_searches: [],
    top_searches_28d: [],
    signals_by_condition: {
      alcohol: [{ id: "s1", kind: "review", text: "Kind staff", rating: 5 }],
    },
    seasonal_events: [],
    our_website_pages: [],
    headlines_that_brought_enquiries: [],
  };
  agentApi.getPlanInputs.mockResolvedValue({
    city: "pune",
    week_start: "2026-11-02",
    inputs,
    rules: {
      briefs_needed: 10,
      allowed_languages: ["en"],
      allowed_formats: ["post"],
      allowed_channels: ["instagram"],
      off_limits_topics: [],
      city_notes: "",
    },
  });
  agentApi.getPlans.mockResolvedValue(
    page([
      { id: "w5", city: "pune", week_start: "2026-11-02", status: "approved" },
    ]),
  );
  agentApi.regeneratePlan.mockResolvedValue({ id: "j3", status: "succeeded" });
  render(<RagOutput />);

  expect(await screen.findByText(/already has a plan/)).toBeInTheDocument();
  expect(screen.queryByText("Edit and draft plan")).not.toBeInTheDocument();

  fireEvent.click(screen.getByText("Edit and regenerate plan"));
  const notes = await screen.findByPlaceholderText(/Focus on families/);
  fireEvent.change(notes, { target: { value: "Keep this note" } });
  fireEvent.click(screen.getByText("Cancel"));

  fireEvent.click(screen.getByText("Edit and regenerate plan"));
  expect(
    await screen.findByText("Restored your unsent edits."),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Keep this note")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Send to Gemini"));
  await waitFor(() =>
    expect(agentApi.regeneratePlan).toHaveBeenCalledWith(
      "w5",
      expect.objectContaining({ mode: "regenerate", notes: "Keep this note" }),
    ),
  );
  expect(
    localStorage.getItem("ma-plan-edits:pune:2026-11-02:regenerate"),
  ).toBeNull();
});

test("prompts can be edited, safety prompts are read-only, full prompt is previewed", async () => {
  agentApi.getFacts.mockResolvedValue(page([]));
  agentApi.getPrompts.mockResolvedValue([
    {
      key: "planner",
      title: "Weekly planner",
      purpose: "Turns the RAG output into post ideas.",
      editable: true,
      placeholders: [],
      text: "Default planner text",
      default: "Default planner text",
      customised: false,
    },
    {
      key: "enquiry_scoring",
      title: "Enquiry scoring",
      purpose: "Spots crises.",
      editable: false,
      placeholders: [],
      text: "Crisis rules",
      default: "Crisis rules",
      customised: false,
    },
  ]);
  agentApi.savePrompt.mockResolvedValue({
    key: "planner",
    title: "Weekly planner",
    purpose: "Turns the RAG output into post ideas.",
    editable: true,
    placeholders: [],
    text: "My planner text",
    default: "Default planner text",
    customised: true,
    updated_by: "user:lead",
    updated_at: now,
  });
  render(<BrandBrain />);
  fireEvent.click(screen.getByText("Prompts"));

  expect(
    await screen.findByText("Safety check · view only"),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Crisis rules")).toHaveAttribute("readonly");
  fireEvent.change(screen.getByDisplayValue("Default planner text"), {
    target: { value: "My planner text" },
  });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(agentApi.savePrompt).toHaveBeenCalledWith(
      "planner",
      "My planner text",
    ),
  );
  expect(await screen.findByText("Custom")).toBeInTheDocument();
});

test("a reel can be made from my own script", async () => {
  const reel = {
    ...content,
    id: "r1",
    format: "reel_script",
    channel: "instagram",
    body: { ...content.body, script: "Old script" },
  };
  agentApi.getContentList.mockResolvedValue(page([reel]));
  agentApi.getPlans.mockResolvedValue(page([]));
  agentApi.getContentChecks.mockResolvedValue([]);
  agentApi.makeReel.mockResolvedValue({ id: "j7", status: "succeeded" });
  agentApi.getContent.mockResolvedValue(reel);
  render(<ContentReview />);

  fireEvent.click(await screen.findByText("Make reel with my script"));
  fireEvent.change(screen.getByDisplayValue("Old script"), {
    target: { value: "Scene 1: a calm room. Voice: you are not alone." },
  });
  fireEvent.click(screen.getByText("Check and make reel"));
  await waitFor(() =>
    expect(agentApi.makeReel).toHaveBeenCalledWith(
      "r1",
      "Scene 1: a calm room. Voice: you are not alone.",
    ),
  );
});

test("psychiatrists can edit facts; others see how to get access", async () => {
  const fact = {
    id: "ALC-WD-001",
    text: "Alcohol withdrawal can need medical supervision.",
    condition: "alcohol",
    language: "en",
    source: null,
    approved_by: "user:psy",
    approved_at: now,
    expires_at: null,
    active: true,
  };
  agentApi.getFacts.mockResolvedValue(page([fact]));
  agentApi.updateFact.mockResolvedValue({
    ...fact,
    text: "Stopping alcohol suddenly can be risky.",
  });

  grant(["BRAND"], "WRITE");
  const { unmount } = render(<BrandBrain />);
  expect(await screen.findByText(fact.text)).toBeInTheDocument();
  expect(screen.getByText(/needs Write on/)).toBeInTheDocument();
  expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  unmount();

  grant(["BRAND", "CLINICAL_APPROVAL"], "WRITE");
  render(<BrandBrain />);
  fireEvent.click(await screen.findByText("Edit"));
  fireEvent.change(screen.getByDisplayValue(fact.text), {
    target: { value: "Stopping alcohol suddenly can be risky." },
  });
  expect(screen.getByText(/counts as a new approval/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(agentApi.updateFact).toHaveBeenCalledWith(
      "ALC-WD-001",
      expect.objectContaining({
        text: "Stopping alcohol suddenly can be risky.",
      }),
    ),
  );
});

test("listen data shows website visits and filters leads by a breakdown", async () => {
  agentApi.getWebReport.mockResolvedValue({
    rows: page([
      {
        page: "/rehab-centre-in-pune.html",
        city: "pune",
        sessions: 3080,
        engaged_sessions: 900,
        key_events: 156,
        days: 30,
      },
    ]),
    sessions: 73402,
    key_events: 2678,
    by_city: [{ key: "pune", sessions: 3080, key_events: 156 }],
    by_day: [],
  });
  const leads = {
    rows: page([
      {
        id: "a",
        kind: "lead",
        city: "pune",
        day: "2026-11-01",
        source: "hubspot:jagruti_917971142045",
        condition: "addiction",
        detail: { status: "Callback", not_admitted_reason: "Budget Issues" },
      },
    ]),
    by_city: [{ key: "pune", n: 1 }],
    by_source: [{ key: "hubspot:jagruti_917971142045", n: 1 }],
    by_condition: [{ key: "addiction", n: 1 }],
    by_status: [{ key: "Callback", n: 1 }],
    by_reason: [{ key: "Budget Issues", n: 1 }],
    by_quality: [],
    by_day: [],
    admitted: 0,
    newest: "2026-11-01",
  };
  agentApi.getErpReport.mockResolvedValue(leads);
  render(<ListenData />);

  expect(await screen.findByText("73,402")).toBeInTheDocument();
  expect(screen.getByText("/rehab-centre-in-pune.html")).toBeInTheDocument();
  expect(agentApi.getWebReport).toHaveBeenCalledWith(
    expect.objectContaining({ sort: "sessions", limit: 20, offset: 0 }),
  );

  fireEvent.click(screen.getByText("Leads"));
  expect(
    await screen.findByText("Callback", { selector: "td" }),
  ).toBeInTheDocument();
  expect(screen.getAllByText("jagruti").length).toBeGreaterThan(0);
  expect(screen.getByText(/Newest: /)).toBeInTheDocument();
  expect(agentApi.getErpReport).toHaveBeenCalledWith(
    expect.not.objectContaining({ since: expect.anything() }),
  );
  fireEvent.click(
    screen
      .getAllByTitle("Filter by this")
      .find((el) => el.textContent.includes("Budget Issues")),
  );
  await waitFor(() =>
    expect(agentApi.getErpReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "lead", reason: "Budget Issues" }),
    ),
  );
});

test("owner settings show the rules, save them and list every change", async () => {
  agentApi.getOwnerSettings.mockResolvedValue({
    approval_rules: {
      ads_auto_adjust_enabled: false,
      ads_max_auto_change_pct: 20,
      plan_ready_by: "10:00",
      marketing_lead_webhook_url: null,
      updated_by: null,
    },
    fixed_rules: [
      {
        rule: "A weekly plan must be approved before any post is written",
        who: "Marketing lead",
      },
    ],
  });
  agentApi.setApprovalRules.mockResolvedValue({});
  agentApi.getVoiceGuide.mockResolvedValue({
    tone: "Warm",
    do: ["Be kind"],
    dont: ["Shame"],
  });
  agentApi.getPlaybook.mockResolvedValue({
    city: "pune",
    languages: ["en"],
    formats: ["post"],
    channels: ["instagram"],
    notes: "",
    off_limits_topics: ["rapid detox"],
  });
  agentApi.setPlaybook.mockResolvedValue({});
  agentApi.getBudgets.mockResolvedValue(
    page([
      {
        id: "b1",
        city: "pune",
        month: "2026-11",
        monthly_limit: 31000,
        daily_limit: 1000,
        set_by: "user:1:Lead",
      },
    ]),
  );
  agentApi.getOwnerHistory.mockResolvedValue(
    page([
      {
        id: "a1",
        entity: "approval_rules",
        entity_id: "approval_rules",
        action: "updated",
        actor: "user:1:Lead",
        at: now,
        data: { changes: { plan_ready_by: { from: "10:00", to: "09:30" } } },
      },
    ]),
  );
  render(<OwnerSettings />);

  expect(
    await screen.findByText(
      "A weekly plan must be approved before any post is written",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("Monday 10:00")).toBeInTheDocument();
  expect(await screen.findByText(/^1 of \d+ cities$/)).toBeInTheDocument();

  fireEvent.change(screen.getByDisplayValue("10:00"), {
    target: { value: "09:30" },
  });
  fireEvent.click(screen.getByText("Save rules"));
  await waitFor(() =>
    expect(agentApi.setApprovalRules).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_ready_by: "09:30",
        ads_max_auto_change_pct: 20,
      }),
    ),
  );

  fireEvent.click(screen.getByText("Brand voice"));
  expect(await screen.findByDisplayValue("Warm")).toBeInTheDocument();
  expect(screen.getByText("Be kind")).toBeInTheDocument();
  expect(screen.getByText("Shame")).toBeInTheDocument();

  fireEvent.click(screen.getAllByText("Off-limits topics").at(-1));
  expect(await screen.findByText("rapid detox")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("e.g. rapid detox"), {
    target: { value: "gambling" },
  });
  fireEvent.click(screen.getByText("Add"));
  fireEvent.click(screen.getByText("Save for this city"));
  await waitFor(() =>
    expect(agentApi.setPlaybook).toHaveBeenCalledWith(
      "pune",
      expect.objectContaining({
        off_limits_topics: ["rapid detox", "gambling"],
        formats: ["post"],
      }),
    ),
  );

  fireEvent.click(screen.getByText("Ad limits"));
  expect(await screen.findByDisplayValue("31000")).toBeInTheDocument();
  expect(screen.getByText("Set by Lead")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Change history"));
  expect(await screen.findByText("09:30")).toBeInTheDocument();
});

test("writing a week shows live progress and nobody can start it twice", async () => {
  const week = {
    id: "w7",
    city: "pune",
    week_start: "2026-11-09",
    status: "approved",
  };
  const running = {
    id: "j9",
    type: "content",
    status: "running",
    actor: "user:2:Asha",
    created_at: now,
    started_at: now,
    progress: {
      total: 2,
      done: 1,
      failed: 0,
      current: "Talking to a parent: Second check by Gemini",
      items: [
        {
          id: "b1",
          label: "Withdrawal signs",
          detail: "Carousel · instagram",
          status: "done",
          outcome: "Waiting for the marketing lead",
          started_at: now,
          finished_at: now,
        },
        {
          id: "b2",
          label: "Talking to a parent",
          detail: "Post · facebook",
          status: "running",
          step: "Second check by Gemini",
          started_at: now,
        },
      ],
    },
  };
  agentApi.getPlans.mockResolvedValue(page([week]));
  agentApi.getContentList.mockResolvedValue(page([]));
  agentApi.getActiveJob.mockResolvedValue(null);
  agentApi.getJob.mockResolvedValue(running);
  agentApi.generateContent.mockRejectedValue({
    status: 409,
    message: "this is already running",
    details: { job_id: "j9", actor: "user:2:Asha" },
  });
  render(<ContentReview />);

  const select = await screen.findByDisplayValue("Approved week…");
  await screen.findByText(/pune · week of/);
  fireEvent.change(select, { target: { value: "w7" } });
  fireEvent.click(await screen.findByText("Write content for the week"));

  expect(await screen.findByText("Withdrawal signs")).toBeInTheDocument();
  expect(
    screen.getByText("Waiting for the marketing lead"),
  ).toBeInTheDocument();
  expect(screen.getByText("Second check by Gemini…")).toBeInTheDocument();
  expect(screen.getByText("1 of 2 posts")).toBeInTheDocument();
  expect(screen.getAllByText("Asha").length).toBeGreaterThan(0);
  expect(agentApi.generateContent).toHaveBeenCalledTimes(1);
  expect(agentApi.getJob).toHaveBeenCalledWith("j9");
});

test("plans show the checker report and another user's planning progress", async () => {
  const week = {
    id: "w5",
    city: "pune",
    week_start: "2026-11-09",
    status: "draft",
    summary: "Checked week",
    briefs: [],
    verification: {
      passed: true,
      rewritten: 1,
      dropped: [{ topic: "Cure in 7 days", problems: ["Promises a cure."] }],
      rounds: [
        {
          round: 1,
          checked: 2,
          flagged: [
            { topic: "Cure in 7 days", problems: ["Promises a cure."] },
          ],
        },
        { round: 2, checked: 1, flagged: [] },
      ],
    },
  };
  const job = {
    id: "pj1",
    status: "running",
    actor: "user:2:Asha",
    created_at: now,
    started_at: now,
    progress: {
      total: 4,
      done: 2,
      failed: 0,
      current:
        "Check every brief against the RAG: Rewriting 1 brief(s) the checker flagged",
      items: [
        {
          id: "rag",
          label: "Read the RAG output",
          detail: "",
          status: "done",
          outcome: "12 ranked topics",
          started_at: now,
          finished_at: now,
        },
        {
          id: "write",
          label: "Write the plan with Gemini",
          detail: "",
          status: "done",
          outcome: "10 briefs drafted",
          started_at: now,
          finished_at: now,
        },
        {
          id: "check",
          label: "Check every brief against the RAG",
          detail: "",
          status: "running",
          step: "Rewriting 1 brief(s) the checker flagged",
          started_at: now,
        },
        {
          id: "save",
          label: "Save the plan for approval",
          detail: "",
          status: "waiting",
        },
      ],
    },
  };
  agentApi.getPlans.mockResolvedValue(page([week]));
  agentApi.getPlan.mockResolvedValue(week);
  agentApi.getActiveJob.mockImplementation((key) =>
    Promise.resolve(key.startsWith("plan:pune:") ? job : null),
  );
  agentApi.getJob.mockResolvedValue(job);
  render(<Plans />);

  expect(
    await screen.findByText("Checked against the RAG"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText("See what was fixed"));
  expect(screen.getAllByText("Promises a cure.").length).toBeGreaterThan(0);
  expect(screen.getByText(/Dropped \(still failing/)).toBeInTheDocument();

  fireEvent.click(await screen.findByText(/Asha is planning/));
  expect(
    await screen.findByText("Rewriting 1 brief(s) the checker flagged…"),
  ).toBeInTheDocument();
  expect(screen.getByText("2 of 4 steps")).toBeInTheDocument();
  agentApi.getActiveJob.mockReset();
});

test("rewrite all posts previews what changes and starts one tracked job", async () => {
  agentApi.getPlans.mockResolvedValue(
    page([
      { id: "w8", city: "pune", week_start: "2026-11-09", status: "approved" },
    ]),
  );
  agentApi.getContentList.mockResolvedValue(page([]));
  agentApi.getActiveJob.mockResolvedValue(null);
  agentApi.getRewritePreview.mockResolvedValue({
    items: [
      {
        id: "c1",
        topic: "Withdrawal signs",
        state: "awaiting_b",
        format: "post",
      },
    ],
    skipped: [
      {
        id: "c2",
        topic: "Visiting hours",
        state: "approved",
        format: "post",
        reason: "already approved",
      },
    ],
  });
  agentApi.rewriteWeek.mockResolvedValue({
    id: "j3",
    status: "queued",
    actor: "user:1:Lead",
  });
  agentApi.getJob.mockResolvedValue({
    id: "j3",
    status: "running",
    actor: "user:1:Lead",
    created_at: now,
    progress: {
      total: 1,
      done: 0,
      failed: 0,
      current:
        "Withdrawal signs: Checking it matches the brief, the RAG material and the brand voice",
      items: [
        {
          id: "c1",
          label: "Withdrawal signs",
          detail: "Post · was Waiting for the marketing lead",
          status: "running",
          step: "Checking it matches the brief, the RAG material and the brand voice",
          started_at: now,
        },
      ],
    },
  });
  render(<ContentReview />);

  const select = await screen.findByDisplayValue("Approved week…");
  await screen.findByText(/pune · week of/);
  fireEvent.change(select, { target: { value: "w8" } });
  fireEvent.click(await screen.findByText("Rewrite all posts"));
  expect(await screen.findByText("Withdrawal signs")).toBeInTheDocument();
  expect(screen.getByText("already approved")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/Warmer and shorter/), {
    target: { value: "Speak to mothers" },
  });
  fireEvent.click(screen.getByText("Rewrite 1 post"));
  await waitFor(() =>
    expect(agentApi.rewriteWeek).toHaveBeenCalledWith({
      week_id: "w8",
      notes: "Speak to mothers",
      include_approved: false,
    }),
  );
  expect(
    await screen.findByText(
      "Checking it matches the brief, the RAG material and the brand voice…",
    ),
  ).toBeInTheDocument();
});

test("google posts let the owner pick the button and the week follows the post", async () => {
  const gbp = {
    ...content,
    id: "g1",
    week_id: "w4",
    format: "gbp_post",
    channel: "gbp",
    button: null,
  };
  agentApi.getPlans.mockResolvedValue(
    page([
      {
        id: "w4",
        city: "mumbai",
        week_start: "2026-11-02",
        status: "approved",
      },
    ]),
  );
  agentApi.getContentList.mockResolvedValue(page([gbp]));
  agentApi.getContentChecks.mockResolvedValue([]);
  agentApi.getActiveJob.mockResolvedValue(null);
  agentApi.setContentButton.mockResolvedValue({ ...gbp, button: "CALL" });
  render(<ContentReview />);

  const picker = await screen.findByLabelText("Button on the post");
  expect(screen.getAllByText("Learn more").length).toBeGreaterThan(0);
  fireEvent.change(picker, { target: { value: "CALL" } });
  await waitFor(() =>
    expect(agentApi.setContentButton).toHaveBeenCalledWith("g1", "CALL"),
  );
  await waitFor(() =>
    expect(screen.getByDisplayValue(/mumbai · week of/)).toBeInTheDocument(),
  );
  expect(
    screen.getByText("Rewrite all posts").closest("button"),
  ).not.toBeDisabled();
});

test("signals and website reads show who is running them and their progress", async () => {
  const listen = {
    id: "lj1",
    status: "running",
    actor: "user:2:Asha",
    created_at: now,
    started_at: now,
    progress: {
      total: 6,
      done: 2,
      failed: 0,
      current: "Google reviews",
      items: [
        {
          id: "gsc",
          label: "Google Search Console",
          detail: "searches per city",
          status: "done",
          outcome: "new days only",
          started_at: now,
          finished_at: now,
        },
        {
          id: "ga4",
          label: "Google Analytics (GA4)",
          detail: "",
          status: "done",
          outcome: "fetched",
          started_at: now,
          finished_at: now,
        },
        {
          id: "gbp",
          label: "Google reviews",
          detail: "",
          status: "running",
          started_at: now,
        },
        { id: "erp", label: "Jagruti ERP", detail: "", status: "waiting" },
      ],
    },
  };
  agentApi.getLatestDigest.mockResolvedValue(null);
  agentApi.getTrends.mockResolvedValue([]);
  agentApi.getAlerts.mockResolvedValue(page([]));
  agentApi.getActiveJob.mockImplementation((key) =>
    Promise.resolve(key === "listen" ? listen : null),
  );
  agentApi.getJob.mockResolvedValue(listen);
  render(<Signals />);

  fireEvent.click(await screen.findByText(/Asha is fetching/));
  expect(await screen.findByText("Google Search Console")).toBeInTheDocument();
  expect(screen.getByText("2 of 6 steps")).toBeInTheDocument();
  expect(screen.getByText("Rebuild digest")).toBeInTheDocument();
  agentApi.getActiveJob.mockReset();
});
