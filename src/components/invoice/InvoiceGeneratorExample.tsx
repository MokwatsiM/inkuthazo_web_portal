import React, { useState } from "react";
import { Download } from "lucide-react";
import InvoiceGenerator, { InvoiceGeneratorWithProgress } from "./InvoiceGenerator";
import { ToastContainer } from "../ui/Toast";
import type { Member, Contribution } from "../../types";

interface InvoiceGeneratorExampleProps {
  member: Member;
  contributions: Contribution[];
}

const InvoiceGeneratorExample: React.FC<InvoiceGeneratorExampleProps> = ({
  member,
  contributions,
}) => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    message?: string;
    type?: "success" | "error" | "warning" | "info";
    duration?: number;
  }>>([]);

  const addToast = (toast: Omit<typeof toasts[0], "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleSuccess = () => {
    addToast({
      title: "Invoice Generated Successfully",
      message: `Monthly invoice for ${member.full_name} has been downloaded.`,
      type: "success",
      duration: 5000,
    });
  };

  const handleError = (error: string) => {
    addToast({
      title: "Invoice Generation Failed",
      message: error,
      type: "error",
      duration: 7000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Standard Invoice Generator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Standard Invoice Generator
        </h3>
        <InvoiceGenerator
          member={member}
          contributions={contributions}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Enhanced Invoice Generator with Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Enhanced Invoice Generator with Progress
        </h3>
        <InvoiceGeneratorWithProgress
          member={member}
          contributions={contributions}
          onSuccess={handleSuccess}
          onError={handleError}
          showProgress={true}
        />
      </div>

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position="top-right"
      />
    </div>
  );
};

export default InvoiceGeneratorExample;