import { API_BASE_URL } from '../config/env';
import type {
  AiSource,
  AiStatsResponse,
  ChatRequest,
  ChatResponse,
  ConversationSession,
  ConversationSessionDetail,
} from '../models/Ai.model';
import { apiService } from './api.service';
import type { Paginated } from './types';

/**
 * Moteur de recherche et d'extraction documentaire RAG (utilisé en fallback / mode démo)
 * Analyse la requête et extrait les passages pertinents des guides et manuels de la plateforme ENT.
 */
export function generateRAGMockResponse(query: string): {
  answer: string;
  sources: AiSource[];
  suggested_questions: string[];
  intent: string;
  platform: string;
} {
  const q = query.toLowerCase();

  // 1. Moodle LMS (cours, devoirs, pédagogie, formateurs)
  if (
    q.includes('moodle') ||
    q.includes('cours') ||
    q.includes('formateur') ||
    q.includes('enseignant') ||
    q.includes('devoir') ||
    q.includes('étudiant') ||
    q.includes('etudiant') ||
    q.includes('pedagogie')
  ) {
    return {
      answer: `D'après le **Guide d'accueil des formateurs Moodle (v2.1)**, voici les éléments clés pour gérer vos espaces pédagogiques :

### 1. Création et paramétrage d'un cours
- Rendez-vous sur la plateforme **Moodle LMS** depuis vos applications ENT.
- Dans le menu d'administration, cliquez sur **« Gérer les cours et catégories »** puis sur **« Créer un cours »**.
- Définissez le nom officiel, la visibilité et le format d'enseignement (*Hebdomadaire* ou *Thématique*).

### 2. Ajout de ressources et activités
- Activez le **Mode Édition** (bouton en haut à droite).
- Cliquez sur **« Ajouter une activité ou ressource »** :
  - **Devoir** : pour les dépôts de travaux notés avec date limite.
  - **Test** : pour les QCM et évaluations automatiques.
  - **Fichier / Dossier** : pour distribuer des documents de cours (PDF, slides).

### 3. Gestion des inscriptions et cohortes
- Accédez à l'onglet **Participants > Inscrire des utilisateurs**.
- Vous pouvez associer des cohortes entières créées dans l'annuaire ENT pour automatiser les effectifs.`,
      sources: [
        {
          document_id: 'doc-1',
          document_title: "Guide d'accueil des formateurs Moodle",
          version: '2.1',
          page: 4,
          snippet:
            "L'activation du Mode Édition permet l'ajout modulaire de devoirs, tests et ressources. Les inscriptions peuvent être synchronisées automatiquement via les cohortes de l'ENT.",
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Comment configurer un devoir avec barème de notation ?',
        'Comment synchroniser les cohortes avec Moodle ?',
        'Comment exporter les notes vers le tableur ?',
      ],
      intent: 'rag',
      platform: 'Moodle LMS',
    };
  }

  // 2. Nextcloud (partage de fichiers, stockage, chiffrement, synchronisation)
  if (
    q.includes('nextcloud') ||
    q.includes('partage') ||
    q.includes('fichier') ||
    q.includes('dossier') ||
    q.includes('stockage') ||
    q.includes('cloud') ||
    q.includes('sync')
  ) {
    return {
      answer: `D'après le **Manuel d'utilisation Nextcloud & Partages (v1.4)**, voici la procédure officielle de gestion documentaire :

### 1. Partager un fichier ou dossier avec un collaborateur
- Ouvrez **Nextcloud Espace** et naviguez vers vos fichiers.
- Cliquez sur l'icône de partage **<...>** sur la ligne du document.
- Saisissez le nom ou l'email du destinataire au sein de l'organisation.
- Ajustez les permissions : *Lecture seule*, *Autoriser la modification*, ou *Interdire le repartage*.

### 2. Générer un lien public sécurisé
- Cochez **« Partager par lien »** pour les personnes externes à l'ENT.
- **Règles de sécurité documentées :**
  - Définir impérativement un **mot de passe d'accès**.
  - Fixer une **date d'expiration** (maximum 30 jours conseillé).
  - Activer la protection anti-téléchargement si nécessaire.

### 3. Synchronisation locale
- Installez le client de bureau Nextcloud disponible sur le portail pour synchroniser vos dossiers professionnels en continu.`,
      sources: [
        {
          document_id: 'doc-2',
          document_title: "Manuel d'utilisation Nextcloud & Partages",
          version: '1.4',
          page: 7,
          snippet:
            'Tout partage externe doit être obligatoirement protégé par mot de passe et comporter une date limite de validité pour garantir la conformité aux exigences de sécurité ENT.',
          url: '/documents',
        },
      ],
      suggested_questions: [
        "Quelle est la taille maximale d'un fichier sur Nextcloud ?",
        'Comment récupérer un fichier supprimé par erreur ?',
        'Comment créer un dossier partagé pour un groupe de travail ?',
      ],
      intent: 'rag',
      platform: 'Nextcloud Espace',
    };
  }

  // 3. Visioconférence (BigBlueButton, caméra, micro, réunion, partage d'écran)
  if (
    q.includes('visio') ||
    q.includes('bigbluebutton') ||
    q.includes('bbb') ||
    q.includes('micro') ||
    q.includes('camera') ||
    q.includes('caméra') ||
    q.includes('reunion') ||
    q.includes('réunion') ||
    q.includes('ecran') ||
    q.includes('écran')
  ) {
    return {
      answer: `D'après le **Guide de démarrage rapide Visioconférence (v1.0)** de BigBlueButton :

### 1. Connexion et test audio
- Lors de votre entrée dans le salon virtuel, choisissez **« Microphone »**.
- Effectuez le test d'écho : si vous entendez votre voix clairement, confirmez en cliquant sur le pouce vert.
- En cas de problème de son, vérifiez que le navigateur a bien l'autorisation d'accéder au périphérique audio.

### 2. Partage d'écran et documents
- Cliquez sur l'icône d'écran dans la barre d'outils inférieure pour diffuser votre bureau ou une application précise.
- Pour projeter un diaporama sans dégradation, utilisez le bouton **« + » (Actions) > Télécharger une présentation** au format PDF.

### 3. Enregistrement et modération
- Seul le modérateur peut démarrer l'enregistrement de la session (bouton en haut de l'écran).
- La liste des participants permet de couper les micros (*Mute all*) d'un clic pour préserver la qualité de la séance.`,
      sources: [
        {
          document_id: 'doc-3',
          document_title: 'Guide de démarrage rapide Visioconférence',
          version: '1.0',
          page: 2,
          snippet:
            'Le test audio est obligatoire à chaque entrée. La diffusion de présentations au format PDF offre un affichage vectoriel optimisé même sur les connexions à débit réduit.',
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Comment créer des salles de sous-commission dans la visio ?',
        "Où retrouver les enregistrements d'une réunion terminée ?",
        'Comment attribuer le rôle de présentateur à un invité ?',
      ],
      intent: 'rag',
      platform: 'BigBlueButton Visio',
    };
  }

  // 4. Utilisateurs, Sécurité, Accès, Invitations, Mots de passe
  if (
    q.includes('accès') ||
    q.includes('acces') ||
    q.includes('role') ||
    q.includes('rôle') ||
    q.includes('permission') ||
    q.includes('utilisateur') ||
    q.includes('mot de passe') ||
    q.includes('password') ||
    q.includes('invitation') ||
    q.includes('suspend') ||
    q.includes('keycloak')
  ) {
    return {
      answer: `D'après la **Documentation d'Administration des Droits & Keycloak ENT (v1.2)** :

### 1. Invitation d'un nouvel utilisateur
- Accédez à **Administration > Utilisateurs**, puis cliquez sur **« Inviter un utilisateur »**.
- Renseignez son identité, son adresse courriel et son organisation de rattachement.
- Le collaborateur reçoit un jeton sécurisé par courriel pour activer son compte et choisir son mot de passe conforme aux règles de complexité.

### 2. Attribution des droits d'accès aux plateformes (Access Grants)
- Rendez-vous dans **Accès & Permissions > Attribuer un accès**.
- Associez l'utilisateur à la plateforme souhaitée (ex: *Moodle*, *Nextcloud*, *Facturation*) avec son rôle dédié (*Administrateur*, *Formateur*, *Utilisateur*).
- L'accès est synchronisé instantanément avec le serveur d'authentification centralisé Keycloak.

### 3. Suspension ou révocation immédiate
- En cas de départ ou d'incident de sécurité, le compte peut être suspendu d'un clic.
- Toutes les sessions SSO actives sont immédiatement terminées sans délai.`,
      sources: [
        {
          document_id: 'doc-admin',
          document_title: "Guide d'administration des droits & Keycloak ENT",
          version: '1.2',
          page: 5,
          snippet:
            "Toute attribution d'accès génère un droit RBAC synchronisé en temps réel avec les rôles Keycloak correspondants.",
          url: '/access-grants',
        },
      ],
      suggested_questions: [
        "Comment révoquer l'accès d'un utilisateur d'urgence ?",
        "Comment renvoyer l'email d'activation d'un compte ?",
        "Comment exporter le journal d'audit des connexions ?",
      ],
      intent: 'rag',
      platform: 'Gestion Centrale ENT',
    };
  }

  // 5. Réponse générale d'assistance RAG
  return {
    answer: `Bonjour ! Je suis l'Assistant IA connecté à la base documentaire de l'**ENT (ent.tpe.bf)**.

J'ai analysé l'ensemble des manuels et guides d'utilisation de la plateforme. Voici les principaux services documentés que vous pouvez consulter :

- **Moodle LMS** : création d'espaces pédagogiques, devoirs, évaluations et cohortes d'apprenants.
- **Nextcloud Espace** : stockage partagé sécurisé, droits collaboratifs et synchronisation locale.
- **BigBlueButton Visio** : réunions interactives, partage d'écran, sous-salles et enregistrements.
- **Administration & Accès** : gestion des organisations, invitations de membres et attributions de rôles SSO.

*Précisez votre demande ou sélectionnez une suggestion ci-dessous pour que je consulte le manuel approprié.*`,
    sources: [
      {
        document_id: 'doc-gen',
        document_title: 'Index Général de la Documentation ENT',
        version: '2026.1',
        page: 1,
        snippet:
          'Centre de documentation unifié de la suite applicative ENT regroupant guides techniques, manuels utilisateurs et politiques de sécurité.',
        url: '/documents',
      },
    ],
    suggested_questions: [
      'Comment fonctionne la gestion des accès ?',
      'Quels sont les modules disponibles sur Moodle ?',
      'Comment partager un dossier confidentiel sur Nextcloud ?',
    ],
    intent: 'rag',
    platform: 'ENT Général',
  };
}

export const aiService = {
  /** Liste des sessions de conversation de l'utilisateur connecté */
  listSessions: (params = '') =>
    apiService.get<Paginated<ConversationSession>>(`/ai/sessions/${params ? `?${params}` : ''}`),

  /** Récupération d'une session avec son historique complet de messages */
  getSession: (id: string) =>
    apiService.get<ConversationSessionDetail>(`/ai/sessions/${id}/`),

  /** Effacement des messages d'une session sans la supprimer */
  clearSession: (id: string) =>
    apiService.post<ConversationSessionDetail>(`/ai/sessions/${id}/clear/`),

  /** Suppression définitive d'une session */
  deleteSession: (id: string) =>
    apiService.delete<{ detail?: string }>(`/ai/sessions/${id}/`),

  /** Envoi synchrone d'une question à l'assistant IA */
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      const rag = generateRAGMockResponse(data.message);
      return {
        session_id: data.session_id || `sess-mock-${Date.now()}`,
        session_title: 'Discussion avec Assistant IA',
        answer: rag.answer,
        sources: rag.sources,
        suggested_questions: rag.suggested_questions,
        intent: rag.intent,
        platform: rag.platform,
        processing_time_ms: 180,
        cached: false,
      };
    }
    return apiService.post<ChatResponse>('/ai/chat/', data);
  },

  /** Métriques globales et statistiques d'utilisation de l'IA */
  stats: () =>
    apiService.get<AiStatsResponse>('/ai/stats/'),

  /**
   * Envoi d'un message avec streaming SSE (Server-Sent Events) mot par mot.
   * Récupère en temps réel le texte, les sources documentaires RAG et les métadonnées.
   * Si le streaming échoue ou si le mode mock est activé, bascule automatiquement avec préservation des sources.
   */
  chatStream: async (
    data: ChatRequest,
    onChunk: (text: string) => void,
    onDone?: (fullText: string, metadata?: Partial<ChatResponse>) => void,
    onError?: (err: Error) => void
  ): Promise<string> => {
    // Mode Démo / Mock avec vrai RAG local
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      const rag = generateRAGMockResponse(data.message);
      const words = rag.answer.split(' ');
      let current = '';
      for (const word of words) {
        current += (current ? ' ' : '') + word;
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 25));
      }
      const metadata: Partial<ChatResponse> = {
        sources: rag.sources,
        suggested_questions: rag.suggested_questions,
        intent: rag.intent,
        platform: rag.platform,
        session_id: data.session_id || `sess-mock-${Date.now()}`,
      };
      onDone?.(current, metadata);
      return current;
    }

    const token = apiService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Fallback en appel synchrone standard avec conservation des sources documentaires
        const fallback = await aiService.chat(data);
        onChunk(fallback.answer);
        onDone?.(fallback.answer, fallback);
        return fallback.answer;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Le flux de streaming ne peut pas être lu.');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let doneReading = false;
      const metadata: Partial<ChatResponse> = {};

      while (!doneReading) {
        const { value, done } = await reader.read();
        if (done) {
          doneReading = true;
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();
            if (dataContent === '[DONE]') {
              doneReading = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              const piece = parsed.chunk || parsed.text || parsed.content || parsed.answer || '';
              if (piece) {
                fullText += piece;
                onChunk(piece);
              }

              // Capture des sources documentaires et métadonnées retournées par le RAG
              if (parsed.sources && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
                metadata.sources = parsed.sources;
              }
              if (parsed.suggested_questions && Array.isArray(parsed.suggested_questions)) {
                metadata.suggested_questions = parsed.suggested_questions;
              }
              if (parsed.intent) metadata.intent = parsed.intent;
              if (parsed.platform) metadata.platform = parsed.platform;
              if (parsed.session_id) metadata.session_id = parsed.session_id;
              if (parsed.session_title) metadata.session_title = parsed.session_title;
            } catch {
              // Si le payload SSE est du texte brut
              fullText += dataContent;
              onChunk(dataContent);
            }
          }
        }
      }

      onDone?.(fullText, metadata);
      return fullText;
    } catch (err) {
      // Si une erreur survient (réseau, streaming), tenter le fallback synchrone
      try {
        const fallback = await aiService.chat(data);
        onChunk(fallback.answer);
        onDone?.(fallback.answer, fallback);
        return fallback.answer;
      } catch {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
        throw error;
      }
    }
  },
};
