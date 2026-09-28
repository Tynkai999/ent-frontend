# Guide Complet d'Intégration des APIs — ENT (`ent.tpe.bf`)

Ce guide documente l'architecture, la configuration et l'implémentation frontend de l'ensemble des **83 routes officielles** de l'API de l'ENT (`https://ent.tpe.bf`), vérifiées et alignées avec la spécification OpenAPI (`https://ent.tpe.bf/api/schema/`) et la documentation Swagger (`https://ent.tpe.bf/api/docs/`).

---

## 1. Architecture et Configuration

### 1.1 Environnements et Variables
- **API Base URL** : `https://ent.tpe.bf/api/v1` (en production et via proxy Vite `/api/v1` en développement)
- **Keycloak SSO** : `https://ent.tpe.bf/auth`
  - Realm : `ent`
  - Client ID : `ent-frontend`
  - Token Endpoint : `https://ent.tpe.bf/auth/realms/ent/protocol/openid-connect/token`
  - Direct Access Grants : Actif (`grant_type=password`) pour la connexion directe sans redirection externe.

### 1.2 Configuration Vite (`vite.config.ts`)
```ts
server: {
  proxy: {
    '/api': {
      target: 'https://ent.tpe.bf',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

---

## 2. Inventaire des 83 Routes par Module

### 0. Documentation & Schéma (Public)
| N° | Méthode | Route Backend | Description | Service Frontend |
|---|---|---|---|---|
| 0.1 | `GET` | `/api/schema/` | Schéma OpenAPI au format YAML/JSON | Public |
| 0.2 | `GET` | `/api/docs/` | Interface Swagger UI | Public |

---

### 1. Profil & Statistiques (Core)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 1.1 | `GET` | `/api/v1/me/` | Profil utilisateur connecté | `meService.get()` |
| 1.2 | `GET` | `/api/v1/me/platforms/` | Plateformes accessibles à l'utilisateur | `meService.platforms()` |
| 1.3 | `GET` | `/api/v1/stats/overview/` | Chiffres clés du Dashboard | `statsService.overview()` |

---

### 2. Organisations (`organizations`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 2.1 | `POST` | `/api/v1/organizations/` | Créer une organisation | `organizationService.create(data)` |
| 2.2 | `GET` | `/api/v1/organizations/?page=&search=` | Liste paginée des organisations | `organizationService.list(params)` |
| 2.3 | `GET` | `/api/v1/organizations/{id}/` | Détails d'une organisation | `organizationService.get(id)` |
| 2.4 | `PUT` | `/api/v1/organizations/{id}/` | Remplacement complet | `organizationService.replace(id, data)` |
| 2.5 | `PATCH`| `/api/v1/organizations/{id}/` | Mise à jour partielle | `organizationService.update(id, data)` |
| 2.6 | `DELETE`| `/api/v1/organizations/{id}/` | Supprimer une organisation | `organizationService.remove(id)` |

---

### 3. Utilisateurs (`users`) & Invitations (`invitations`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 3.1 | `POST` | `/api/v1/users/` | Créer un utilisateur | `userService.create(data)` |
| 3.2 | `GET` | `/api/v1/users/?page=&search=` | Liste des utilisateurs | `userService.list(params)` |
| 3.3 | `GET` | `/api/v1/users/{id}/` | Détails d'un utilisateur | `userService.get(id)` |
| 3.4 | `PUT` | `/api/v1/users/{id}/` | Remplacement complet | `userService.replace(id, data)` |
| 3.5 | `PATCH`| `/api/v1/users/{id}/` | Mise à jour partielle | `userService.update(id, data)` |
| 3.6 | `DELETE`| `/api/v1/users/{id}/` | Supprimer un utilisateur | `userService.remove(id)` |
| 3.7 | `POST` | `/api/v1/users/{id}/suspend/` | Suspendre un compte | `userService.suspend(id)` |
| 3.8 | `POST` | `/api/v1/users/{id}/reactivate/` | Réactiver un compte | `userService.reactivate(id)` |
| 3.9 | `POST` | `/api/v1/users/{id}/generate_credentials/` | Générer des identifiants temporaires | `userService.generateCredentials(id)` |
| 3.10 | `GET` | `/api/v1/users/{id}/sessions/` | Liste des sessions actives Keycloak | `userService.sessions(id)` |
| 3.11 | `DELETE`| `/api/v1/users/{id}/sessions/{session_id}/` | Révoquer une session | `userService.revokeSession(id, sessionId)` |
| 3.12 | `POST` | `/api/v1/invitations/` | Créer une invitation | `invitationService.create(data)` |
| 3.13 | `GET` | `/api/v1/invitations/?page=` | Liste des invitations | `invitationService.list(params)` |
| 3.14 | `GET` | `/api/v1/invitations/{id}/` | Détails d'une invitation | `invitationService.get(id)` |
| 3.15 | `POST` | `/api/v1/invitations/{id}/resend/` | Renvoyer l'email d'invitation | `invitationService.resend(id)` |
| 3.16 | `POST` | `/api/v1/invitations/{id}/revoke/` | Révoquer une invitation | `invitationService.revoke(id)` |
| 3.17 | `POST` | `/api/v1/invitations/activate/` | Activer le compte avec token + mdp | `invitationService.activate(token, pwd)` |

---

### 4. Plateformes (`platforms`) & Modules (`modules`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 4.1 | `POST` | `/api/v1/platforms/` | Créer une plateforme | `platformService.create(data)` |
| 4.2 | `GET` | `/api/v1/platforms/?page=` | Liste des plateformes | `platformService.list(params)` |
| 4.3 | `GET` | `/api/v1/platforms/{id}/` | Détails d'une plateforme | `platformService.get(id)` |
| 4.4 | `PUT` | `/api/v1/platforms/{id}/` | Remplacement complet | `platformService.replace(id, data)` |
| 4.5 | `PATCH`| `/api/v1/platforms/{id}/` | Mise à jour partielle | `platformService.update(id, data)` |
| 4.6 | `DELETE`| `/api/v1/platforms/{id}/` | Supprimer une plateforme | `platformService.remove(id)` |
| 4.7 | `GET` | `/api/v1/modules/?platform={id}` | Modules d'une plateforme | `platformService.modules(id)` |
| 4.8 | `GET` | `/api/v1/platform-roles/?platform={id}` | Rôles d'une plateforme | `platformService.roles(id)` |
| 4.9 | `GET` | `/api/v1/platforms/{id}/sso-redirect/` | URL SSO pour redirection plateforme | `platformService.ssoRedirect(id)` |
| 4.10 | `POST` | `/api/v1/modules/` | Créer un module | `moduleService.create(data)` |
| 4.11 | `GET` | `/api/v1/modules/?platform={id}` | Liste des modules | `moduleService.list(platformId)` |
| 4.12 | `GET` | `/api/v1/modules/{id}/` | Détails d'un module | `moduleService.get(id)` |
| 4.13 | `PUT` | `/api/v1/modules/{id}/` | Remplacement complet | `moduleService.replace(id, data)` |
| 4.14 | `PATCH`| `/api/v1/modules/{id}/` | Mise à jour partielle | `moduleService.update(id, data)` |
| 4.15 | `DELETE`| `/api/v1/modules/{id}/` | Supprimer un module | `moduleService.remove(id)` |

---

### 5. Rôles (`platform-roles`) & Permissions (`permissions`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 5.1 | `POST` | `/api/v1/platform-roles/` | Créer un rôle plateforme | `platformRoleService.create(data)` |
| 5.2 | `GET` | `/api/v1/platform-roles/?platform={id}` | Liste des rôles de plateforme | `platformRoleService.list(platformId)` |
| 5.3 | `GET` | `/api/v1/platform-roles/{id}/` | Détails d'un rôle | `platformRoleService.get(id)` |
| 5.4 | `PUT` | `/api/v1/platform-roles/{id}/` | Remplacement d'un rôle | `platformRoleService.replace(id, data)` |
| 5.5 | `PATCH`| `/api/v1/platform-roles/{id}/` | Mise à jour d'un rôle | `platformRoleService.update(id, data)` |
| 5.6 | `DELETE`| `/api/v1/platform-roles/{id}/` | Supprimer un rôle | `platformRoleService.remove(id)` |
| 5.7 | `GET` | `/api/v1/permissions/` | Liste des permissions applicatives | `permissionService.list()` |
| 5.8 | `GET` | `/api/v1/permissions/{id}/` | Détail d'une permission | `permissionService.get(id)` |

---

### 6. Accès & Grants (`access-grants`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 6.1 | `POST` | `/api/v1/access-grants/` | Créer un droit d'accès | `accessGrantService.create(data)` |
| 6.2 | `GET` | `/api/v1/access-grants/?user=&platform=` | Liste des accès accordés | `accessGrantService.list(params)` |
| 6.3 | `GET` | `/api/v1/access-grants/{id}/` | Détails d'un accès | `accessGrantService.get(id)` |
| 6.4 | `PUT` | `/api/v1/access-grants/{id}/` | Remplacement d'un accès | `accessGrantService.replace(id, data)` |
| 6.5 | `PATCH`| `/api/v1/access-grants/{id}/` | Mise à jour d'un accès | `accessGrantService.update(id, data)` |
| 6.6 | `DELETE`| `/api/v1/access-grants/{id}/` | Supprimer un accès | `accessGrantService.remove(id)` |
| 6.7 | `POST` | `/api/v1/access-grants/{id}/revoke/` | Révoquer immédiatement un accès | `accessGrantService.revoke(id)` |
| 6.8 | `GET` | `/api/v1/access-grants/{id}/sso-redirect/` | URL SSO pour utilisateur | `accessGrantService.ssoRedirect(id)` |

---

### 7. Documents & Versions (`documents`, `document-versions`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 7.1 | `POST` | `/api/v1/documents/` | Créer une entrée documentaire | `documentService.create(data)` |
| 7.2 | `GET` | `/api/v1/documents/?platform=&search=` | Liste des documents | `documentService.list(params)` |
| 7.3 | `GET` | `/api/v1/documents/{id}/` | Détails d'un document | `documentService.get(id)` |
| 7.4 | `PUT` | `/api/v1/documents/{id}/` | Remplacement d'un document | `documentService.replace(id, data)` |
| 7.5 | `PATCH`| `/api/v1/documents/{id}/` | Mise à jour d'un document | `documentService.update(id, data)` |
| 7.6 | `DELETE`| `/api/v1/documents/{id}/` | Supprimer un document | `documentService.remove(id)` |
| 7.7 | `POST` | `/api/v1/document-versions/` | Téléverser une version de fichier (multipart) | `documentService.uploadVersion(docId, file, label)` |
| 7.8 | `GET` | `/api/v1/document-versions/?document={id}` | Historique des versions | `documentVersionService.list(docId)` |
| 7.9 | `GET` | `/api/v1/document-versions/{id}/` | Détails d'une version | `documentVersionService.get(id)` |
| 7.10 | `DELETE`| `/api/v1/document-versions/{id}/` | Supprimer une version | `documentVersionService.remove(id)` |

---

### 8. Notifications (`notifications`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 8.1 | `POST` | `/api/v1/notifications/` | Créer une notification | `notificationService.create(data)` |
| 8.2 | `GET` | `/api/v1/notifications/?is_read=false` | Liste des notifications utilisateur | `notificationService.list(params)` |
| 8.3 | `GET` | `/api/v1/notifications/{id}/` | Détails d'une notification | `notificationService.get(id)` |
| 8.4 | `POST` | `/api/v1/notifications/{id}/mark_read/` | Marquer une notification comme lue | `notificationService.markRead(id)` |
| 8.5 | `POST` | `/api/v1/notifications/mark-all-read/` | Tout marquer comme lu | `notificationService.markAllRead()` |
| 8.6 | `DELETE`| `/api/v1/notifications/{id}/` | Supprimer une notification | `notificationService.remove(id)` |

---

### 9. Journal d'Audit (`audit-logs`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 9.1 | `GET` | `/api/v1/audit-logs/?action=&actor=` | Journal d'audit paginé | `auditLogService.list(params)` |
| 9.2 | `GET` | `/api/v1/audit-logs/{id}/` | Détails d'un événement d'audit | `auditLogService.get(id)` |

---

### 10. Assistant IA (`ai`)
| N° | Méthode | Route Backend | Description | Méthode Service Frontend |
|---|---|---|---|---|
| 10.1 | `POST` | `/api/v1/ai/sessions/` | Créer une nouvelle session IA | `aiService.listSessions()` (auto-créé) |
| 10.2 | `GET` | `/api/v1/ai/sessions/?page=` | Liste des conversations de l'utilisateur | `aiService.listSessions(params)` |
| 10.3 | `GET` | `/api/v1/ai/sessions/{id}/` | Historique complet des messages | `aiService.getSession(id)` |
| 10.4 | `DELETE`| `/api/v1/ai/sessions/{id}/` | Supprimer définitivement une conversation | `aiService.deleteSession(id)` |
| 10.5 | `POST` | `/api/v1/ai/sessions/{id}/clear/` | Vider l'historique sans supprimer | `aiService.clearSession(id)` |
| 10.6 | `POST` | `/api/v1/ai/chat/` | Envoi synchrone d'une question | `aiService.chat(data)` |
| 10.7 | `POST` | `/api/v1/ai/chat/stream/` | Streaming SSE mot par mot | `aiService.chatStream(data, onChunk, onDone)` |
| 10.8 | `GET` | `/api/v1/ai/stats/` | Métriques d'utilisation & lacunes RAG | `aiService.stats()` |
