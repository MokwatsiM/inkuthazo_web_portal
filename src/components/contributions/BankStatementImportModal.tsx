import React, { useState, useEffect } from "react";
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { converter } from "../../utils/firestoreConverter";
import {
  Landmark,
  FileText,
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle,
  UserCheck,
  HelpCircle,
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { parseImportFile, executeBulkImport } from "../../services/contributionService";
import {
  parseBankStatementRows,
  matchTransaction,
  toAggregatedContributions,
  MatchedTransaction,
  BankColumnMapping,
  BankParseResult,
  TransactionAssignment,
} from "../../services/contributionService/bankStatement";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dateUtils";
import type { Member } from "../../types";
import logger from "../../utils/logger";

interface BankStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "mapping" | "review";

const SKIP = "";

/**
 * Import contributions from a bank statement (CSV/Excel): transactions are
 * matched to members by description heuristics (name, phone, email); the
 * admin reviews auto-matches, resolves the rest, and commits via the
 * existing bulk importer (aggregated per member per month).
 */
const BankStatementImportModal: React.FC<BankStatementImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userDetails } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const [members, setMembers] = useState<Member[]>([]);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<BankColumnMapping>({
    date: "",
    description: "",
    amount: "",
  });
  const [parseResult, setParseResult] = useState<BankParseResult | null>(null);
  const [matches, setMatches] = useState<MatchedTransaction[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  // Load the member list once, when the modal first opens
  useEffect(() => {
    if (!isOpen || members.length > 0) return;
    getDocs(
      query(
        collection(db, "members").withConverter(converter<Member>()),
        orderBy("full_name")
      )
    )
      .then((snapshot) =>
        setMembers(snapshot.docs.map((docSnapshot) => docSnapshot.data()))
      )
      .catch((error) => {
        logger.error("Failed to load members for bank import:", error);
        showError("Failed to load the member list.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const reset = () => {
    setStep("upload");
    setRawRows([]);
    setMapping({ date: "", description: "", amount: "" });
    setParseResult(null);
    setMatches([]);
    setAssignments({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const rows = (await parseImportFile(file)) as Record<string, unknown>[];
      if (rows.length === 0) {
        showError("The file contains no rows.");
        return;
      }
      setRawRows(rows);

      // Auto-detect likely bank-statement columns
      const detected: BankColumnMapping = { date: "", description: "", amount: "" };
      Object.keys(rows[0]).forEach((key) => {
        const lower = key.toLowerCase();
        if (!detected.date && lower.includes("date")) detected.date = key;
        if (
          !detected.description &&
          (lower.includes("desc") || lower.includes("narrat") ||
            lower.includes("detail") || lower.includes("ref"))
        ) {
          detected.description = key;
        }
        if (
          !detected.amount &&
          (lower.includes("amount") || lower.includes("credit") || lower.includes("value"))
        ) {
          detected.amount = key;
        }
      });
      setMapping(detected);
      setStep("mapping");
    } catch (error) {
      logger.error("Failed to parse bank statement file:", error);
      showError("Failed to parse file. Please upload a valid CSV or Excel statement.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleProcess = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      showError("Please map the Date, Description and Amount columns.");
      return;
    }
    setLoading(true);
    try {
      const parsed = parseBankStatementRows(rawRows, mapping);
      const matchedTransactions = parsed.transactions.map((transaction) =>
        matchTransaction(transaction, members)
      );

      const initialAssignments: Record<number, string> = {};
      matchedTransactions.forEach((match) => {
        initialAssignments[match.transaction.rowNumber] =
          match.autoMatch?.memberId ?? SKIP;
      });

      setParseResult(parsed);
      setMatches(matchedTransactions);
      setAssignments(initialAssignments);
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  const assigned: TransactionAssignment[] = matches
    .filter((match) => assignments[match.transaction.rowNumber])
    .map((match) => {
      const memberId = assignments[match.transaction.rowNumber];
      const member = members.find((m) => m.id === memberId);
      return {
        transaction: match.transaction,
        memberId,
        memberName: member?.full_name ?? "Unknown",
      };
    });

  const totalAssignedAmount = assigned.reduce(
    (sum, item) => sum + item.transaction.amount,
    0
  );
  const autoMatchedCount = matches.filter((m) => m.autoMatch).length;

  const handleImport = async () => {
    if (!userDetails || assigned.length === 0) return;
    setLoading(true);
    try {
      const aggregated = toAggregatedContributions(assigned);
      await executeBulkImport(aggregated, userDetails.id, userDetails.full_name);
      showSuccess(
        `Imported ${assigned.length} transaction(s) as ${aggregated.length} monthly contribution(s).`
      );
      onSuccess();
      handleClose();
    } catch (error) {
      logger.error("Bank statement import failed:", error);
      showError(getFriendlyErrorMessage(error, "Import failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const sortedMembers = [...members].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  const renderUpload = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
        <Landmark className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 dark:text-white">
        Upload Bank Statement
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Upload a CSV or Excel export from the club's bank account. Credit
        transactions will be matched to members by the payment description;
        debits are ignored automatically.
      </p>
      <input
        type="file"
        id="bank-statement-upload"
        className="hidden"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
      />
      <Button
        variant="primary"
        onClick={() => document.getElementById("bank-statement-upload")?.click()}
        loading={loading}
      >
        Select File
      </Button>
    </div>
  );

  const renderMapping = () => {
    const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const fields: { label: string; field: keyof BankColumnMapping }[] = [
      { label: "Transaction Date *", field: "date" },
      { label: "Description / Reference *", field: "description" },
      { label: "Amount (credits) *", field: "amount" },
    ];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold dark:text-white">Map Columns</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select which columns of the statement hold the date, the payment
          description, and the amount. {rawRows.length} row(s) found.
        </p>
        <div className="space-y-3">
          {fields.map((item) => (
            <div key={item.field} className="grid grid-cols-2 items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </label>
              <select
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                value={mapping[item.field]}
                onChange={(event) =>
                  setMapping((prev) => ({ ...prev, [item.field]: event.target.value }))
                }
              >
                <option value="">Select Column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="pt-4 flex justify-between">
          <Button variant="secondary" onClick={() => setStep("upload")}>
            Back
          </Button>
          <Button variant="primary" onClick={handleProcess} loading={loading}>
            Match Members <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!parseResult) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Auto-matched
            </div>
            <div className="text-xl font-bold dark:text-white">{autoMatchedCount}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Needs review
            </div>
            <div className="text-xl font-bold dark:text-white">
              {matches.length - autoMatchedCount}
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              To import
            </div>
            <div className="text-xl font-bold dark:text-white">
              R {totalAssignedAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {(parseResult.errors.length > 0 || parseResult.skippedNonCredits > 0) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {parseResult.skippedNonCredits} debit/zero row(s) ignored
              {parseResult.errors.length > 0 &&
                `, ${parseResult.errors.length} unreadable row(s) skipped`}
              .
            </span>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
          {matches.map((match) => {
            const rowNumber = match.transaction.rowNumber;
            const selected = assignments[rowNumber] ?? SKIP;
            return (
              <div key={rowNumber} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate" title={match.transaction.description}>
                    {match.transaction.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(match.transaction.date)} · R{" "}
                    {match.transaction.amount.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                    })}
                    {match.autoMatch && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        {match.autoMatch.matchedOn} (
                        {Math.round(match.autoMatch.score * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <select
                  className={`w-full sm:w-56 rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white dark:bg-gray-900 ${
                    selected
                      ? "border-green-300 dark:border-green-700"
                      : "border-amber-300 dark:border-amber-700"
                  }`}
                  value={selected}
                  onChange={(event) =>
                    setAssignments((prev) => ({
                      ...prev,
                      [rowNumber]: event.target.value,
                    }))
                  }
                >
                  <option value={SKIP}>— Skip this transaction —</option>
                  {match.candidates.length > 0 && (
                    <optgroup label="Suggestions">
                      {match.candidates.map((candidate) => (
                        <option key={candidate.memberId} value={candidate.memberId}>
                          {candidate.memberName} ({Math.round(candidate.score * 100)}%
                          {" · "}
                          {candidate.matchedOn})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All members">
                    {sortedMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            );
          })}
          {matches.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No credit transactions found in the statement.
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-between">
          <Button variant="secondary" onClick={() => setStep("mapping")}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            loading={loading}
            disabled={assigned.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Import {assigned.length} transaction(s)
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bank Statement"
      size="large"
    >
      {step === "upload" && renderUpload()}
      {step === "mapping" && renderMapping()}
      {step === "review" && renderReview()}
    </Modal>
  );
};

export default BankStatementImportModal;
