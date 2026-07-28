"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  createApplicationRequest,
  deleteApplicationRequest,
  updateApplicationRequest,
  updateApplicationStatusRequest,
} from "@/lib/api/applications-client";
import {
  createModuleRequest,
  deleteModuleRequest,
  updateModuleRequest,
  type ModuleRecord,
} from "@/lib/api/modules-client";
import { createDemoData } from "@/lib/demo-data";
import type { ModuleResource } from "@/lib/data/modules";
import {
  APP_DATA_BACKUP_VERSION,
  APP_DATA_STORAGE_KEY,
  countRecords,
  exportAppData,
  importAppData,
  loadStoredAppData,
  resetStoredAppData,
  saveStoredAppData,
} from "@/lib/storage";
import type {
  Application,
  AppDataStore,
  AppRecordCounts,
  NetworkingContact,
  TargetCompany,
  WeeklyGoal,
} from "@/lib/types";

export type ModuleLoadErrors = Record<ModuleResource, string | null>;

type AppDataContextValue = {
  applicationError: string | null;
  applicationLoadError: string | null;
  backupVersion: number;
  cloudError: string | null;
  createApplication: (application: Application) => Promise<boolean>;
  createContact: (contact: NetworkingContact) => Promise<boolean>;
  createTargetCompany: (targetCompany: TargetCompany) => Promise<boolean>;
  createWeeklyGoal: (goal: WeeklyGoal) => Promise<boolean>;
  data: AppDataStore;
  deleteApplication: (applicationId: string) => Promise<boolean>;
  deleteContact: (contactId: string) => Promise<boolean>;
  deleteTargetCompany: (targetCompanyId: string) => Promise<boolean>;
  deleteWeeklyGoal: (goalId: string) => Promise<boolean>;
  exportBackupJson: () => string;
  hasHydrated: boolean;
  importBackupJson: (input: string) => boolean;
  isApplicationMutating: boolean;
  isCloudMutating: boolean;
  moduleLoadErrors: ModuleLoadErrors;
  recordCounts: AppRecordCounts;
  replaceData: (nextData: AppDataStore) => void;
  resetToDemoData: () => void;
  storageKey: string;
  storageSource: "cloud";
  updateApplication: (application: Application) => Promise<boolean>;
  updateApplicationStatus: (applicationId: string, status: Application["status"]) => Promise<boolean>;
  updateContact: (contact: NetworkingContact) => Promise<boolean>;
  updateTargetCompany: (targetCompany: TargetCompany) => Promise<boolean>;
  updateWeeklyGoal: (goal: WeeklyGoal) => Promise<boolean>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

type Props = {
  applicationLoadError: string | null;
  children: ReactNode;
  initialApplications: Application[];
  initialContacts: NetworkingContact[];
  initialTargetCompanies: TargetCompany[];
  initialWeeklyGoals: WeeklyGoal[];
  moduleLoadErrors: ModuleLoadErrors;
};

export function AppDataProvider({
  applicationLoadError: initialApplicationLoadError,
  children,
  initialApplications,
  initialContacts,
  initialTargetCompanies,
  initialWeeklyGoals,
  moduleLoadErrors: initialModuleLoadErrors,
}: Props) {
  const initialCloudData = {
    applications: initialApplications,
    contacts: initialContacts,
    targetCompanies: initialTargetCompanies,
    weeklyGoals: initialWeeklyGoals,
  };
  const [data, setData] = useState<AppDataStore>(initialCloudData);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationLoadError, setApplicationLoadError] = useState(initialApplicationLoadError);
  const [moduleLoadErrors, setModuleLoadErrors] = useState(initialModuleLoadErrors);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [pendingApplicationMutations, setPendingApplicationMutations] = useState(0);
  const [pendingCloudMutations, setPendingCloudMutations] = useState(0);

  useEffect(() => {
    // Legacy data remains untouched until the user explicitly chooses to migrate it.
    loadStoredAppData();
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    setData({
      applications: initialApplications,
      contacts: initialContacts,
      targetCompanies: initialTargetCompanies,
      weeklyGoals: initialWeeklyGoals,
    });
    setApplicationLoadError(initialApplicationLoadError);
    setModuleLoadErrors(initialModuleLoadErrors);
  }, [
    initialApplicationLoadError,
    initialApplications,
    initialContacts,
    initialModuleLoadErrors,
    initialTargetCompanies,
    initialWeeklyGoals,
  ]);

  function beginApplicationMutation() {
    setApplicationError(null);
    setPendingApplicationMutations((count) => count + 1);
  }
  function endApplicationMutation() {
    setPendingApplicationMutations((count) => Math.max(0, count - 1));
  }

  function setModuleRecords(resource: ModuleResource, update: (records: ModuleRecord[]) => ModuleRecord[]) {
    setData((current) => {
      if (resource === "contacts") return { ...current, contacts: update(current.contacts) as NetworkingContact[] };
      if (resource === "targetCompanies") return { ...current, targetCompanies: update(current.targetCompanies) as TargetCompany[] };
      return { ...current, weeklyGoals: update(current.weeklyGoals) as WeeklyGoal[] };
    });
  }

  function getModuleRecords(resource: ModuleResource): ModuleRecord[] {
    if (resource === "contacts") return data.contacts;
    if (resource === "targetCompanies") return data.targetCompanies;
    return data.weeklyGoals;
  }

  async function createCloudRecord(resource: ModuleResource, record: ModuleRecord) {
    if (pendingCloudMutations > 0) return false;
    setCloudError(null);
    setPendingCloudMutations((count) => count + 1);
    setModuleRecords(resource, (records) => [record, ...records]);
    const result = await createModuleRequest(resource, record);
    if (result.data === null) {
      setModuleRecords(resource, (records) => records.filter((item) => item.id !== record.id));
      setCloudError(result.error);
      setPendingCloudMutations((count) => Math.max(0, count - 1));
      return false;
    }
    setModuleRecords(resource, (records) => records.map((item) => item.id === record.id ? result.data : item));
    setPendingCloudMutations((count) => Math.max(0, count - 1));
    return true;
  }

  async function updateCloudRecord(resource: ModuleResource, record: ModuleRecord) {
    if (pendingCloudMutations > 0) return false;
    const previous = getModuleRecords(resource).find((item) => item.id === record.id);
    setCloudError(null);
    setPendingCloudMutations((count) => count + 1);
    setModuleRecords(resource, (records) => records.map((item) => item.id === record.id ? record : item));
    const result = await updateModuleRequest(resource, record);
    if (result.data === null) {
      if (previous) setModuleRecords(resource, (records) => records.map((item) => item.id === record.id ? previous : item));
      setCloudError(result.error);
      setPendingCloudMutations((count) => Math.max(0, count - 1));
      return false;
    }
    setModuleRecords(resource, (records) => records.map((item) => item.id === record.id ? result.data : item));
    setPendingCloudMutations((count) => Math.max(0, count - 1));
    return true;
  }

  async function deleteCloudRecord(resource: ModuleResource, id: string) {
    if (pendingCloudMutations > 0) return false;
    const previous = getModuleRecords(resource);
    setCloudError(null);
    setPendingCloudMutations((count) => count + 1);
    setModuleRecords(resource, (records) => records.filter((item) => item.id !== id));
    const result = await deleteModuleRequest(resource, id);
    if (result.data === null) {
      setModuleRecords(resource, () => previous);
      setCloudError(result.error);
      setPendingCloudMutations((count) => Math.max(0, count - 1));
      return false;
    }
    setPendingCloudMutations((count) => Math.max(0, count - 1));
    return true;
  }

  const contextValue: AppDataContextValue = {
    applicationError,
    applicationLoadError,
    backupVersion: APP_DATA_BACKUP_VERSION,
    cloudError,
    createApplication: async (application) => {
      if (pendingApplicationMutations > 0) return false;
      beginApplicationMutation();
      setData((current) => ({ ...current, applications: [application, ...current.applications] }));
      const result = await createApplicationRequest(application);
      if (result.data === null) {
        setData((current) => ({ ...current, applications: current.applications.filter((item) => item.id !== application.id) }));
        setApplicationError(result.error); endApplicationMutation(); return false;
      }
      setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === application.id ? result.data : item) }));
      endApplicationMutation(); return true;
    },
    createContact: (record) => createCloudRecord("contacts", record),
    createTargetCompany: (record) => createCloudRecord("targetCompanies", record),
    createWeeklyGoal: (record) => createCloudRecord("weeklyGoals", record),
    data,
    deleteApplication: async (id) => {
      if (pendingApplicationMutations > 0) return false;
      const previous = data.applications; beginApplicationMutation();
      setData((current) => ({ ...current, applications: current.applications.filter((item) => item.id !== id) }));
      const result = await deleteApplicationRequest(id);
      if (result.data === null) {
        setData((current) => ({ ...current, applications: previous }));
        setApplicationError(result.error); endApplicationMutation(); return false;
      }
      endApplicationMutation(); return true;
    },
    deleteContact: (id) => deleteCloudRecord("contacts", id),
    deleteTargetCompany: (id) => deleteCloudRecord("targetCompanies", id),
    deleteWeeklyGoal: (id) => deleteCloudRecord("weeklyGoals", id),
    exportBackupJson: () => exportAppData(data),
    hasHydrated,
    importBackupJson: (input) => {
      const imported = importAppData(input);
      if (!imported) return false;
      setData(imported);
      saveStoredAppData(imported);
      return true;
    },
    isApplicationMutating: pendingApplicationMutations > 0,
    isCloudMutating: pendingCloudMutations > 0,
    moduleLoadErrors,
    recordCounts: countRecords(data),
    // Phase 7 will turn bulk replacement/reset into authenticated database operations.
    replaceData: (nextData) => {
      setData(nextData);
      saveStoredAppData(nextData);
    },
    resetToDemoData: () => {
      setData(resetStoredAppData());
    },
    storageKey: APP_DATA_STORAGE_KEY,
    storageSource: "cloud",
    updateApplication: async (application) => {
      if (pendingApplicationMutations > 0) return false;
      const previous = data.applications.find((item) => item.id === application.id);
      beginApplicationMutation();
      setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === application.id ? application : item) }));
      const result = await updateApplicationRequest(application);
      if (result.data === null) {
        if (previous) setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === application.id ? previous : item) }));
        setApplicationError(result.error); endApplicationMutation(); return false;
      }
      setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === application.id ? result.data : item) }));
      endApplicationMutation(); return true;
    },
    updateApplicationStatus: async (id, status) => {
      if (pendingApplicationMutations > 0) return false;
      const previous = data.applications.find((item) => item.id === id);
      beginApplicationMutation();
      setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item) }));
      const result = await updateApplicationStatusRequest(id, status);
      if (result.data === null) {
        if (previous) setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === id ? previous : item) }));
        setApplicationError(result.error); endApplicationMutation(); return false;
      }
      setData((current) => ({ ...current, applications: current.applications.map((item) => item.id === id ? result.data : item) }));
      endApplicationMutation(); return true;
    },
    updateContact: (record) => updateCloudRecord("contacts", record),
    updateTargetCompany: (record) => updateCloudRecord("targetCompanies", record),
    updateWeeklyGoal: (record) => updateCloudRecord("weeklyGoals", record),
  };

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within an AppDataProvider.");
  return context;
}
