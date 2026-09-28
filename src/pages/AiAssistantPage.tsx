import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  BookOpen,
  BarChart3,
  Clock,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { aiService } from '../services/ai.service';
import type {
  AiStatsResponse,
  ChatMessage,
  ConversationSession,
} from '../models/Ai.model';

export const AiAssistantPage: React.FC = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'Comment fonctionne la gestion des accès ?',
    'Comment activer mon compte ou changer mon mot de passe ?',
    'Quels sont les modules disponibles sur Economat ?',
  ]);

  // Modale Statistiques
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<AiStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Charger la liste des sessions au montage
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await aiService.listSessions('page=1&page_size=20');
      const list = res.results || [];
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        selectSession(list[0].id);
      }
    } catch (e) {
      console.warn('Erreur chargement sessions IA:', e);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setError(null);
    try {
      const detail = await aiService.getSession(sessionId);
      setMessages(detail.messages || []);
    } catch {
      // Si la session n'est pas encore créée côté backend
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([
      {
        id: 'welcome-init',
        role: 'assistant',
        content:
          "Bonjour ! Je suis l'Assistant IA de la plateforme ENT. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur les applications, les guides d'utilisation, ou les droits d'accès.",
      },
    ]);
    setError(null);
  };

  const handleClearCurrentSession = async () => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    try {
      await aiService.clearSession(activeSessionId);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du nettoyage de la session');
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiService.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const openStatsModal = async () => {
    setStatsOpen(true);
    setStatsLoading(true);
    try {
      const res = await aiService.stats();
      setStats(res);
    } catch (e) {
      console.warn('Impossible de charger les stats IA:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setError(null);
    setInputMessage('');

    // Message utilisateur immédiat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // Placeholder pour réponse de l'assistant
    const tempAssistantId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setLoading(true);

    try {
      let accumulated = '';
      await aiService.chatStream(
        { message: text, session_id: activeSessionId },
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === tempAssistantId ? { ...m, content: accumulated } : m))
          );
        },
        (finalText) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempAssistantId ? { ...m, content: finalText } : m))
          );
          setLoading(false);
          loadSessions();
        },
        async () => {
          // Fallback synchrone si échec SSE
          const resp = await aiService.chat({ message: text, session_id: activeSessionId });
          if (!activeSessionId && resp.session_id) {
            setActiveSessionId(resp.session_id);
          }
          if (resp.suggested_questions && resp.suggested_questions.length > 0) {
            setSuggestedQuestions(resp.suggested_questions);
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? {
                    ...m,
                    content: resp.answer,
                    sources: resp.sources,
                    intent: resp.intent,
                    platform: resp.platform,
                  }
                : m
            )
          );
          setLoading(false);
          loadSessions();
        }
      );
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erreur de communication avec l'assistant");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout
      activeItem="ai-assistant"
      title="Assistant IA"
      subtitle="Assistance intelligente et recherche documentaire RAG"
    >
      <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Volet Latéral : Historique des Sessions */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Conversations IA</span>
            </div>
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sessionsLoading ? (
              <div className="p-4 text-center text-sm text-slate-400">Chargement de vos discussions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune conversation enregistrée. Lancez-vous !
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-6">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">{sess.title || 'Discussion sans titre'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition shrink-0"
                      title="Supprimer la conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de volet latéral */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={openStatsModal}
              className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiques & RAG</span>
            </button>
            {activeSessionId && (
              <button
                onClick={handleClearCurrentSession}
                className="flex items-center gap-1 hover:text-amber-600 transition"
                title="Effacer les messages de cette conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone Principale de Chat */}
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
          {/* Header du Chat */}
          <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Assistant IA — ENT
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    RAG Actif
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Connecté aux documents & API de ent.tpe.bf</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openStatsModal}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Métriques</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Comment puis-je vous aider ?
                </h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Posez des questions sur l'utilisation des plateformes, la gestion des accès, ou les procédures opérationnelles.
                </p>

                {/* Suggestions initiales */}
                <div className="grid gap-2 w-full">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 text-left text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gradient-to-tr from-slate-700 to-slate-900 text-slate-100'
                    }`}
                  >
                    {isUser ? 'Moi' : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content || (loading ? 'Analyse en cours...' : '')}</div>
                    </div>

                    {/* Sources et métadonnées pour l'assistant */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Sources documentaires :
                        </span>
                        {m.sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700"
                          >
                            <span>{src.document_title || 'Document ENT'}</span>
                            {src.page && <span className="text-slate-400">p.{src.page}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barre de saisie */}
          <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question à l'Assistant IA (ex: droits, modules, documentation)..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 resize-none px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-32 min-h-[38px]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition shrink-0"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="max-w-3xl mx-auto mt-2 text-[11px] text-center text-slate-400 flex items-center justify-center gap-4">
              <span>Modèle RAG avec filtrage PII et indexation vectorielle</span>
              <span>•</span>
              <span>Entrée pour envoyer, Maj+Entrée pour nouvelle ligne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modale des Statistiques d'Utilisation IA */}
      {statsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Statistiques de l'Assistant IA</h3>
              </div>
              <button
                onClick={() => setStatsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statsLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Chargement des indicateurs...</div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400">Total Conversations</span>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total_sessions}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400">Messages Échangés</span>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total_messages}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400">Temps Moyen (RAG)</span>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.avg_processing_time_ms} ms
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400">Taux de Refus (Lacunes)</span>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {stats.refusal_rate_pct}%
                    </p>
                  </div>
                </div>

                {stats.top_platforms && stats.top_platforms.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Plateformes les plus consultées</h4>
                    <div className="space-y-1.5">
                      {stats.top_platforms.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {p.platform || 'Général'}
                          </span>
                          <span className="text-slate-400">{p.count} questions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">Données non disponibles</div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStatsOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AiAssistantPage;
