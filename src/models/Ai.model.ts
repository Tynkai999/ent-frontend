export interface AiSource {
  document_id?: string;
  document_title?: string;
  version?: string;
  page?: number;
  snippet?: string;
  url?: string;
  [key: string]: unknown;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: AiSource[] | null;
  intent?: 'rag' | 'api' | 'general' | string | null;
  platform?: string | null;
  created_at?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  is_active: boolean;
  messages_count?: number;
  last_message_preview?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationSessionDetail extends ConversationSession {
  messages: ChatMessage[];
}

import type { User } from './User.model';

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  image?: string | null;
  user?: User | null;
}

export interface ChatResponse {
  session_id: string;
  session_title?: string;
  answer: string;
  sources?: AiSource[];
  suggested_questions?: string[];
  intent?: string;
  platform?: string | null;
  processing_time_ms?: number;
  cached?: boolean;
}

export interface AiStatsResponse {
  total_sessions: number;
  total_messages: number;
  refusal_rate_pct: number;
  avg_processing_time_ms: number;
  top_platforms: { platform?: string; count?: number; [key: string]: unknown }[];
  unanswered_questions_sample: string[];
}
