import { describe, it, expect } from "vitest";
import { renderNotification, emailLayout } from "./catalogue";
import { NotificationType } from "./types";

const ALL_TYPES: NotificationType[] = [
  "contribution_approved",
  "contribution_rejected",
  "claim_approved",
  "claim_rejected",
  "credit_approved",
  "credit_rejected",
  "credit_needs_info",
  "credit_settled",
  "donation_approved",
  "donation_rejected",
  "member_approved",
  "hosting_reminder",
  "arrears_notice",
  "credit_notice",
];

// Routes registered in src/App.tsx that notifications may deep-link to
const KNOWN_ROUTES = [
  "/my-contributions",
  "/my-donations",
  "/my-credit",
  "/claims",
  "/my-hosting-schedule",
  "/home",
  "/",
];

describe("renderNotification", () => {
  it.each(ALL_TYPES)("renders complete content for %s", (type) => {
    const rendered = renderNotification(type, {});
    expect(rendered.title.length).toBeGreaterThan(0);
    expect(rendered.body.length).toBeGreaterThan(0);
    expect(rendered.emailSubject).toContain(rendered.title);
    expect(rendered.emailBodyHtml.length).toBeGreaterThan(0);
    expect(rendered.ctaLabel.length).toBeGreaterThan(0);
    expect(KNOWN_ROUTES).toContain(rendered.link);
  });

  it("interpolates amount and contribution type", () => {
    const rendered = renderNotification("contribution_approved", {
      amount: "250.00",
      contributionType: "monthly",
    });
    expect(rendered.body).toContain("R250.00");
    expect(rendered.body).toContain("monthly");
  });

  it("includes reviewer notes when present and omits when absent", () => {
    const withNotes = renderNotification("contribution_rejected", {
      amount: "100.00",
      notes: "Duplicate payment",
    });
    expect(withNotes.body).toContain("Duplicate payment");

    const withoutNotes = renderNotification("contribution_rejected", {
      amount: "100.00",
    });
    expect(withoutNotes.body).not.toContain("Note from the reviewer");
  });

  it("interpolates the hosting month", () => {
    const rendered = renderNotification("hosting_reminder", {
      monthName: "August",
      year: "2026",
    });
    expect(rendered.body).toContain("August");
    expect(rendered.body).toContain("2026");
  });

  it("escapes HTML in email bodies", () => {
    const rendered = renderNotification("claim_rejected", {
      notes: '<script>alert("x")</script>',
    });
    expect(rendered.emailBodyHtml).not.toContain("<script>");
    expect(rendered.emailBodyHtml).toContain("&lt;script&gt;");
  });
});

describe("buildArrearsStatementHtml", () => {
  it("renders a row per unpaid month plus the total", async () => {
    const { buildArrearsStatementHtml } = await import("./catalogue");
    const html = buildArrearsStatementHtml(
      "Thabo Mokoena",
      [
        { month: "May 2026", amount: 250 },
        { month: "Jun 2026", amount: 250 },
      ],
      500
    );
    expect(html).toContain("Thabo Mokoena");
    expect(html).toContain("May 2026");
    expect(html).toContain("Jun 2026");
    expect(html).toContain("R250.00");
    expect(html).toContain("R500.00");
    expect(html).toContain("Total outstanding");
  });

  it("escapes HTML in member names", async () => {
    const { buildArrearsStatementHtml } = await import("./catalogue");
    const html = buildArrearsStatementHtml("<b>x</b>", [], 0);
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;b&gt;");
  });
});

describe("buildCreditStatementHtml", () => {
  it("renders a row per outstanding credit plus the total", async () => {
    const { buildCreditStatementHtml } = await import("./catalogue");
    const html = buildCreditStatementHtml(
      "Thabo Mokoena",
      [
        {
          reason: "Emergency loan",
          issuedDate: "10 Jan 2026",
          totalAmount: 1000,
          totalPaid: 400,
          remainingBalance: 600,
        },
      ],
      600
    );
    expect(html).toContain("Thabo Mokoena");
    expect(html).toContain("Emergency loan");
    expect(html).toContain("10 Jan 2026");
    expect(html).toContain("R1000.00");
    expect(html).toContain("R400.00");
    expect(html).toContain("R600.00");
    expect(html).toContain("Total outstanding");
  });

  it("escapes HTML in reasons and names", async () => {
    const { buildCreditStatementHtml } = await import("./catalogue");
    const html = buildCreditStatementHtml(
      "<b>x</b>",
      [
        {
          reason: "<script>bad</script>",
          issuedDate: "x",
          totalAmount: 0,
          totalPaid: 0,
          remainingBalance: 0,
        },
      ],
      0
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;");
  });
});

describe("emailLayout", () => {
  it("embeds title, body, CTA label and URL", () => {
    const html = emailLayout(
      "Test Title",
      "<p>Body text</p>",
      "Open portal",
      "https://example.com/home"
    );
    expect(html).toContain("Test Title");
    expect(html).toContain("<p>Body text</p>");
    expect(html).toContain("Open portal");
    expect(html).toContain('href="https://example.com/home"');
    expect(html).toContain("Inkuthazo Social Club");
  });
});
