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
  Copy,
  Check,
  Zap,
  CornerDownLeft,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { aiService } from '../services/ai.service';
import MarkdownRenderer from '../components/MarkdownRenderer';
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'Comment fonctionne la gestion des accès et des rôles ?',
    'Comment créer une nouvelle organisation ou un client ?',
    'Quelles sont les plateformes intégrées à l’ENT ?',
    'Comment importer ou téléverser une nouvelle version de document ?',
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
          "Bonjour ! Je suis l'**Assistant IA officiel de l'ENT**.\n\nJe suis connecté à la base documentaire et aux API de la plateforme (`ent.tpe.bf`).\n\nVous pouvez me poser des questions sur :\n- La **gestion des accès** et des permissions des utilisateurs\n- L'utilisation des applications (**Economat, Facturation, etc.**)\n- Les **guides et manuels** techniques\n- L'intégration de l'**API REST**",
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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
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
      title="Assistant Intelligent ENT"
      subtitle="Recherche documentaire assistée par IA, guide opérationnel et assistance RAG"
    >
      <div className="flex h-[calc(100vh-5.5rem)] -m-6 overflow-hidden bg-gray-50 font-montserrat">
        {/* Volet Latéral : Historique des Conversations aux couleurs ENT */}
        <div className="w-72 sm:w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 shadow-xs">
          {/* En-tête Volet */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary border border-primary-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span>Discussions</span>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-700 shadow-xs transition"
              title="Nouvelle conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          </div>

          {/* Liste des Sessions */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {sessionsLoading ? (
              <div className="p-6 text-center text-xs text-gray-400">
                <Clock className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                Chargement des échanges...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Aucune discussion enregistrée. Posez votre première question !
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-900 font-semibold border-l-4 border-primary shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                      />
                      <span className="truncate">{sess.title || 'Discussion sans titre'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition shrink-0"
                      title="Supprimer la conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied du volet latéral */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs text-gray-500">
            <button
              onClick={openStatsModal}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary font-medium transition"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Indicateurs & RAG</span>
            </button>
            {activeSessionId && (
              <button
                onClick={handleClearCurrentSession}
                className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition"
                title="Effacer le contenu de la session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone Principale de Chat */}
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
          {/* Barre supérieure du Chat */}
          <div className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-700 flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 leading-none">Assistant IA de l'ENT</h2>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    RAG Actif
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                  Indexé sur la documentation et l'API de ent.tpe.bf
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openStatsModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>Performances</span>
              </button>
            </div>
          </div>

          {/* Flux des Messages avec Différenciation Nette */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-200 text-primary flex items-center justify-center mb-4 shadow-sm">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Comment puis-je vous assister aujourd'hui ?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-6 max-w-md">
                  Posez vos questions sur la configuration, les rôles, les droits d'accès ou les plateformes hébergées sur l'ENT.
                </p>

                {/* Suggestions Initiales en chips */}
                <div className="grid gap-2 w-full text-left">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50/40 text-gray-700 text-xs font-medium transition flex items-center justify-between group shadow-2xs"
                    >
                      <span>{q}</span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  {/* En-tête de message (Auteur + Heure) */}
                  <div className={`flex items-center gap-2 mb-1 px-1 text-xs ${isUser ? 'flex-row-reverse text-gray-500' : 'text-gray-500'}`}>
                    <span className="font-bold text-[11px] text-gray-700">
                      {isUser ? 'Vous' : 'Assistant ENT'}
                    </span>
                    {!isUser && (
                      <span className="text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-100 px-1.5 py-0.2 rounded">
                        RAG
                      </span>
                    )}
                  </div>

                  {/* Corps de Message */}
                  <div className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                        isUser
                          ? 'bg-primary-dark text-white ring-2 ring-primary/20'
                          : 'bg-gradient-to-tr from-primary to-accent text-white ring-2 ring-primary-100'
                      }`}
                    >
                      {isUser ? 'M' : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Contenu visuel distinct */}
                    <div className="flex-1 max-w-[90%] sm:max-w-[85%]">
                      {isUser ? (
                        /* Bulle Utilisateur : Bleue ENT, texte blanc épuré */
                        <div className="bg-primary text-white rounded-2xl rounded-tr-xs p-4 shadow-[0_4px_16px_rgba(31,87,173,0.18)]">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                        </div>
                      ) : (
                        /* Carte Assistant : Blanche luxueuse, bordée, formatée Markdown riche */
                        <div className="bg-white border border-gray-200/90 rounded-2xl rounded-tl-xs p-5 shadow-xs text-gray-800 space-y-3">
                          {m.content ? (
                            <MarkdownRenderer content={m.content} />
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-primary font-medium py-2">
                              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                              Recherche documentaire et synthèse en cours...
                            </div>
                          )}

                          {/* Sources Documentaires Officielles (RAG) */}
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/80 -mx-5 -mb-5 p-4 rounded-b-2xl">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                <span>Sources documentaires officielles</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {m.sources.map((src, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white text-gray-700 rounded-lg border border-gray-200 shadow-2xs"
                                  >
                                    <span className="font-semibold text-primary">{src.document_title || 'Guide ENT'}</span>
                                    {src.page && (
                                      <span className="text-[11px] text-gray-400 bg-gray-100 px-1 rounded">
                                        p.{src.page}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Barre d'outils de la réponse */}
                          {m.content && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400">
                              <button
                                onClick={() => handleCopyText(m.id, m.content)}
                                className="flex items-center gap-1 hover:text-primary transition"
                                title="Copier la réponse au format Markdown"
                              >
                                {copiedMessageId === m.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-600 font-medium">Réponse copiée</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copier la réponse</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 max-w-xl mx-auto shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Contextuelles en Chips au-dessus du champ de saisie */}
          {messages.length > 0 && suggestedQuestions.length > 0 && (
            <div className="px-6 py-2 bg-white/70 border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-gray-400 shrink-0">Suggestions :</span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 bg-primary-50/80 hover:bg-primary-100 text-primary-800 border border-primary-200/80 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Barre de saisie inférieure aux couleurs de la plateforme */}
          <div className="p-4 bg-white border-t border-gray-200 shadow-sm">
            <div className="max-w-3xl mx-auto flex items-end gap-2 bg-white rounded-2xl p-2 border border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition shadow-xs">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question (ex: attribution d'accès, documentation des API, plateformes)..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none max-h-32 min-h-[40px] font-sans"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-700 transition shrink-0 shadow-xs"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="max-w-3xl mx-auto mt-2 text-[11px] text-center text-gray-400 flex items-center justify-center gap-3">
              <span>Assistant IA avec recherche vectorielle RAG</span>
              <span>•</span>
              <span>Entrée pour envoyer, Maj+Entrée pour saut de ligne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modale des Statistiques d'Utilisation IA aux couleurs de l'ENT */}
      {statsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 font-montserrat">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Métriques de l'Assistant IA</h3>
                  <p className="text-xs text-gray-400">Performances du moteur RAG</p>
                </div>
              </div>
              <button
                onClick={() => setStatsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statsLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Chargement des données...</div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Conversations</span>
                    <p className="text-xl font-bold text-primary mt-0.5">{stats.total_sessions}</p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Messages</span>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total_messages}</p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Temps RAG Moyen</span>
                    <p className="text-xl font-bold text-primary mt-0.5">
                      {stats.avg_processing_time_ms} ms
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Taux de Refus</span>
                    <p className="text-xl font-bold text-accent mt-0.5">
                      {stats.refusal_rate_pct}%
                    </p>
                  </div>
                </div>

                {stats.top_platforms && stats.top_platforms.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Plateformes consultées</h4>
                    <div className="space-y-1.5">
                      {stats.top_platforms.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <span className="font-semibold text-gray-800">
                            {p.platform || 'Général'}
                          </span>
                          <span className="text-primary font-bold">{p.count} requêtes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-4">Données non disponibles</div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStatsOpen(false)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary-700 text-xs font-semibold rounded-xl transition"
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
