# Spécification Technique & Guide d'Architecture — Assistant IA Backend ENT

> **Destinataires :** Équipe de Développement Backend (Django / Python) & Ingénieurs IA / MLOps  
> **Système Cible :** Espace Numérique de Travail (ENT) — `https://ent.tpe.bf`  
> **Auteur :** Équipe Frontend ENT  
> **Date de Version :** 29 Septembre 2026  
> **Statut :** Spécification Officielle de Référence  

---

## 1. Contexte & Problématique

### 1.1 Constat Initial
Jusqu'à présent, le frontend simulait une partie des réponses de l'IA via un catalogue statique codé en dur (`generateRAGResponse`). Cette approche présentait deux limites majeures :
1. **Invisibilité des documents réels :** Les documents téléversés par les administrateurs dans l'ENT (PDFs d'Economat, spécifications, notes de service) n'étaient pas exploités dynamiquement.
2. **Réponses déconnectées de l'utilisateur :** L'IA ne savait pas quelles étaient les habilitations effectives de l'utilisateur connecté ni à quelle organisation il appartenait.

### 1.2 Décision d'Architecture
- **Le frontend est désormais un client pur et strict :** Toutes les réponses en dur ont été purgées. Chaque question saisie par un utilisateur transite directement vers l'API backend via `POST /api/v1/ai/chat/stream/` (streaming SSE) ou `POST /api/v1/ai/chat/` (synchrone).
- **L'intelligence et la sécurité sont centralisées sur le backend :** Le backend doit ingérer et vectoriser les documents réels, identifier le rôle de l'utilisateur via son jeton Keycloak, et interroger les données de l'ENT en temps réel.

---

## 2. Architecture Globale : "Agentic RAG" Hybride

Pour que l'IA puisse **accéder à tous les recoins de l'écosystème ENT** et répondre selon les profils, elle doit combiner **deux sources de données complémentaires** :

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 Jeton JWT Keycloak                     │
                               │ (sub, email, role, organization_id, realm_access.roles)│
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                                                          ▼
┌──────────────────────┐   POST /api/v1/ai/chat/    ┌───────────────────────────────────────────┐
│                      │ ─────────────────────────► │                                           │
│  Frontend ENT React  │   Authorization: Bearer    │        Backend Django REST + LangChain    │
│  (Client Pur SSE)    │                            │                                           │
│                      │ ◄───────────────────────── │  1. Extraction request.user               │
└──────────────────────┘   Streaming text/event     │  2. Construction System Prompt dynamique  │
                                                    │  3. Agent Orchestrateur (LLM)             │
                                                    └─────────────┬─────────────────────────────┘
                                                                  │
                                      ┌───────────────────────────┴───────────────────────────┐
                                      ▼                                                       ▼
                       ┌─────────────────────────────┐                         ┌─────────────────────────────┐
                       │   Cerveau 1 : Vector Store  │                         │ Cerveau 2 : SQL Tool Calling│
                       │   (ChromaDB / pgvector)     │                         │   (Base de Données ENT)     │
                       ├─────────────────────────────┤                         ├─────────────────────────────┤
                       │ - Manuels d'utilisation PDF │                         │ - Table AccessGrant (droits)│
                       │ - Cahiers des charges       │                         │ - Table Platform & Modules  │
                       │ - Guides d'administration   │                         │ - Table User & Organisation │
                       │ * Filtré par rôle (RBAC)    │                         │ - Table AuditLog (sécurité) │
                       └─────────────────────────────┘                         └─────────────────────────────┘
```

1. **Cerveau 1 — La Recherche Vectorielle (RAG sur Documents téléversés) :**  
   Pour répondre aux questions de type *"Comment faire une réquisition dans Economat ?"* ou *"Quelles sont les exigences de sécurité TLS du cahier des charges ?"*.
2. **Cerveau 2 — Le Tool Calling (Interrogation SQL en temps réel) :**  
   Pour répondre aux questions de type *"Quelles sont mes plateformes actives ?"*, *"Combien de membres compte mon organisation ?"* ou *"Qui a modifié les accès hier ?"*.

---

## 3. Matrice des Rôles & Posture Attendue de l'IA

À chaque appel, le backend décode le token Keycloak et dispose de l'objet `request.user`. L'IA doit adopter une posture et un niveau de privilège adaptés :

| Rôle Utilisateur | Périmètre Autorisé | Posture & Règles Métier de l'IA |
| :--- | :--- | :--- |
| **`super_admin`** | **Tous les recoins de l'ENT** (toutes organisations, audit, plateformes, Keycloak, serveurs). | - Fournit des explications avancées sur la gouvernance, l'audit et la sécurité.<br>- Peut exécuter les outils d'audit global et de gestion multi-organisations.<br>- Accède à l'intégralité de la base documentaire. |
| **`org_admin`** | **Son organisation uniquement** (ses membres, ses invitations, ses accès délégués). | - Guide sur l'invitation de collaborateurs et l'attribution des rôles locaux.<br>- Ne peut pas voir les données des autres organisations ni les logs d'audit racine.<br>- Accède aux manuels généraux et aux documents rattachés à son organisation. |
| **`client_user`** | **Ses propres accès uniquement** (plateformes où il a un `AccessGrant` actif). | - Répond exclusivement sur l'utilisation de ses outils métiers débloqués (**Economat**, **E-Timbre**, **Parc Manager**, **SGI-GCOB**).<br>- Ne propose **jamais** de commandes d'administration système.<br>- Si l'utilisateur demande comment avoir un accès : l'orienter vers l'administrateur de son organisation. |

---

## 4. Spécification des Outils Backend (Tool Calling)

Le modèle LLM (OpenAI, Mistral, Anthropic ou modèle local) doit être configuré avec des fonctions exécutables (*Tools / Function Calling*).

### 4.1 Outil : `get_user_active_access(user_id: str)`
- **Objectif :** Répondre avec exactitude à *"Quelles sont mes plateformes ?"*, *"À quoi ai-je accès ?"*.
- **Implémentation Backend :**
  ```python
  @tool
  def get_user_active_access(user_id: str) -> dict:
      """Récupère la liste des plateformes et modules autorisés pour un utilisateur donné."""
      grants = AccessGrant.objects.filter(
          user_id=user_id,
          status='active',
          is_currently_valid=True
      ).select_related('platform')
      
      return {
          "user_id": str(user_id),
          "platforms": [
              {
                  "code": g.platform.code,
                  "name": g.platform.name,
                  "role": g.platform_role.label if g.platform_role else "Utilisateur",
                  "modules": list(g.modules.values_list('name', flat=True)),
                  "url": g.platform.url
              }
              for g in grants
          ]
      }
  ```

### 4.2 Outil : `list_official_platforms()`
- **Objectif :** Fournir le catalogue officiel à jour des 4 plateformes de production (**Economat**, **E-Timbre**, **Parc Manager**, **SGI-GCOB**).
- **Implémentation Backend :**
  ```python
  @tool
  def list_official_platforms() -> list:
      """Liste les plateformes actives et disponibles en production sur l'ENT."""
      platforms = Platform.objects.filter(status='active').order_by('name')
      return [
          {
              "code": p.code,
              "name": p.name,
              "description": p.description,
              "url": p.url,
              "version": p.version
          }
          for p in platforms
      ]
  ```

### 4.3 Outil : `get_organization_stats(org_id: str)` *(Réservé Admin)*
- **Objectif :** Permettre aux administrateurs de connaître l'effectif et l'état des comptes de leur entité.
- **Règle de sécurité :** Lever une exception si `request.user.role == 'client_user'`.

---

## 5. Ingestion Documentaire & Filtrage de Sécurité (RBAC RAG)

### 5.1 Découpage (Chunking) & Métadonnées Obligatoires
Chaque fois qu'un document est téléversé via l'API `/api/v1/document-versions/`, un signal ou une tâche Celery doit découper le fichier en morceaux (*chunks*) de **600 à 1000 tokens** avec un chevauchement de 100 tokens.

Chaque morceau indexé dans la base vectorielle (`pgvector` ou `Chroma`) **doit obligatoirement** comporter les métadonnées suivantes :

```python
chunk_metadata = {
    "document_id": str(document.id),
    "document_title": document.title,
    "version": version.version_label,
    "platform_code": document.platform.code if document.platform else "GENERAL",
    "organization_id": str(document.organization_id) if document.organization_id else "PUBLIC",
    "required_roles": ["super_admin", "org_admin"],  # ou ["*"] pour les manuels publics
    "page": page_number,
    "source_file": version.file.name
}
```

### 5.2 Filtrage à la Requête (Retriever RBAC)
Lorsqu'un utilisateur pose une question, le filtre de similarité vectorielle applique les restrictions :

```python
# Exemple de filtrage vectoriel selon le profil
user_role = request.user.role
user_org = str(request.user.organization_id) if request.user.organization else "PUBLIC"

search_filter = {
    "$and": [
        {"required_roles": {"$in": [user_role, "*"]}},
        {"organization_id": {"$in": [user_org, "PUBLIC"]}}
    ]
}

relevant_docs = vectorstore.similarity_search(query, k=4, filter=search_filter)
```

---

## 6. Prompt Système Dynamique (Template de Référence)

Avant d'invoquer le LLM, le backend construit dynamiquement le prompt système en y injectant les variables issues de `request.user` :

```text
Tu es l'Assistant Intelligent de l'Espace Numérique de Travail (ENT) de l'administration (ent.tpe.bf).

### CONTEXTE DE L'UTILISATEUR CONNECTÉ
- Identité : {user_full_name} ({user_email})
- Rôle attribué : {user_role} ({role_description})
- Organisation de rattachement : {organization_name}
- Plateformes autorisées : {user_active_platforms_list}

### DIRECTIVES DE SÉCURITÉ & DE POSTURE SELON LE RÔLE
1. SI L'UTILISATEUR EST 'client_user' :
   - Il dispose d'un profil standard d'agent. Réponds avec précision sur l'usage des modules autorisés (saisie des réquisitions CVB sur Economat, timbres dématérialisés sur E-Timbre, matériel sur Parc Manager).
   - N'évoque pas les procédures d'administration système, de gestion Keycloak ou de suspension d'utilisateurs.
   - S'il demande comment obtenir une nouvelle plateforme, invite-le à contacter l'administrateur de son organisation ({organization_name}).

2. SI L'UTILISATEUR EST 'org_admin' :
   - Explique la gestion des membres de son organisation, l'invitation de collaborateurs et l'attribution des droits d'accès délégués.
   - Limite toujours tes réponses aux données de son organisation.

3. SI L'UTILISATEUR EST 'super_admin' :
   - Tu peux détailler l'ensemble des aspects d'interopérabilité technique (OpenID Connect / Keycloak, TLS 1.3), les journaux d'audit et la gestion globale multi-entités.

### RÈGLES DE RÉPONSE & CITATION DES SOURCES
- Base tes réponses en priorité sur les extraits des documents officiels fournis dans le contexte RAG.
- Si la question concerne ses droits ou son compte, utilise les outils internes pour consulter son statut réel.
- Si une information ne figure pas dans les documents indexés, indique-le honnêtement sans inventer de procédures.
- Lorsque tu cites un document, mentionne son titre exact, sa version et la page concernée.
```

---

## 7. Contrat d'API Frontend ↔ Backend

### 7.1 Route Synchrone : `POST /api/v1/ai/chat/`

#### Requête Frontend
```json
{
  "message": "Quelles sont les procédures de réquisition dans Economat ?",
  "session_id": "9dd08a45-cbce-476d-b300-946e0854cefa",
  "image": null
}
```
> **Important :** `session_id` est de type `UUID` optionnel / nullable. Si omis ou null, le backend crée une session et renvoie son UUID dans la réponse.

#### Réponse Backend Attendue (200 OK)
```json
{
  "session_id": "9dd08a45-cbce-476d-b300-946e0854cefa",
  "session_title": "Procédures de réquisition Economat",
  "answer": "D'après le **Manuel d'utilisation Economat (v1.0)**, la procédure de réquisition dans le module CVB comprend trois étapes :\n\n1. **Sélection des articles** : Accédez au catalogue de fournitures depuis l'application Economat.\n2. **Validation du panier** : Définissez les quantités requises et motivez la demande.\n3. **Circuit hiérarchique** : La réquisition est soumise à la validation de votre responsable avant émission du bon de sortie.",
  "sources": [
    {
      "document_id": "9dd08a45-cbce-476d-b300-946e0854cefa",
      "document_title": "Manuel d'utilisation Economat (APEC)",
      "version": "1.0",
      "page": 2,
      "snippet": "Le module CVB permet aux agents d'effectuer des réquisitions de fournitures et d'en suivre le circuit de validation.",
      "url": "/documents"
    }
  ],
  "suggested_questions": [
    "Comment suivre l'état d'approbation de ma commande ?",
    "Que faire si un article n'est pas en stock ?"
  ],
  "intent": "rag",
  "platform": "Economat",
  "processing_time_ms": 320,
  "cached": false
}
```

---

### 7.2 Route Streaming : `POST /api/v1/ai/chat/stream/`

Cette route utilise le standard **Server-Sent Events (SSE)** (`text/event-stream`).

#### Format des Événements Diffusés
1. **Morceaux de texte (Tokens) :**
   ```http
   data: {"chunk": "D'après "}

   data: {"chunk": "le Manuel "}

   data: {"chunk": "d'utilisation Economat..."}
   ```
2. **Métadonnées & Sources (généralement envoyées en début ou fin de flux) :**
   ```http
   data: {"sources": [{"document_title": "Manuel Economat", "page": 2}], "suggested_questions": ["..."], "platform": "Economat"}
   ```
3. **Signal de Clôture :**
   ```http
   data: [DONE]
   ```

---

## 8. Exemple d'Implémentation Backend de Référence (Python / Django REST / LangChain)

Voici le squelette de vue Django recommandé :

```python
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import StreamingHttpResponse
import json

from .agent import get_ent_agent_executor

class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')

        if not message:
            return Response(
                {"detail": "Le champ 'message' est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialiser l'agent IA avec le contexte utilisateur
        agent = get_ent_agent_executor(user=user, session_id=session_id)
        result = agent.invoke({"input": message})

        return Response({
            "session_id": str(agent.session.id),
            "session_title": agent.session.title,
            "answer": result.get("output"),
            "sources": result.get("sources", []),
            "suggested_questions": result.get("suggested_questions", []),
            "intent": result.get("intent", "rag"),
            "platform": result.get("platform")
        })


class AIChatStreamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')

        if not message:
            return Response({"detail": "Message manquant."}, status=status.HTTP_400_BAD_REQUEST)

        def event_stream():
            agent = get_ent_agent_executor(user=user, session_id=session_id)
            for event in agent.stream_events({"input": message}, version="v2"):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"].content
                    if chunk:
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                elif kind == "on_chain_end" and event["name"] == "Agent":
                    metadata = event["data"].get("output", {})
                    yield f"data: {json.dumps(metadata)}\n\n"

            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Obligatoire pour Nginx
        return response
```

---

## 9. Checklist de Recette pour le Développeur Backend

- [ ] **Décodage JWT :** L'API extrait bien `user = request.user` depuis le token Keycloak.
- [ ] **System Prompt Contextualisé :** Le nom, rôle, organisation et plateformes actives sont injectés dans le prompt système du LLM.
- [ ] **Tool Calling Opérationnel :** L'outil `get_user_active_access` permet à l'IA de lister les plateformes autorisées pour l'utilisateur sans hallucination.
- [ ] **Indexation des Documents :** Les fichiers PDF téléversés dans `/api/v1/documents/` sont découpés, vectorisés et interrogeables via le retriever.
- [ ] **Filtrage RBAC des Documents :** Un utilisateur simple n'accède pas aux chunks de documents réservés aux administrateurs.
- [ ] **Format de Streaming SSE :** Les réponses sur `/api/v1/ai/chat/stream/` sont préfixées par `data: ` et se terminent par `data: [DONE]`.
- [ ] **Configuration Nginx :** La directive `proxy_buffering off;` et `X-Accel-Buffering: no;` est activée pour éviter que Nginx ne bloque les flux SSE.

---
*Ce document sert de contrat d'interface officiel entre le Frontend et l'IA Backend de l'ENT.*
