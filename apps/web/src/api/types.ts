export type Niche =
  | "EDUCATIONAL"
  | "HISTORY"
  | "TECHNOLOGY"
  | "SCIENCE"
  | "BUSINESS"
  | "MOTIVATION"
  | "ENTERTAINMENT"
  | "FACTS"
  | "STORIES";

export type ProjectStatus =
  | "DRAFT"
  | "SCRIPT_READY"
  | "SCENES_READY"
  | "VOICE_READY"
  | "RENDERING"
  | "DONE"
  | "FAILED";

export interface User {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  credits: number;
}

export interface Project {
  id: string;
  title: string;
  niche: Niche;
  language: string;
  status: ProjectStatus;
  createdAt: string;
  scripts?: Script[];
}

export interface Script {
  id: string;
  projectId: string;
  content: string;
  wordCount: number;
  version: number;
  createdAt: string;
}

export interface Scene {
  id: string;
  scriptId: string;
  order: number;
  narration: string;
  visualPrompt: string;
  cameraMotion: string;
  transition: string;
  durationSec: number;
  audioFileUrl: string | null;
  visualFileUrl: string | null;
}

export interface RenderJob {
  id: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  progress: number;
  outputFileUrl: string | null;
  errorLog: string | null;
}

export interface Thumbnail {
  id: string;
  imageUrl: string;
  variant: number;
  headline: string | null;
  isSelected: boolean;
}

export interface SeoMeta {
  id: string;
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  chapters: { time: string; label: string }[] | null;
}

export interface YoutubeChannel {
  id: string;
  channelId: string;
  channelTitle: string;
  createdAt: string;
}

export interface UploadJob {
  id: string;
  status: "PENDING" | "SCHEDULED" | "UPLOADING" | "DONE" | "FAILED";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  scheduledAt: string | null;
  youtubeVideoId: string | null;
  errorLog: string | null;
}

export const NICHE_LABELS: Record<Niche, string> = {
  EDUCATIONAL: "Ta'limiy",
  HISTORY: "Tarix",
  TECHNOLOGY: "Texnologiya",
  SCIENCE: "Fan",
  BUSINESS: "Biznes",
  MOTIVATION: "Motivatsiya",
  ENTERTAINMENT: "Ko'ngilochar",
  FACTS: "Faktlar",
  STORIES: "Hikoyalar",
};
