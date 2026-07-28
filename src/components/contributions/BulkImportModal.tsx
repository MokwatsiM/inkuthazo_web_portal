import React, { useState } from "react";
import { getActionableErrorMessage } from "../../utils/errorMessages";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Loader2, Save } from "lucide-react";
import Button from "../ui/Button";
import {
    parseImportFile,
    processImportData,
    executeBulkImport,
    ProcessingResult
} from "../../services/contributionService";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { userDetails } = useAuth();
    const { showSuccess, showError } = useNotifications();

    const [step, setStep] = useState<Step>('upload');
    const [loading, setLoading] = useState(false);
    const [rawRows, setRawRows] = useState<any[]>([]);
    const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

    const [mapping, setMapping] = useState({
        memberIdentifier: "",
        amount: "",
        date: "",
        type: "",
        reference: ""
    });

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setLoading(true);
        try {
            const rows = await parseImportFile(selectedFile);
            setRawRows(rows);

            // Auto-detect mapping if possible
            if (rows.length > 0) {
                const keys = Object.keys(rows[0]);
                const newMapping = { ...mapping };

                keys.forEach(key => {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('name') || lowerKey.includes('email') || lowerKey.includes('member') || lowerKey.includes('user')) newMapping.memberIdentifier = key;
                    if (lowerKey.includes('amount') || lowerKey.includes('value')) newMapping.amount = key;
                    if (lowerKey.includes('date') || lowerKey.includes('time')) newMapping.date = key;
                    if (lowerKey.includes('type') || lowerKey.includes('category')) newMapping.type = key;
                    if (lowerKey.includes('ref')) newMapping.reference = key;
                });
                setMapping(newMapping);
            }

            setStep('mapping');
        } catch (err) {
            showError("Failed to parse file. Please ensure it's a valid CSV or Excel file.");
        } finally {
            setLoading(false);
        }
    };

    const handleProcessData = async () => {
        if (!mapping.memberIdentifier || !mapping.amount || !mapping.date) {
            showError("Please map Member, Amount, and Date columns.");
            return;
        }

        setLoading(true);
        try {
            const result = await processImportData(rawRows, mapping);
            setProcessingResult(result);
            setStep('preview');
        } catch (err) {
            showError(getActionableErrorMessage(err, "Error processing data. Please check the file and try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteImport = async () => {
        if (!processingResult || !userDetails) return;

        setLoading(true);
        try {
            await executeBulkImport(
                processingResult.valid,
                userDetails.id,
                userDetails.full_name
            );
            showSuccess(`Successfully imported ${processingResult.summary.aggregatedTotal} monthly contributions!`);
            onSuccess();
            onClose();
        } catch (err) {
            showError(getActionableErrorMessage(err, "Import failed. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'upload':
                return (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-white">Upload Historical Records</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Upload a CSV or Excel file containing past contributions.
                        </p>
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="primary"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            loading={loading}
                        >
                            Select File
                        </Button>
                    </div>
                );

            case 'mapping':
                const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold dark:text-white">Map Columns</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Select which column from your file matches our system fields.
                        </p>

                        <div className="space-y-3">
                            {[
                                { label: 'Member Name/Email *', field: 'memberIdentifier' },
                                { label: 'Amount *', field: 'amount' },
                                { label: 'Date *', field: 'date' },
                                { label: 'Type (Optional)', field: 'type' },
                                { label: 'Reference (Optional)', field: 'reference' },
                            ].map(item => (
                                <div key={item.field} className="grid grid-cols-2 items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</label>
                                    <select
                                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        value={(mapping as any)[item.field]}
                                        onChange={(e) => setMapping(prev => ({ ...prev, [item.field]: e.target.value }))}
                                    >
                                        <option value="">Select Column</option>
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 flex justify-between">
                            <Button variant="secondary" onClick={() => setStep('upload')}>Back</Button>
                            <Button variant="primary" onClick={handleProcessData} loading={loading}>
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                );

            case 'preview':
                if (!processingResult) return null;
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold dark:text-white">Review & Import</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Rows Processed</div>
                                <div className="text-xl font-bold dark:text-white">{processingResult.summary.totalRows}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">Monthly Records</div>
                                <div className="text-xl font-bold dark:text-white">{processingResult.summary.aggregatedTotal}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Amount</div>
                                <div className="text-xl font-bold dark:text-white">R {processingResult.summary.totalAmount.toLocaleString()}</div>
                            </div>
                        </div>

                        {processingResult.errors.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400 font-semibold text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Validation Issues ({processingResult.errors.length})</span>
                                </div>
                                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-24 overflow-y-auto">
                                    {processingResult.errors.map((err, i) => (
                                        <li key={i}>Row {err.row}: {err.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                                    <tr>
                                        <th className="p-2 font-semibold">Member</th>
                                        <th className="p-2 font-semibold">Month</th>
                                        <th className="p-2 font-semibold text-right">Summed Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {processingResult.valid.slice(0, 50).map((row, i) => (
                                        <tr key={i} className="dark:text-gray-300">
                                            <td className="p-2">{row.memberName}</td>
                                            <td className="p-2">{row.monthYear}</td>
                                            <td className="p-2 text-right">R {row.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {processingResult.valid.length > 50 && (
                                        <tr>
                                            <td colSpan={3} className="p-2 text-center text-gray-400 italic">
                                                ... and {processingResult.valid.length - 50} more records
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-6 flex justify-between">
                            <Button variant="secondary" onClick={() => setStep('mapping')}>Back</Button>
                            <Button
                                variant="primary"
                                onClick={handleExecuteImport}
                                loading={loading}
                                disabled={processingResult.valid.length === 0}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Commit Import
                            </Button>
                        </div>
                    </div>
                );

            case 'importing':
                return (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-semibold dark:text-white">Importing Data...</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Please wait while we save the historical records to the database.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold dark:text-white">Bulk Migration Tool</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <svg className="w-5 h-5 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {renderStep()}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${(i === 1 && step === 'upload') ||
                                        (i === 2 && step === 'mapping') ||
                                        (i === 3 && step === 'preview')
                                        ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Migration Wizard</span>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
