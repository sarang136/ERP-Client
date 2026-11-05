import {
  emptyRegistration,
  missingRequiredRegistration,
  registrationSchema,
  registrationsPayload,
  toRegistrationFormValue,
} from "./ProfessionalRegistrations";

const complete = (overrides = {}) => ({
  ...emptyRegistration("NURSE"),
  council: "STATE_NURSING_COUNCIL",
  state: "Maharashtra",
  registrationNumber: "MNC/2015/12345",
  registrationType: "PERMANENT",
  qualification: "GNM",
  issueDate: "2015-06-01",
  validUntil: "2030-06-01",
  certificateFile: new File(["%PDF"], "cert.pdf", { type: "application/pdf" }),
  ...overrides,
});

const errorsOf = async (value) => {
  try {
    await registrationSchema.validate(value, { abortEarly: false });
    return [];
  } catch (err) {
    return err.inner.map((e) => e.path);
  }
};

describe("registrationSchema", () => {
  it("accepts a complete registration", async () => {
    expect(await errorsOf(complete())).toEqual([]);
  });

  it("needs the state only for a state council", async () => {
    expect(await errorsOf(complete({ state: "" }))).toEqual(["state"]);
    expect(
      await errorsOf(
        complete({ profession: "CLINICAL_PSYCHOLOGIST", council: "RCI", state: "" }),
      ),
    ).toEqual([]);
  });

  it("needs a council that belongs to the profession", async () => {
    expect(await errorsOf(complete({ council: "RCI" }))).toContain("council");
  });

  it("needs valid until, unless no expiry is ticked", async () => {
    expect(await errorsOf(complete({ validUntil: "" }))).toEqual(["validUntil"]);
    expect(await errorsOf(complete({ validUntil: "2014-01-01" }))).toEqual([
      "validUntil",
    ]);
    expect(await errorsOf(complete({ validUntil: "", noExpiry: true }))).toEqual(
      [],
    );
  });

  it("needs a certificate: a new file or the stored one", async () => {
    expect(await errorsOf(complete({ certificateFile: null }))).toEqual([
      "certificateFile",
    ]);
    expect(
      await errorsOf(
        complete({ certificateFile: null, certificate: { url: "https://x/c.pdf" } }),
      ),
    ).toEqual([]);
    const doc = new File(["x"], "cert.doc", { type: "application/msword" });
    expect(await errorsOf(complete({ certificateFile: doc }))).toEqual([
      "certificateFile",
    ]);
  });
});

describe("registrationsPayload", () => {
  it("points new files at their index and drops form-only fields", () => {
    const stored = toRegistrationFormValue({
      _id: "abc",
      profession: "DOCTOR",
      council: "NMC",
      registrationNumber: "1",
      issueDate: "2015-06-01T00:00:00.000Z",
      validUntil: null,
      noExpiry: true,
      certificate: { url: "https://x/old.pdf" },
    });
    const fresh = complete();
    const { registrations, files } = registrationsPayload([stored, fresh]);

    expect(files).toEqual([fresh.certificateFile]);
    expect(registrations[0]).toMatchObject({ _id: "abc", issueDate: "2015-06-01" });
    expect(registrations[0].certificateUpload).toBeUndefined();
    expect(registrations[1].certificateUpload).toBe(0);
    for (const r of registrations) {
      expect(r).not.toHaveProperty("certificate");
      expect(r).not.toHaveProperty("certificateFile");
      expect(r).not.toHaveProperty("clientKey");
    }
  });
});

describe("missingRequiredRegistration", () => {
  const nurseRole = { name: "Nurse", registration: "REQUIRED", profession: "NURSE" };

  it("only a required role needs one, for its own profession", () => {
    expect(missingRequiredRegistration({ ...nurseRole, registration: "OPTIONAL" }, [])).toBeNull();
    expect(missingRequiredRegistration(undefined, [])).toBeNull();
    expect(missingRequiredRegistration(nurseRole, [])).toBe(
      "The Nurse role needs a Nurse registration",
    );
    expect(missingRequiredRegistration(nurseRole, [{ profession: "DOCTOR" }])).not.toBeNull();
    expect(missingRequiredRegistration(nurseRole, [{ profession: "NURSE" }])).toBeNull();
  });
});
