import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { aiService } from '../services/ai.service';
import { documentService } from '../services/document.service';
import { platformService } from '../services/platform.service';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../models/User.model';
import type {
  AiStatsResponse,
  ChatMessage,
  ConversationSession,
} from '../models/Ai.model';
import type { Document } from '../models/Document.model';
import type { Platform } from '../models/Platform.model';

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [showDocsDrawer, setShowDocsDrawer] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Quelles sont les plateformes disponibles sur l'ENT ?",
    "Que contient le manuel d'utilisation Economat ?",
    "Quelles sont les spécifications du cahier des charges APEC ?",
    "Comment fonctionne la gestion des accès et rôles ?",
  ]);

  useEffect(() => {
    if (isSuperAdmin) {
      setSuggestedQuestions([
        "Quelles sont les plateformes disponibles sur l'ENT ?",
        "Comment fonctionne la gestion des accès et rôles Keycloak ?",
        "Que contient le cahier des charges APEC ?",
        "Comment superviser les organisations et les audits ?",
      ]);
    } else if (isOrgAdmin) {
      setSuggestedQuestions([
        "Comment inviter un collaborateur dans mon organisation ?",
        "Comment attribuer un accès à Economat ou Parc Manager ?",
        "Que contient le manuel d'utilisation Economat ?",
        "Comment gérer les réquisitions de mon entité ?",
      ]);
    } else {
      setSuggestedQuestions([
        "Quelles sont les plateformes autorisées pour mon compte ?",
        "Comment soumettre une commande dans le module CVB d'Economat ?",
        "Comment accéder à E-Timbre ou Parc Manager ?",
        "Que contient le cahier des charges APEC ?",
      ]);
    }
  }, [user?.role, isSuperAdmin, isOrgAdmin]);

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

  // Charger la liste des documents et plateformes disponibles pour le RAG
  useEffect(() => {
    documentService
      .list()
      .then((res) => {
        setAvailableDocs(res.results || []);
      })
      .catch((e) => {
        console.warn('Impossible de charger les documents pour le RAG:', e);
      });

    platformService
      .list()
      .then((res) => {
        setAvailablePlatforms(res.results || []);
      })
      .catch((e) => {
        console.warn('Impossible de charger les plateformes pour le RAG:', e);
      });
  }, []);

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
    const roleLabel = user ? (ROLE_LABELS[user.role] || user.role) : 'Utilisateur';
    const orgLabel = user?.organization_name ? ` (${user.organization_name})` : '';

    setMessages([
      {
        id: 'welcome-init',
        role: 'assistant',
        content: `### Bonjour${user?.first_name ? ` ${user.first_name}` : ''} !
Je suis l'Assistant IA de l'ENT, configuré pour votre profil **${roleLabel}**${orgLabel}.

${
  isSuperAdmin
    ? `En tant que **Super Administrateur**, vous disposez d'un contrôle global sur l'écosystème :
- **Gouvernance des plateformes** : Economat, E-Timbre, Parc Manager, SGI-GCOB.
- **Spécifications techniques** : Cahier des charges APEC (v1.0), intégration SSO Keycloak.
- **Sécurité et supervision** : Gestion des organisations, permissions et journal d'audit.`
    : isOrgAdmin
    ? `En tant qu'**Administrateur de votre Organisation**, vous gérez les membres et leurs outils :
- **Gestion des membres** : Invitations de collaborateurs et suivi des comptes.
- **Attributions d'accès** : Droits sur Economat, Parc Manager, E-Timbre.
- **Documentation métier** : Manuel Economat, gestion des réquisitions.`
    : `En tant qu'**Utilisateur**, voici comment je peux vous guider au quotidien :
- **Vos outils métiers** : Utilisation du module de commande CVB d'Economat, accès aux timbres.
- **Accès aux plateformes** : E-Timbre, Parc Manager et SGI-GCOB.
- **Assistance & Accompagnement** : Réponses à vos questions sur les documents officiels.`
}

*Posez votre question ci-dessous ou cliquez sur l'un des guides proposés.*`,
        sources: [
          {
            document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
            document_title: "Manuel d'utilisation Economat (APEC)",
            version: '1.0',
            page: 1,
            snippet: "Guide officiel d'utilisation et d'administration du portail Economat et de ses modules.",
            url: '/documents',
          },
          {
            document_id: 'f2a8d3d8-01b9-4583-a0c3-1cc56035eee7',
            document_title: 'Cahier des charges APEC (MedScan Enterprise)',
            version: '1.0',
            page: 1,
            snippet: "Spécifications fonctionnelles, intégration SSO Keycloak et sécurité des échanges ENT.",
            url: '/documents',
          },
        ],
        intent: 'rag',
        platform: 'ENT Central',
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
        { message: text, session_id: activeSessionId, user },
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === tempAssistantId ? { ...m, content: accumulated } : m))
          );
        },
        (finalText, metadata) => {
          if (!activeSessionId && metadata?.session_id) {
            setActiveSessionId(metadata.session_id);
          }
          if (metadata?.suggested_questions && metadata.suggested_questions.length > 0) {
            setSuggestedQuestions(metadata.suggested_questions);
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? {
                    ...m,
                    content: finalText,
                    sources: metadata?.sources || m.sources,
                    intent: metadata?.intent || 'rag',
                    platform: metadata?.platform,
                  }
                : m
            )
          );
          setLoading(false);
          loadSessions();
        },
        async () => {
          // Fallback synchrone si échec SSE
          const resp = await aiService.chat({ message: text, session_id: activeSessionId, user });
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
      subtitle="Recherche documentaire augmentée (RAG) et assistance aux utilisateurs"
    >
      <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Volet Latéral : Historique des Sessions */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Discussions</span>
            </div>
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sessionsLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Chargement de vos discussions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune conversation enregistrée. Posez votre première question !
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-primary dark:text-blue-200 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-6">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
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
              className="flex items-center gap-1.5 hover:text-primary transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Métriques & RAG</span>
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Assistant Documentaire ENT
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    RAG Actif
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : isOrgAdmin
                        ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {user ? ROLE_LABELS[user.role] || user.role : 'Utilisateur'}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Indexation en direct des manuels, guides et spécifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDocsDrawer(!showDocsDrawer)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition ${
                  showDocsDrawer
                    ? 'bg-blue-50 border-primary text-primary'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Base de connaissances ({availableDocs.length + availablePlatforms.length || 6})</span>
              </button>
              <button
                onClick={openStatsModal}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Métriques</span>
              </button>
            </div>
          </div>

          {/* Bandeau dépliable : Base documentaire & Plateformes connectées */}
          {showDocsDrawer && (
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-200/80 dark:border-blue-900/60 px-6 py-3.5 space-y-3 text-xs">
              {/* Plateformes connectées */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <Sparkles size={15} className="text-primary shrink-0" />
                  <span className="font-semibold">Plateformes officielles ENT :</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(availablePlatforms.length > 0
                    ? availablePlatforms
                    : [
                        { id: '1', name: 'Economat', code: 'ECO' },
                        { id: '2', name: 'E-Timbre', code: 'ET' },
                        { id: '3', name: 'Parc Manager', code: 'PM' },
                        { id: '4', name: 'SGI-GCOB', code: 'GCOB' },
                      ]
                  ).map((plat, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(`Présente-moi la plateforme ${plat.name}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition shadow-2xs"
                    >
                      <span className="font-medium">{plat.name}</span>
                      <span className="text-[10px] text-primary font-bold">({plat.code})</span>
                    </button>
                  ))}
                  <Link
                    to="/admin/platforms"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold ml-2"
                  >
                    <span>Toutes les plateformes</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              </div>

              {/* Documents & Manuels indexés */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <BookOpen size={15} className="text-primary shrink-0" />
                  <span className="font-semibold">Guides et manuels indexés :</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(availableDocs.length > 0
                    ? availableDocs
                    : [
                        { id: '1', title: 'Manuel d\'utilisation Economat', platform_name: 'Economat' },
                        { id: '2', title: 'Cahier des charges APEC', platform_name: 'Economat' },
                      ]
                  ).map((doc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(`Que contient le document ${doc.title} ?`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition shadow-2xs"
                    >
                      <FileText size={11} className="text-primary" />
                      <span className="font-medium">{doc.title}</span>
                      {doc.platform_name && <span className="text-[10px] text-slate-400">({doc.platform_name})</span>}
                    </button>
                  ))}
                  <Link
                    to="/documents"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold ml-2"
                  >
                    <span>Tous les documents</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center mb-4 shadow-sm border border-blue-100 dark:border-blue-900">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Comment puis-je vous aider ?
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  L'IA interroge les documentations techniques et guides utilisateurs pour vous apporter des réponses précises.
                </p>

                {/* Suggestions initiales */}
                <div className="grid gap-2 w-full">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 text-left text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary hover:shadow-xs text-slate-700 dark:text-slate-200 transition"
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
                <div key={m.id} className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                      isUser
                        ? 'bg-primary text-white'
                        : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-white border border-slate-700'
                    }`}
                  >
                    {isUser ? 'Moi' : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>

                  <div className={`space-y-2 flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-primary text-white rounded-tr-none shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : m.content ? (
                        <MarkdownRenderer content={m.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                          <Clock className="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Lecture et analyse des documentations en cours...</span>
                        </div>
                      )}
                    </div>

                    {/* Sources et métadonnées RAG pour l'assistant */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            <span>Sources documentaires exploitées ({m.sources.length})</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                            RAG Validé
                          </span>
                        </div>

                        <div className="grid gap-2">
                          {m.sources.map((src, i) => {
                            const sourceKey = `${m.id}-src-${i}`;
                            const isExpanded = expandedSourceId === sourceKey;
                            return (
                              <div
                                key={i}
                                className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 overflow-hidden text-xs"
                              >
                                <div
                                  onClick={() => setExpandedSourceId(isExpanded ? null : sourceKey)}
                                  className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={13} className="text-primary shrink-0" />
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {src.document_title || 'Document Technique ENT'}
                                    </span>
                                    {src.version && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                                        v{src.version}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {src.page && (
                                      <span className="text-[11px] font-medium text-slate-500">
                                        Page {src.page}
                                      </span>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp size={14} className="text-slate-400" />
                                    ) : (
                                      <ChevronDown size={14} className="text-slate-400" />
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 space-y-2">
                                    {src.snippet && (
                                      <div>
                                        <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                                          Extrait du manuel analysé par l'IA :
                                        </span>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                          « {src.snippet} »
                                        </p>
                                      </div>
                                    )}
                                    <div className="flex justify-end pt-1">
                                      <Link
                                        to="/documents"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                      >
                                        <span>Consulter ce document</span>
                                        <ExternalLink size={11} />
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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

          {/* Suggestions de questions rapides */}
          {suggestedQuestions && suggestedQuestions.length > 0 && !loading && (
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                <HelpCircle size={12} /> Questions suggérées :
              </span>
              <div className="flex gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-primary dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition shrink-0 shadow-2xs"
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barre de saisie */}
          <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question à l'Assistant IA (ex: mes accès, plateformes, Economat, E-Timbre, Parc Manager)..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 resize-none px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-32 min-h-[38px]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition shrink-0 shadow-sm"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="max-w-4xl mx-auto mt-2 text-[11px] text-center text-slate-400 flex items-center justify-center gap-4">
              <span>Assistant RAG avec filtrage des données et indexation vectorielle</span>
              <span>•</span>
              <span>Entrée pour envoyer, Maj+Entrée pour saut de ligne</span>
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
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Statistiques de l'Assistant IA</h3>
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
                    <p className="text-xl font-bold text-primary">
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
