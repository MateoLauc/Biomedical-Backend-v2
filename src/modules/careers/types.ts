export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  title: string;
  type: string;
  department: string;
  icon: string | null;
  responsibilities: string[]; // parsed from JSON text in DB
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateJobInput = {
  title: string;
  type: string;
  department: string;
  icon?: string;
  responsibilities: string[];
  status?: JobStatus;
};

export type UpdateJobInput = {
  title?: string;
  type?: string;
  department?: string;
  icon?: string;
  responsibilities?: string[];
  status?: JobStatus;
};

export type ListJobsQuery = {
  status?: JobStatus;
  page?: number;
  limit?: number;
};
