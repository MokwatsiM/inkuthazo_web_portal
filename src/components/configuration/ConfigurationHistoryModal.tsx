import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Table from "../ui/Table";
import { getConfigurationHistory } from "../../services/configurationService";
import { formatDate } from "../../utils/dateUtils";
import type {
  Configuration,
  ConfigurationType,
} from "../../types/configuration";
import logger from "../../utils/logger";

interface ConfigurationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  configurationType: ConfigurationType;
}

const ConfigurationHistoryModal: React.FC<ConfigurationHistoryModalProps> = ({
  isOpen,
  onClose,
  configurationType,
}) => {
  const [history, setHistory] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, configurationType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getConfigurationHistory(configurationType);
      setHistory(historyData);
    } catch (error) {
      logger.error("Error fetching configuration history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTypeDisplayName = (type: ConfigurationType) => {
    const names = {
      monthly_fee: "Monthly Fee",
      late_penalty: "Late Payment Penalty",
      registration_fee: "Registration Fee",
      other: "Other",
    };
    return names[type];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4">
        <h2 className="text-xl font-bold mb-4">
          {getTypeDisplayName(configurationType)} History
        </h2>

        <div className="max-h-96 overflow-y-auto">
          <Table
            headers={[
              "Name",
              "Value",
              "Effective Date",
              "Created Date",
              "Description",
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No history found for this configuration type
                </td>
              </tr>
            ) : (
              history.map((config) => (
                <tr key={config.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">
                      R {config.value.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(config.effective_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(config.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {config.description}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationHistoryModal;
