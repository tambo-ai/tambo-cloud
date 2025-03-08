export type Step = "auth" | "project" | "key";

export type DeleteDialogState = Readonly<{
  isOpen: boolean;
  keyId: string;
  keyName: string;
}>;

export type CreateProjectDialogState = Readonly<{
  isOpen: boolean;
  name: string;
}>;

export type Project = Readonly<{
  id: string;
  name: string;
}>;

export type ApiKey = Readonly<{
  id: string;
  name: string;
  partiallyHiddenKey: string | null;
  createdAt: Date;
}>;

export type ApiError = {
  code: string;
  message: string;
  status: number;
};

export type AuthProvider = "github" | "google";
