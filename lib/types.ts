export type ApplicationStatus =
  | "Wishlist"
  | "Applied"
  | "OA Received"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type InterviewStage =
  | "None"
  | "Recruiter Screen"
  | "Technical Interview"
  | "Final Round"
  | "Completed";

export type ReferralStatus = "None" | "Requested" | "Received";

export type RoleType = "SWE" | "AI" | "Backend" | "Frontend" | "ML";

export type PriorityLevel = "Low" | "Medium" | "High";

export type InterestLevel = 1 | 2 | 3 | 4 | 5;

export type Application = {
  id: string;
  company: string;
  role: string;
  location: string;
  applicationLink: string;
  dateApplied: string | null;
  deadline: string | null;
  status: ApplicationStatus;
  oaReceived: boolean;
  interviewStage: InterviewStage;
  recruiterContact: string;
  referralStatus: ReferralStatus;
  followUpDate: string | null;
  resumeVersion: string;
  notes: string;
  interestLevel: InterestLevel;
  createdAt: string;
  updatedAt: string;
};

export type TargetCompany = {
  id: string;
  company: string;
  roleType: RoleType;
  applicationSeason: string;
  priorityLevel: PriorityLevel;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type NetworkingContact = {
  id: string;
  name: string;
  company: string;
  role: string;
  linkedInUrl: string;
  connected: boolean;
  referralRequested: boolean;
  referralReceived: boolean;
  lastContactedDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyGoal = {
  id: string;
  week: string;
  applicationGoal: number;
  applicationsCompleted: number;
  networkingGoal: number;
  networkingCompleted: number;
  leetCodeGoal: number;
  leetCodeCompleted: number;
  createdAt: string;
  updatedAt: string;
};

export type AppDataStore = {
  applications: Application[];
  targetCompanies: TargetCompany[];
  contacts: NetworkingContact[];
  weeklyGoals: WeeklyGoal[];
};

export type AppDataBackup = {
  version: 1;
  exportedAt: string;
  data: AppDataStore;
};

export type AppRecordCounts = {
  applications: number;
  targetCompanies: number;
  contacts: number;
  weeklyGoals: number;
};
