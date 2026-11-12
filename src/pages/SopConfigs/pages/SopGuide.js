import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Row,
  Col,
  Badge,
  Table,
  Alert,
} from "reactstrap";
import { useMediaQuery } from "../../../Components/Hooks/useMediaQuery";

const SectionAnchor = ({ id, children }) => (
  <h4 id={id} className="fw-bold text-primary mt-4 mb-3">
    {children}
  </h4>
);

const Kbd = ({ children }) => (
  <code
    className="px-1"
    style={{
      background: "#f2f4f8",
      border: "1px solid #e5e7eb",
      borderRadius: 4,
      fontSize: "0.9em",
    }}
  >
    {children}
  </code>
);

const Step = ({ n, title, children }) => (
  <div className="d-flex mb-3">
    <div
      className="me-3 d-flex align-items-center justify-content-center fw-bold"
      style={{
        minWidth: 32,
        height: 32,
        borderRadius: "50%",
        background: "#0d6efd",
        color: "white",
      }}
    >
      {n}
    </div>
    <div>
      <div className="fw-semibold mb-1">{title}</div>
      <div className="text-muted">{children}</div>
    </div>
  </div>
);

const SopGuide = () => {
  const isMobile = useMediaQuery("(max-width: 1000px)");
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <CardBody
      className="p-3 bg-white"
      style={isMobile ? { width: "100%" } : { width: "78%" }}
    >
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="display-6 fw-bold text-primary mb-1">
            <i className="bx bx-book-open me-2" />
            SOP CONFIGURATION GUIDE
          </h1>
          <p className="text-muted mb-0">
            How to design an SOP rule that fires the right alert to the right
            people at the right time.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            color="primary"
            size="sm"
            onClick={() => navigate("/sop-configs/save")}
          >
            <i className="bx bx-plus me-1" />
            Create SOP
          </Button>
          <Button
            color="secondary"
            outline
            size="sm"
            onClick={() => navigate("/sop-configs/manage")}
          >
            <i className="bx bx-list-ul me-1" />
            Manage SOPs
          </Button>
        </div>
      </div>

      <div
        style={{
          maxHeight: "82vh",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {/* Table of contents */}
        <Card className="mb-4 border-primary">
          <CardHeader className="fw-semibold bg-light">On this page</CardHeader>
          <CardBody>
            <Row>
              <Col md={6}>
                <ul className="mb-0">
                  <li>
                    <a href="#mental-model" onClick={(e) => { e.preventDefault(); scrollTo("mental-model"); }}>
                      1. The mental model
                    </a>
                  </li>
                  <li>
                    <a href="#anatomy" onClick={(e) => { e.preventDefault(); scrollTo("anatomy"); }}>
                      2. Anatomy of an SOP rule
                    </a>
                  </li>
                  <li>
                    <a href="#basic-info" onClick={(e) => { e.preventDefault(); scrollTo("basic-info"); }}>
                      3. Basic Info — name &amp; protocol
                    </a>
                  </li>
                  <li>
                    <a href="#satisfying-criteria" onClick={(e) => { e.preventDefault(); scrollTo("satisfying-criteria"); }}>
                      4. Satisfying Criteria (the gate)
                    </a>
                  </li>
                  <li>
                    <a href="#target-blocks" onClick={(e) => { e.preventDefault(); scrollTo("target-blocks"); }}>
                      5. Target Blocks (the rules)
                    </a>
                  </li>
                </ul>
              </Col>
              <Col md={6}>
                <ul className="mb-0">
                  <li>
                    <a href="#triggers" onClick={(e) => { e.preventDefault(); scrollTo("triggers"); }}>
                      6. Triggers — IMMEDIATE vs DELAYED
                    </a>
                  </li>
                  <li>
                    <a href="#routing" onClick={(e) => { e.preventDefault(); scrollTo("routing"); }}>
                      7. Routing (who gets the alert)
                    </a>
                  </li>
                  <li>
                    <a href="#templates" onClick={(e) => { e.preventDefault(); scrollTo("templates"); }}>
                      8. Alert templates &amp; placeholders
                    </a>
                  </li>
                  <li>
                    <a href="#medicines" onClick={(e) => { e.preventDefault(); scrollTo("medicines"); }}>
                      9. Suggested medicines
                    </a>
                  </li>
                  <li>
                    <a href="#walkthrough" onClick={(e) => { e.preventDefault(); scrollTo("walkthrough"); }}>
                      10. Walkthrough — your first rule
                    </a>
                  </li>
                  <li>
                    <a href="#tips" onClick={(e) => { e.preventDefault(); scrollTo("tips"); }}>
                      11. Tips &amp; common pitfalls
                    </a>
                  </li>
                  <li>
                    <a href="#compliance" onClick={(e) => { e.preventDefault(); scrollTo("compliance"); }}>
                      12. Compliance — licence expiry alerts
                    </a>
                  </li>
                </ul>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* 1. Mental model */}
        <SectionAnchor id="mental-model">1. The mental model</SectionAnchor>
        <p>
          An <strong>SOP rule</strong> is a clinical safety net. You describe a
          situation in data terms (e.g.{" "}
          <em>"systolic BP under 90 mmHg for any patient"</em>) and the system
          fires an <strong>alert</strong> to the right staff the moment that
          situation is detected — either as it happens (
          <Badge color="info">IMMEDIATE</Badge>) or because something expected
          never happened (<Badge color="warning">DELAYED</Badge>).
        </p>
        <p className="mb-1">Two engines watch for the conditions you define:</p>
        <ul>
          <li>
            <strong>Immediate engine</strong> — reacts the instant a clinician
            saves a vital, lab, prescription, or assessment. Best for
            thresholds (BP, SpO₂, CIWA score…).
          </li>
          <li>
            <strong>Delayed cron</strong> — runs once a day and checks whether
            expected documents (labs, assessments, prescriptions) were filed by
            their deadline. Best for "must do by hour X" rules.
          </li>
        </ul>

        {/* 2. Anatomy */}
        <SectionAnchor id="anatomy">2. Anatomy of an SOP rule</SectionAnchor>
        <p>Every rule is built from five layers, stacked top to bottom:</p>
        <Card className="mb-3 bg-light border-0">
          <CardBody>
            <ol className="mb-0">
              <li>
                <strong>Basic Info</strong> — SOP Name, Protocol identifier.
              </li>
              <li>
                <strong>Satisfying Criteria</strong> (optional) — a global gate.
                If set, the rule only evaluates further when this passes.
              </li>
              <li>
                <strong>Target Blocks</strong> — one or more independent alert
                recipes. Each block carries its own conditions, severity,
                template and routing.
              </li>
              <li>
                <strong>Conditions</strong> inside a block — every condition
                must pass (AND-logic). To express OR, add another block.
              </li>
              <li>
                <strong>Suggested Medicines</strong> (optional) — a
                pre-populated prescription draft staff can apply when the alert
                fires.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 3. Basic Info */}
        <SectionAnchor id="basic-info">3. Basic Info — name &amp; protocol</SectionAnchor>
        <Row>
          <Col md={6}>
            <Card className="mb-2 h-100">
              <CardHeader className="fw-semibold">SOP Name *</CardHeader>
              <CardBody>
                A short, unique, kebab-style label.{" "}
                <Kbd>AWP-Hypotension-Transfer</Kbd>,{" "}
                <Kbd>CIWA-Critical-Review</Kbd>. Names are globally unique —
                duplicates are rejected.
              </CardBody>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-2 h-100">
              <CardHeader className="fw-semibold">Protocol</CardHeader>
              <CardBody>
                The protocol identifier this rule originates from (e.g.{" "}
                <Kbd>JRC/DA/AWP/002</Kbd>). Optional, but recommended — the
                Alerts page can search by protocol ID, so a clean value here
                lets you pull every rule from one protocol with one search.
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* 4. Satisfying Criteria */}
        <SectionAnchor id="satisfying-criteria">
          4. Satisfying Criteria (the gate)
        </SectionAnchor>
        <p>
          The Satisfying Criteria block is a <strong>universal gate</strong>{" "}
          that runs before any target block is evaluated. If you leave it
          empty, every trigger reaches the target blocks.
        </p>
        <Alert color="info" className="d-flex">
          <i className="bx bx-info-circle me-2 fs-4" />
          <div>
            <strong>When to use it:</strong> when the entire rule should only
            apply to a sub-population (elderly patients, IPD only,
            post-detoxification patients, etc.). E.g.{" "}
            <Kbd>Patient.age &ge; 60</Kbd> ensures none of the target blocks
            below will fire for anyone under 60.
          </div>
        </Alert>
        <Alert color="info" className="d-flex">
          <i className="bx bx-user-check me-2 fs-4" />
          <div>
            <strong>Patient Type:</strong> choose{" "}
            <Kbd>Admission &rarr; Patient Type (admission card, else Detail
            Admission)</Kbd>{" "}
            to gate a rule on the patient&rsquo;s type (Psychiatric, Addiction
            or Geriatric / Dementia / Palliative). It reads the Patient Type on
            the admission card, which every Detail Admission save with a type
            updates. Only if the card has none does it read the newest Detail
            Admission chart on that admission that has a type. If neither has
            one, the patient counts as <em>not</em> any type &mdash; so{" "}
            <Kbd>NOT EQUALS Geriatric</Kbd> still lets the rule fire, and{" "}
            <Kbd>EQUALS</Kbd> does not. E.g. add{" "}
            <Kbd>Patient Type NOT EQUALS Geriatric</Kbd> to the Admission
            Duration Review rules so they skip geriatric patients. Add it{" "}
            <strong>last</strong>: conditions are checked in order, and this one
            may have to look up a chart. Satisfying Criteria only.
          </div>
        </Alert>

        {/* 5. Target Blocks */}
        <SectionAnchor id="target-blocks">5. Target Blocks (the rules)</SectionAnchor>
        <p>
          A target block is the actual alert recipe. You can have many blocks
          in one SOP rule — they evaluate independently, each producing its own
          alert.
        </p>
        <Table bordered size="sm" responsive>
          <thead className="table-light">
            <tr>
              <th>Block field</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Rule Name</strong></td>
              <td>Block-level label shown in the alert UI. Make it specific — <Kbd>Severe-SBP180</Kbd>, <Kbd>CIWA-Senior-Review</Kbd>.</td>
            </tr>
            <tr>
              <td><strong>Severity</strong></td>
              <td><Badge color="success">LOW</Badge> · <Badge color="warning">MEDIUM</Badge> · <Badge color="danger">HIGH</Badge> · <Badge color="dark">CRITICAL</Badge> — drives colour, sort order, and toast urgency.</td>
            </tr>
            <tr>
              <td><strong>Alert Template</strong></td>
              <td>The text shown on the alert. Supports placeholders — see <a href="#templates" onClick={(e) => { e.preventDefault(); scrollTo("templates"); }}>section 8</a>.</td>
            </tr>
            <tr>
              <td><strong>Conditions</strong></td>
              <td>One or more <Kbd>Model · Field · Operator · Value</Kbd> rows. All must pass (AND).</td>
            </tr>
            <tr>
              <td><strong>Routing</strong></td>
              <td>Which roles and/or specific users get notified. At least one channel is required.</td>
            </tr>
            <tr>
              <td><strong>Action Guidance</strong></td>
              <td>Optional free-text — the clinical action staff should take. Appears on the alert detail page.</td>
            </tr>
            <tr>
              <td><strong>Reference Section</strong></td>
              <td>Optional — points to the protocol section (e.g. <Kbd>Section VIII.D</Kbd>) so staff can verify.</td>
            </tr>
          </tbody>
        </Table>

        <p className="mt-3">
          <strong>How a condition works:</strong> pick a Model (the data
          source), then a Field, then an Operator, then a Value.
        </p>
        <Card className="mb-3 border-secondary">
          <CardBody>
            <code className="d-block">
              VitalSign · bloodPressure.systolic · LESS_THAN · 90
            </code>
            <small className="text-muted">
              Fires when a saved VitalSign has systolic BP below 90 mmHg.
            </small>
          </CardBody>
        </Card>
        <p className="mb-1">Available operators:</p>
        <ul>
          <li><strong>Numeric</strong> — <Kbd>GREATER_THAN</Kbd>, <Kbd>LESS_THAN</Kbd>, <Kbd>GREATER_THAN_OR_EQUAL</Kbd>, <Kbd>LESS_THAN_OR_EQUAL</Kbd>, <Kbd>EQUALS</Kbd>, <Kbd>NOT_EQUALS</Kbd>.</li>
          <li><strong>Existence</strong> — <Kbd>EXISTS</Kbd>, <Kbd>NOT_EXISTS</Kbd>. Value field is hidden — used for "was this document recorded at all?" rules.</li>
        </ul>

        {/* 6. Triggers */}
        <SectionAnchor id="triggers">6. Triggers — IMMEDIATE vs DELAYED</SectionAnchor>
        <Row>
          <Col md={6}>
            <Card className="mb-3 h-100">
              <CardHeader className="fw-semibold bg-light">
                <Badge color="info" className="me-2">IMMEDIATE</Badge>
                Fires as it happens
              </CardHeader>
              <CardBody>
                <p>
                  Runs the moment a target document is saved (VitalSign,
                  LabReport, ciwaTest, etc.). Best for <em>threshold</em>{" "}
                  rules: "if value crosses X, alert".
                </p>
                <small className="text-muted">
                  Example: SBP &lt; 90 → CRITICAL transfer alert the moment a
                  nurse records that vital.
                </small>
              </CardBody>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-3 h-100">
              <CardHeader className="fw-semibold bg-light">
                <Badge color="warning" className="me-2">DELAYED</Badge>
                Fires when something is missing
              </CardHeader>
              <CardBody>
                <p>
                  Checked daily at 2 AM (Deadline rules can also be checked every
                  3 hours). Best for <em>deadline</em> rules:
                  "must have happened by hour X — if not, alert".
                </p>
                <small className="text-muted">
                  Example: baseline labs not filed within 24h of admission →
                  HIGH alert next cron run.
                </small>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <p>
          When you pick <Badge color="warning">DELAYED</Badge>, an extra{" "}
          <strong>Schedule</strong> section appears with three patterns:
        </p>
        <Table bordered size="sm" responsive>
          <thead className="table-light">
            <tr>
              <th>Schedule</th>
              <th>When it checks</th>
              <th>Typical use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Deadline</strong> (N hours after admission)</td>
              <td>
                Due at admission + <Kbd>intervalHours</Kbd>. Alerts once, or — with{" "}
                <em>Alert every day until done</em> — every 24 h until the record
                exists. Tick <em>Check every 3 hours</em> for short deadlines.
              </td>
              <td>"Baseline labs within 24h of admission." "Prescription within 2h, then daily until written."</td>
            </tr>
            <tr>
              <td><strong>Continuous</strong> (every N hours)</td>
              <td>Every <Kbd>intervalHours</Kbd> from admission until discharge.</td>
              <td>"CIWA-Ar at least every 6 hours."</td>
            </tr>
            <tr>
              <td><strong>Days</strong></td>
              <td>On each listed day-since-admission (e.g. Day 1, Day 3, Day 7).</td>
              <td>"Morse fall assessment on Day 1, Day 3, Day 7."</td>
            </tr>
          </tbody>
        </Table>
        <p className="text-muted">
          <strong>Grace hours</strong> is your tolerance window — a deadline
          of 24h with a grace of 2 won't fire until hour 26. Use it to absorb
          normal documentation lag.
        </p>

        {/* 7. Routing */}
        <SectionAnchor id="routing">7. Routing (who gets the alert)</SectionAnchor>
        <p>Each block needs at least one notification channel:</p>
        <ul>
          <li>
            <strong>Notify roles</strong> — every active user with that role
            gets the alert. Good for broad routing (
            <Kbd>NURSING_SUPERVISOR</Kbd>, <Kbd>PHYSICIAN</Kbd>).
          </li>
          <li>
            <strong>Notify specific users</strong> — pin a named person (e.g.
            the Clinical Director). Good when a particular individual must
            always see this alert regardless of role coverage.
          </li>
        </ul>
        <p>
          The Alerts inbox filters by routing automatically — a clinician only
          sees alerts they were routed to.
        </p>

        {/* 8. Templates */}
        <SectionAnchor id="templates">
          8. Alert templates &amp; placeholders
        </SectionAnchor>
        <p>
          The <strong>Alert Template</strong> is the message clinicians read.
          Use placeholders to inject runtime values:
        </p>
        <Table bordered size="sm" responsive>
          <thead className="table-light">
            <tr>
              <th>Placeholder</th>
              <th>Resolves to</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Kbd>{`{patient.name}`}</Kbd></td>
              <td>The patient's full name.</td>
            </tr>
            <tr>
              <td><Kbd>{`{field.value}`}</Kbd></td>
              <td>The value that caused the condition to match (e.g. the SBP reading).</td>
            </tr>
            <tr>
              <td><Kbd>{`{patient.age}`}</Kbd>, <Kbd>{`{patient.gender}`}</Kbd></td>
              <td>Standard patient attributes.</td>
            </tr>
          </tbody>
        </Table>
        <Card className="mb-3 border-secondary">
          <CardBody>
            <code className="d-block">
              Patient {"{patient.name}"} SBP {"{field.value}"} mmHg —
              haemodynamic instability, prepare transfer
            </code>
          </CardBody>
        </Card>

        {/* 9. Medicines */}
        <SectionAnchor id="medicines">9. Suggested medicines</SectionAnchor>
        <p>
          When the alert fires, staff can review a pre-filled prescription
          draft you attach to the rule. Useful for protocolised responses
          (e.g. "CIWA &gt; 10 → CDZ 10mg SOS"). For each medicine you set:
        </p>
        <ul>
          <li><strong>Medicine</strong> — searchable from your medicine catalogue.</li>
          <li><strong>Dosage</strong> — Morning / Afternoon / Evening + unit. At least one slot must be filled.</li>
          <li><strong>Intake</strong> — Before or After food.</li>
          <li><strong>Priority</strong> &amp; <strong>Category</strong> — for triage and grouping.</li>
          <li><strong>Applicable days</strong> — restrict to specific days post-admission, or leave empty for "all days".</li>
          <li><strong>Instructions / Rationale</strong> — optional free-text for the prescribing clinician.</li>
        </ul>

        {/* 10. Walkthrough */}
        <SectionAnchor id="walkthrough">
          10. Walkthrough — your first rule
        </SectionAnchor>
        <p>Let's build a CRITICAL alert for severe hypotension end-to-end.</p>

        <Step n={1} title='Open "Create New" from the SOP sidebar.'>
          You'll land on <Kbd>/sop-configs/save</Kbd>.
        </Step>
        <Step n={2} title="Fill Basic Info.">
          SOP Name: <Kbd>AWP-Hypotension-Transfer</Kbd>. Protocol:{" "}
          <Kbd>JRC/DA/AWP/002</Kbd>.
        </Step>
        <Step n={3} title="Skip Satisfying Criteria.">
          We want this to apply to every patient, so leave it empty.
        </Step>
        <Step
          n={4}
          title="Configure the first Target Block."
        >
          <ul className="mb-0 mt-1">
            <li>Rule Name: <Kbd>Severe-Hypotension</Kbd></li>
            <li>Severity: <Badge color="dark">CRITICAL</Badge></li>
            <li>
              Alert Template: <Kbd>Patient {"{patient.name}"} SBP {"{field.value}"} mmHg — prepare transfer</Kbd>
            </li>
            <li>
              Condition: <Kbd>VitalSign · bloodPressure.systolic · LESS_THAN · 90</Kbd>, trigger{" "}
              <Badge color="info">IMMEDIATE</Badge>.
            </li>
          </ul>
        </Step>
        <Step n={5} title="Add routing.">
          Tick <Kbd>PHYSICIAN</Kbd> and <Kbd>NURSING_SUPERVISOR</Kbd>. Add the
          Clinical Director as a specific user.
        </Step>
        <Step n={6} title="Fill Action Guidance.">
          <em>"Stabilise IV access, O₂ if SpO₂ &lt; 92, call receiving hospital ER."</em>
        </Step>
        <Step n={7} title="Save.">
          Click <Kbd>Create SOP Rule</Kbd>, confirm in the modal. The rule is
          live — the next VitalSign with SBP &lt; 90 will fire the alert.
        </Step>

        <Alert color="success" className="d-flex mt-3">
          <i className="bx bx-check-circle me-2 fs-4" />
          <div>
            <strong>Verify it works:</strong> save a test VitalSign that
            crosses the threshold, then check <Kbd>/sop-configs/alerts</Kbd>{" "}
            — the alert should appear within seconds for any routed user.
          </div>
        </Alert>

        {/* 11. Tips */}
        <SectionAnchor id="tips">11. Tips &amp; common pitfalls</SectionAnchor>
        <ul>
          <li>
            <strong>One concern per block.</strong> If a single rule needs
            "SBP &lt; 90 <em>OR</em> SpO₂ &lt; 92", use two blocks. All
            conditions <em>inside</em> a block are AND'd.
          </li>
          <li>
            <strong>Name protocols consistently.</strong> The Alerts page
            search can now match by protocol ID — so a tidy{" "}
            <Kbd>JRC/DA/AWP/002</Kbd> across every alcohol-withdrawal rule
            lets you pull them all in one search.
          </li>
          <li>
            <strong>Use Satisfying Criteria for sub-populations</strong> like
            elderly (<Kbd>Patient.age &ge; 60</Kbd>) or IPD-only. It keeps the
            target blocks themselves simple.
          </li>
          <li>
            <strong>DELAYED rules de-duplicate.</strong> The cron won't fire
            the same missed-deadline alert twice for the same admission, so
            it's safe to leave a rule active for weeks.
          </li>
          <li>
            <strong>Use <Kbd>EXISTS</Kbd> for "must be done" rules.</strong>{" "}
            Pair it with DELAYED + a Deadline schedule to detect when an
            expected document is overdue.
          </li>
          <li>
            <strong>Test on staging before flipping isActive on.</strong> Save
            the rule inactive first, simulate the trigger, confirm the alert
            looks right, then activate.
          </li>
          <li>
            <strong>Edit creates a new version</strong>, not an overwrite —
            historical alerts still reference the rule by ID, so you can
            tweak thresholds without breaking the audit trail.
          </li>
        </ul>

        {/* 12. Compliance */}
        <SectionAnchor id="compliance">
          12. Compliance — licence expiry alerts
        </SectionAnchor>
        <p>
          A Compliance rule watches the centre licence register (Compliance →
          Register) instead of patients, and alerts before a licence&apos;s{" "}
          <strong>Valid till</strong> date.
        </p>
        <Step n={1} title="Basic Info.">
          Any name; the category is set to <Kbd>Compliance</Kbd> for you.
        </Step>
        <Step n={2} title="Satisfying Criteria.">
          Pick the centres. Optionally narrow it to a{" "}
          <Kbd>Compliance · Compliance type</Kbd> or{" "}
          <Kbd>Compliance · Compliance category</Kbd> (Equals / Not equals).
        </Step>
        <Step n={3} title="Target block condition.">
          <Kbd>Compliance · Valid till · Days before</Kbd>, then the{" "}
          <strong>Alert firing day(s)</strong> — e.g. <Kbd>30</Kbd>, or several
          such as <Kbd>90</Kbd> <Kbd>30</Kbd> <Kbd>7</Kbd>. <Kbd>On expiry day</Kbd>{" "}
          (0) alerts on the day itself.
        </Step>
        <Step n={4} title="Routing.">
          Tick the roles (e.g. <Kbd>ADMIN</Kbd>, <Kbd>MANAGER</Kbd>) or pick
          people. A role only sees alerts for the centres in their access.
        </Step>
        <ul>
          <li>
            Checked every morning at <strong>4:00 AM</strong>. Each firing day
            alerts <strong>once per licence term</strong>; an approved renewal
            starts a new cycle.
          </li>
          <li>
            A licence uploaded late still gets its alert on the next run. If
            several firing days are reached at once, only the nearest fires.
          </li>
          <li>
            <Kbd>On expiry day</Kbd> also alerts once for a licence that has
            already expired.
          </li>
          <li>
            No alerts while a renewal is underway (marked In renewal, or a
            renewed certificate is waiting for approval). Approving the renewal
            closes the old term&apos;s open alerts automatically.
          </li>
          <li>
            Skipped: lifetime registrations, records with no approved primary
            certificate, and inactive compliance types.
          </li>
          <li>
            The document&apos;s own &ldquo;Start renewal before expiry&rdquo;
            value is not used — the rule&apos;s firing days decide.
          </li>
          <li>
            Template placeholders: <Kbd>{"{centre}"}</Kbd>{" "}
            <Kbd>{"{complianceType}"}</Kbd> <Kbd>{"{licenceNumber}"}</Kbd>{" "}
            <Kbd>{"{validTill}"}</Kbd> <Kbd>{"{daysLeft}"}</Kbd>.
          </li>
        </ul>

        {/* Footer CTA */}
        <Card className="mt-4 mb-3 border-primary">
          <CardBody className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h5 className="mb-1">Ready to build one?</h5>
              <small className="text-muted">
                Open the form — every section above maps 1:1 to a field on the
                page.
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button
                color="primary"
                onClick={() => navigate("/sop-configs/save")}
              >
                <i className="bx bx-plus me-1" />
                Create SOP
              </Button>
              <Button
                color="secondary"
                outline
                onClick={() => navigate("/sop-configs/manage")}
              >
                <i className="bx bx-list-ul me-1" />
                Manage SOPs
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </CardBody>
  );
};

export default SopGuide;
