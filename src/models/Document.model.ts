export type DocumentCategory =
  | 'manuel' | 'guide_demarrage' | 'guide_admin' | 'faq' | 'notes_version' | 'tutoriel';
export type DocumentStatus = 'draft' | 'published';

export interface DocumentVersion {
  id: string;
  document: string;
  version_label: string;
  file: string;
  changelog: string;
  is_current: boolean;
  published_at: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  platform: string;
  platform_name: string;
  title: string;
  category: DocumentCategory;
  description: string;
  status: DocumentStatus;
  current_version: DocumentVersion | null;
  versions_count: number;
  created_at: string;
  updated_at: string;
}
