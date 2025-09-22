import React, { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, History } from "lucide-react";
// import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import AddConfigurationModal from "../components/configuration/AddConfigurationModal";
import EditConfigurationModal from "../components/configuration/EditConfigurationModal";
import ConfigurationHistoryModal from "../components/configuration/ConfigurationHistoryModal";
import {
  getAllConfigurations,
  deleteConfiguration,
  updateConfiguration,
} from "../services/configurationService";
import { formatDate } from "../utils/dateUtils";
import type { Configuration } from "../types/configuration";

const ConfigurationPage: React.FC = () => {
//   const { userDetails } = useAuth();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfiguration, setSelectedConfiguration] =
    useState<Configuration | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedConfigType, setSelectedConfigType] = useState<
    Configuration["type"] | null
  >(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await getAllConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfiguration = async () => {
    await fetchConfigurations();
    setIsAddModalOpen(false);
  };

  const handleUpdateConfiguration = async (
    id: string,
    data: Partial<Configuration>
  ) => {
    try {
      await updateConfiguration(id, data);
      await fetchConfigurations();
      setIsEditModalOpen(false);
      setSelectedConfiguration(null);
    } catch (error) {
      console.error("Error updating configuration:", error);
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this configuration?"))
      return;

    try {
      await deleteConfiguration(id);
      await fetchConfigurations();
    } catch (error) {
      console.error("Error deleting configuration:", error);
    }
  };

  const filteredConfigurations = configurations.filter(
    (config) =>
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group configurations by type to show only the latest effective one
  const latestConfigurations = filteredConfigurations.reduce((acc, config) => {
    const existing = acc.find((c) => c.type === config.type);
    if (
      !existing ||
      config.effective_date.toDate() > existing.effective_date.toDate()
    ) {
      acc = acc.filter((c) => c.type !== config.type);
      acc.push(config);
    }
    return acc;
  }, [] as Configuration[]);

  const getTypeDisplayName = (type: Configuration["type"]) => {
    const names = {
      monthly_fee: "Monthly Fee",
      late_penalty: "Late Payment Penalty",
      registration_fee: "Registration Fee",
      other: "Other",
    };
    return names[type];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Configuration Management</h2>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          Add Configuration
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SearchInput
            placeholder="Search configurations..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <Table headers={["Type", "Name", "Value", "Effective Date", "Actions"]}>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : latestConfigurations.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No configurations found
              </td>
            </tr>
          ) : (
            latestConfigurations.map((config) => (
              <tr key={config.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900">
                    {getTypeDisplayName(config.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {config.description}
                    </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedConfigType(config.type);
                        setIsHistoryModalOpen(true);
                      }}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="View History"
                    >
                      <History className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedConfiguration(config);
                        setIsEditModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfiguration(config.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Modals */}
      <AddConfigurationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddConfiguration}
      />

      {selectedConfiguration && (
        <EditConfigurationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedConfiguration(null);
          }}
          onSubmit={handleUpdateConfiguration}
          configuration={selectedConfiguration}
        />
      )}

      {selectedConfigType && (
        <ConfigurationHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedConfigType(null);
          }}
          configurationType={selectedConfigType}
        />
      )}
    </div>
  );
};

export default ConfigurationPage;
