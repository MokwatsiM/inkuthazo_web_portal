import React from "react";
import { Download } from "lucide-react";
import Button from "../ui/Button";
import { generateInvoiceDetails } from "../../utils/invoice/calculator";
import { generateInvoicePDF } from "../../utils/invoice/generator";
import type { Contribution } from "../../types/contribution";
import type { Member } from "../../types";

interface InvoiceGeneratorProps {
  member: Member;
  contributions: Contribution[];
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  member,
  contributions,
}) => {
  const handleGenerateInvoice = () => {
    const invoiceDetails = generateInvoiceDetails(
      contributions,
      member.join_date
    );
    generateInvoicePDF(member, invoiceDetails);
  };

  return (
    <Button onClick={handleGenerateInvoice} icon={Download}>
      Generate Monthly Invoice
    </Button>
  );
};

export default InvoiceGenerator;
