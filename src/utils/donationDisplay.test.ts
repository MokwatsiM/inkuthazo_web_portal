import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { donationTypeLabel, donationAmountDisplay } from "./donationDisplay";
import type { Donation, DonationType } from "../types/donation";

const makeDonation = (type: DonationType, amount: number): Donation =>
  ({
    id: "1",
    source: "member",
    donor_name: "Test",
    type,
    amount,
    date: Timestamp.now(),
    status: "approved",
    created_by: "u",
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  } as Donation);

describe("donationTypeLabel", () => {
  it("renders in_kind as a friendly label, not the raw key", () => {
    expect(donationTypeLabel("in_kind")).toBe("In-kind");
  });

  it("capitalises the other known types", () => {
    expect(donationTypeLabel("investment")).toBe("Investment");
    expect(donationTypeLabel("donation")).toBe("Donation");
    expect(donationTypeLabel("sponsorship")).toBe("Sponsorship");
    expect(donationTypeLabel("grant")).toBe("Grant");
    expect(donationTypeLabel("other")).toBe("Other");
  });
});

describe("donationAmountDisplay", () => {
  it("shows a Rand amount for monetary donations", () => {
    expect(donationAmountDisplay(makeDonation("donation", 250))).toBe("R 250.00");
  });

  it("never shows a bare Rand amount for in-kind donations", () => {
    const display = donationAmountDisplay(makeDonation("in_kind", 0));
    expect(display).toBe("In-kind");
    expect(display).not.toMatch(/^R /);
  });

  it("labels the estimated value for in-kind donations that have one", () => {
    expect(donationAmountDisplay(makeDonation("in_kind", 2000))).toBe(
      "In-kind (est. R 2000.00)"
    );
  });
});
