# Guide Complet d'Intégration des API — ENT Frontend

Ce guide référence l'ensemble des règles, conventions et bonnes pratiques pour intégrer et consommer les API du backend de l'Espace Numérique de Travail (**ENT**) hébergé sur **`https://ent.tpe.bf/api/v1`**, conformément à la collection Postman officielle et à la documentation Swagger sur **[https://ent.tpe.bf/api/docs/](https://ent.tpe.bf/api/docs/)**.

---

## Sommaire

1. [Architecture & Principes Généraux](#1-architecture--principes-généraux)
2. [Authentification & Cycle de Vie du Token](#2-authentification--cycle-de-vie-du-token)
3. [Le Client HTTP Unique (`apiService`)](#3-le-client-http-unique-apiservice)
4. [Cartographie des 10 Modules (Postman ↔ Code)](#4-cartographie-des-10-modules-postman--code)
5. [Règles Spécifiques au Backend Django REST Framework (DRF)](#5-règles-spécifiques-au-backend-django-rest-framework-drf)
6. [Exemples d'Implémentation Types](#6-exemples-dimplémentation-types)
   - [CRUD Paginé & Filtres](#a-liste-paginée-avec-filtres-et-recherche)
   - [Création & Validation](#b-création-avec-gestion-des-erreurs-drf)
   - [Upload de Fichier (Multipart)](#c-upload-de-fichier-en-multipartform-data)
   - [Streaming IA (Server-Sent Events)](#d-assistant-ia-avec-streaming-sse)
7. [Gestion des Erreurs et Codes HTTP](#7-gestion-des-erreurs-et-codes-http)

---

## 1. Architecture & Principes Généraux

Toute interaction avec le backend respecte une architecture stricte à 4 niveaux :

```
Composant React (src/pages / src/components)
       │
       ▼
Service Métier (src/services/*.service.ts)
       │
       ▼
Client HTTP Centralisé (src/services/api.service.ts)
       │
       ▼
Proxy Vite (vite.config.ts) en Dev  /  Reverse Proxy Nginx en Prod
       │
       ▼
Serveur Backend (https://ent.tpe.bf/api/v1/)
```

### Règle absolue
**Aucun composant React ne doit exécuter un `fetch()` ou un appel HTTP direct.** Tous les appels transitent par un service dédié situé dans `src/services/`.

---

## 2. Authentification & Cycle de Vie du Token

Le backend utilise des jetons **JWT Bearer** délivrés par le serveur Keycloak de `ent.tpe.bf`.

1. **Obtention du jeton** :
   - Soit par flux OIDC Authorization Code + PKCE (redirection Keycloak via `authService.login()`).
   - Soit par flux direct identifiants Resource Owner Password Credentials via `authService.loginWithCredentials(username, password)`.
2. **Stockage sécurisé** :
   - `ent_access_token` : Jeton d'accès Bearer envoyé avec chaque requête.
   - `ent_refresh_token` : Jeton de rafraîchissement.
   - `ent_id_token` : Informations d'identité OIDC.
3. **Auto-refresh transparent** :
   - Le client `apiService` inspecte la date d'expiration (`exp`) du token JWT et planifie son renouvellement 5 secondes avant expiration.
   - Si une requête reçoit un code `401 Unauthorized`, `apiService` tente automatiquement un refresh via Keycloak avant d'échouer.

---

## 3. Le Client HTTP Unique (`apiService`)

Défini dans `src/services/api.service.ts`, ce singleton fournit les méthodes :

| Méthode | Usage | Exemple |
|---|---|---|
| `apiService.get<T>(endpoint)` | Lecture (liste ou détail) | `apiService.get<User>('/me/')` |
| `apiService.post<T>(endpoint, body)` | Création d'une ressource | `apiService.post('/organizations/', data)` |
| `apiService.put<T>(endpoint, body)` | Remplacement complet | `apiService.put('/users/123/', data)` |
| `apiService.patch<T>(endpoint, body)` | Modification partielle | `apiService.patch('/users/123/', { phone })` |
| `apiService.delete<T>(endpoint)` | Suppression | `apiService.delete('/organizations/123/')` |
| `apiService.postFormData<T>(endpoint, formData)` | Upload binaire | `apiService.postFormData('/document-versions/', fd)` |

---

## 4. Cartographie des 10 Modules (Postman ↔ Code)

Voici le tableau de correspondance complet entre les sections de la collection Postman et les fichiers du frontend :

| # | Section Postman | Routes API | Service Frontend | Modèle TypeScript |
|---|---|---|---|---|
| **0** | **Documentation & Schéma** | `/api/schema/`, `/api/docs/` | Public | — |
| **1** | **Profil & Stats** | `/api/v1/me/`, `/api/v1/me/platforms/`, `/api/v1/stats/overview/` | `src/services/me.service.ts`, `src/services/audit.service.ts` | `User.model.ts`, `Platform.model.ts`, `AuditLog.model.ts` |
| **2** | **Organisations** | `/api/v1/organizations/`, `/api/v1/organizations/{id}/` | `src/services/organization.service.ts` | `Organization.model.ts` |
| **3** | **Utilisateurs & Sessions** | `/api/v1/users/`, `/suspend/`, `/reactivate/`, `/invite/`, `/generate_credentials/`, `/sessions/` | `src/services/user.service.ts` | `User.model.ts` |
| **4** | **Invitations** | `/api/v1/invitations/`, `/resend/`, `/revoke/`, `/activate/` | `src/services/user.service.ts` (`invitationService`) | `User.model.ts` (`Invitation`) |
| **5** | **Plateformes & Modules** | `/api/v1/platforms/`, `/platforms/{id}/sso-redirect/`, `/modules/`, `/platform-roles/` | `src/services/platform.service.ts` | `Platform.model.ts` |
| **6** | **Permissions & Accès** | `/api/v1/permissions/`, `/api/v1/access-grants/`, `/access-grants/{id}/sso-redirect/`, `/revoke/` | `src/services/access.service.ts` | `Access.model.ts` |
| **7** | **Documents & Versions** | `/api/v1/documents/`, `/api/v1/document-versions/` | `src/services/document.service.ts` | `Document.model.ts` |
| **8** | **Notifications** | `/api/v1/notifications/`, `/mark_read/`, `/mark-all-read/` | `src/services/audit.service.ts` (`notificationService`) | `AuditLog.model.ts` |
| **9** | **Journal d'Audit** | `/api/v1/audit-logs/`, `/api/v1/audit-logs/{id}/` | `src/services/audit.service.ts` (`auditLogService`) | `AuditLog.model.ts` |
| **10** | **Assistant IA** | `/api/v1/ai/sessions/`, `/api/v1/ai/chat/`, `/api/v1/ai/chat/stream/`, `/api/v1/ai/stats/` | `src/services/ai.service.ts` | `Ai.model.ts` |

---

## 5. Règles Spécifiques au Backend Django REST Framework (DRF)

### 1. Le Slash Final Obligatoire (`/`)
Django applique la directive `APPEND_SLASH = True`. Toute requête sans slash final (`/users?page=1`) générera une redirection `301 Moved Permanently`.
-  `/api/v1/users`
-  `/api/v1/users/` ou `/api/v1/users/?page=1`

### 2. La Structure de Pagination Standard
Tous les endpoints de liste (`GET /api/v1/nom_ressource/`) renvoient la structure DRF paginée suivante :
```typescript
export interface Paginated<T> {
  count: number;       // Nombre total d'éléments
  next: string | null; // URL de la page suivante
  previous: string | null; // URL de la page précédente
  results: T[];        // Tableau des éléments de la page actuelle
}
```
Dans vos composants, les éléments se trouvent toujours dans **`response.results`**.

### 3. Filtres & Query Parameters
Utilisez toujours `URLSearchParams` pour construire les requêtes filtrées afin d'échapper correctement les caractères spéciaux (espaces, dates, UUIDs) :
```typescript
const params = new URLSearchParams({
  page: '1',
  page_size: '20',
  status: 'active',
  search: query.trim(),
});
apiService.get<Paginated<Organization>>(`/organizations/?${params.toString()}`);
```

---

## 6. Exemples d'Implémentation Types

### A. Liste paginée avec filtres et recherche

Dans le service :
```typescript
// src/services/organization.service.ts
export const organizationService = {
  list: (params: { page?: number; status?: string; search?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.status) sp.set('status', params.status);
    if (params.search) sp.set('search', params.search);
    return apiService.get<Paginated<Organization>>(`/organizations/?${sp.toString()}`);
  },
};
```

Dans le composant React :
```tsx
const [organizations, setOrganizations] = useState<Organization[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');

const fetchOrganizations = useCallback(async () => {
  setLoading(true);
  try {
    const data = await organizationService.list({ search });
    setOrganizations(data.results);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [search]);

useEffect(() => {
  fetchOrganizations();
}, [fetchOrganizations]);
```

---

### B. Création avec gestion des erreurs DRF

Le client `apiService` extrait automatiquement les erreurs détaillées renvoyées par Django (`detail`, `non_field_errors`, ou erreurs par champ comme `{"email": ["Cet email existe déjà."]}`).

```tsx
const handleCreateUser = async (formData: Partial<User>) => {
  setSaving(true);
  setError('');
  try {
    const createdUser = await userService.create(formData);
    onSuccess(createdUser);
  } catch (err) {
    // Affiche automatiquement "email: Cet email existe déjà."
    setError(err instanceof Error ? err.message : 'Erreur inattendue.');
  } finally {
    setSaving(false);
  }
};
```

---

### C. Upload de fichier en `multipart/form-data`

Pour les téléversements (comme une nouvelle version de manuel ou document technique) :

```typescript
// src/services/document.service.ts
uploadVersion: (documentId: string, file: File, versionLabel: string, changelog = '') => {
  const formData = new FormData();
  formData.append('document', documentId);
  formData.append('version_label', versionLabel);
  formData.append('changelog', changelog);
  formData.append('is_current', 'true');
  formData.append('file', file);
  return apiService.postFormData<DocumentVersion>('/document-versions/', formData);
}
```

---

### D. Assistant IA avec Streaming SSE

Le module IA propose un endpoint de streaming (`/api/v1/ai/chat/stream/`) en **Server-Sent Events** pour afficher la réponse mot par mot comme ChatGPT :

```tsx
import { aiService } from '../services/ai.service';

const handleSendAiPrompt = async (prompt: string, sessionId?: string) => {
  setStreamingAnswer('');
  setIsGenerating(true);

  await aiService.chatStream(prompt, sessionId, {
    onChunk: (textChunk) => {
      setStreamingAnswer((prev) => prev + textChunk);
    },
    onDone: () => {
      setIsGenerating(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsGenerating(false);
    },
  });
};
```

---

## 7. Gestion des Erreurs et Codes HTTP

| Code HTTP | Signification | Comportement Frontend |
|---|---|---|
| **200 OK** | Succès lecture ou mise à jour | Données parsées et renvoyées directement |
| **201 Created** | Création réussie | Ressource créée renvoyée (avec son nouvel `id`) |
| **204 No Content** | Suppression réussie | Renvoie un objet vide `{}` |
| **400 Bad Request** | Erreur de validation | Parse les messages de champ DRF et les affiche sous forme de toast ou d'alerte |
| **401 Unauthorized** | Token absent ou expiré | Tente un rafraîchissement de jeton via Keycloak. En cas d'échec, redirige vers `/login` |
| **403 Forbidden** | Rôle insuffisant (RBAC) | Erreur « Accès refusé. Vous n'avez pas les permissions nécessaires. » |
| **404 Not Found** | ID inexistant | Erreur « Ressource non trouvée. » |
| **500 / 502 / 504** | Erreur serveur ou coupure | Lève une `NetworkError` permettant à l'utilisateur de cliquer sur « Réessayer » |

