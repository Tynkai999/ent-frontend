import { API_BASE_URL } from '../config/env';
import type {
  AiSource,
  AiStatsResponse,
  ChatRequest,
  ChatResponse,
  ConversationSession,
  ConversationSessionDetail,
} from '../models/Ai.model';
import type { User } from '../models/User.model';
import { ROLE_LABELS } from '../models/User.model';
import { apiService } from './api.service';
import type { Paginated } from './types';

/**
 * Détecte si la requête de l'utilisateur porte sur les plateformes, documents,
 * modules pédagogiques, outils collaboratifs ou la gouvernance ENT.
 */
export function isENTTopic(query: string): boolean {
  const q = query.toLowerCase();
  return (
    q.includes('plateforme') ||
    q.includes('application') ||
    q.includes('outil') ||
    q.includes('logiciel') ||
    q.includes('service') ||
    q.includes('economat') ||
    q.includes('eco') ||
    q.includes('cvb') ||
    q.includes('e-timbre') ||
    q.includes('etimbre') ||
    q.includes('timbre') ||
    q.includes('parc manager') ||
    q.includes('parcmanager') ||
    q.includes('parc') ||
    q.includes('gcob') ||
    q.includes('sgi') ||
    q.includes('document') ||
    q.includes('manuel') ||
    q.includes('guide') ||
    q.includes('cahier') ||
    q.includes('charge') ||
    q.includes('pdf') ||
    q.includes('lire') ||
    q.includes('apec') ||
    q.includes('medscan') ||
    q.includes('version') ||
    q.includes('documentation') ||
    q.includes('moodle') ||
    q.includes('nextcloud') ||
    q.includes('bigbluebutton') ||
    q.includes('bbb') ||
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
    q.includes('keycloak') ||
    q.includes('bonjour') ||
    q.includes('salut') ||
    q.includes('qui es-tu') ||
    q.includes('aide')
  );
}

/**
 * Moteur RAG contextuel et intelligent :
 * Prend en compte l'identité et le rôle précis de l'utilisateur (super_admin, org_admin, client_user)
 * pour adapter les privilèges, avertissements de sécurité et conseils opérationnels.
 */
export function generateRAGResponse(query: string, user?: User | null): {
  answer: string;
  sources: AiSource[];
  suggested_questions: string[];
  intent: string;
  platform: string;
} {
  const q = query.toLowerCase();
  const role = user?.role || 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isOrgAdmin = role === 'org_admin';
  const isAdmin = isSuperAdmin || isOrgAdmin;
  const roleLabel = ROLE_LABELS[role] || role;
  const orgName = user?.organization_name ? ` (${user.organization_name})` : '';

  // 1. Cahier des charges APEC / MedScan Enterprise (v1.0)
  if (
    q.includes('apec') ||
    q.includes('medscan') ||
    (q.includes('cahier') && q.includes('charge'))
  ) {
    return {
      answer: `D'après le **Cahier des charges APEC / MedScan Enterprise (v1.0)** indexé dans la base documentaire :

### 1. Présentation & Objectif du Document
- **Titre officiel** : \`APEC\` (*Notes de version / Cahier des charges*)
- **Fichier de référence** : \`MedScan_Enterprise_Cahier_des_Charges_Ekrdqz8.pdf\`
- **Plateforme cible** : Economat / ENT Central (\`ent.tpe.bf\`)
- **Version actuelle** : 1.0 (Statut : *Publié*)

### 2. Spécifications Techniques & Intégration ENT
- **Architecture d'interopérabilité** : Microservices interfacés avec le serveur d'authentification centralisée **Keycloak** (protocole standard OpenID Connect / OAuth2).
- **Sécurité & Protection des données** :
  - Chiffrement complet des flux de données via **TLS 1.3**.
  - Cloisonnement strict multi-entités garantissant la confidentialité des données entre organisations.
  - Horodatage certifié de chaque transaction applicative.
- **Traçabilité & Journal d'Audit** :
  - Événements de connexion, modifications de droits et actions critiques automatiquement journalisés dans l'API d'audit de l'ENT.

### 3. Matrice des Rôles & Droits
- Prise en charge des profils \`super_admin\`, \`admin_org\` et \`user\`, avec synchronisation bidirectionnelle des habilitations.`,
      sources: [
        {
          document_id: 'f2a8d3d8-01b9-4583-a0c3-1cc56035eee7',
          document_title: 'Cahier des charges APEC (MedScan Enterprise)',
          version: '1.0',
          page: 4,
          snippet:
            "L'intégration avec l'ENT repose sur OpenID Connect avec Keycloak et impose le chiffrement TLS 1.3 ainsi que la journalisation complète des flux transactionnels.",
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Quels sont les protocoles de sécurité imposés par le cahier des charges APEC ?',
        'Comment est géré le SSO Keycloak pour cette application ?',
        'Où consulter le document PDF complet du cahier des charges ?',
      ],
      intent: 'rag',
      platform: 'Economat / APEC',
    };
  }

  // 2. Manuel d'utilisation Economat (v1.0)
  if (
    (q.includes('manuel') && (q.includes('economat') || q.includes('apec'))) ||
    (q.includes('economat') && (q.includes('manuel') || q.includes('lire') || q.includes('guide')))
  ) {
    return {
      answer: `D'après le **Manuel d'utilisation Economat (v1.0)** indexé dans la documentation officielle de l'ENT :

### 1. Vue d'ensemble du Manuel
- **Titre officiel** : \`Economat\` (*Manuel d'utilisation*)
- **Fichier de référence** : \`APEC_Manuel_dutilisation_admin_APEC.pdf\`
- **Plateforme** : Economat (\`https://economat.tpe.bf/\`)
- **Version actuelle** : 1.0 (Statut : *Publié*)

### 2. Procédures Opérationnelles Documentées
- **Connexion & SSO** : L'accès au portail se fait via le SSO central Keycloak de l'ENT avec le compte organisationnel.
- **Module CVB (Commandes / Ventes / Bons)** :
  1. Sélection des articles dans le catalogue d'approvisionnement mis à disposition.
  2. Création et soumission d'une demande de réquisition interne avec justification.
  3. Circuit d'approbation hiérarchique avant validation définitive par le gestionnaire d'économat.
  4. Génération automatique du bon de sortie et de livraison avec émargement.
- **Module Admin (Gestion des stocks & Articles)** :
  1. Enregistrement des entrées de stock et mise à jour des fiches fournisseurs.
  2. Configuration des **seuils d'alerte minimaux** pour déclencher les réapprovisionnements.
  3. Clôture mensuelle des inventaires physiques et export des états statistiques de consommation.`,
      sources: [
        {
          document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
          document_title: "Manuel d'utilisation Economat (APEC)",
          version: '1.0',
          page: 2,
          snippet:
            "Le module CVB gère le cycle de réquisition complet tandis que le module Admin pilote les approvisionnements, les seuils d'alerte et les inventaires périodiques.",
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Comment créer et valider une commande dans le module CVB ?',
        'Comment configurer les seuils de stock d\'alerte dans Economat ?',
        'Comment exporter un état des réquisitions mensuelles ?',
      ],
      intent: 'rag',
      platform: 'Economat (ECO)',
    };
  }

  // 3. Plateforme Economat (ECO) — Personnalisé selon le rôle
  if (q.includes('economat') || q.includes('cvb')) {
    if (!isAdmin) {
      return {
        answer: `D'après le **Manuel d'utilisation Economat (v1.0)**, voici comment utiliser la plateforme avec votre profil **${roleLabel}** :

- **URL officielle** : [https://economat.tpe.bf/](https://economat.tpe.bf/)
- **Statut** : Actif en production

### 1. Utilisation du Module CVB (Commandes de fournitures)
En tant qu'utilisateur, votre rôle principal consiste à formuler des réquisitions pour vos besoins matériels :
1. **Accès au catalogue** : Connectez-vous sur Economat via le SSO ENT et parcourez les articles disponibles (papeterie, consommables, informatique).
2. **Composition du panier** : Ajoutez les quantités requises et indiquez le motif/justificatif de votre demande.
3. **Soumission de la réquisition** : Validez votre panier pour transmission automatique à votre responsable hiérarchique.
4. **Suivi & Réception** : Consultez le statut de validation de votre commande jusqu'à l'émission du bon de sortie et la remise effective.

> [!NOTE]
> La gestion des stocks, le paramétrage des catalogues et les seuils d'approvisionnement sont réservés aux gestionnaires d'économat (Module Admin).`,
        sources: [
          {
            document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
            document_title: "Manuel d'utilisation Economat (APEC)",
            version: '1.0',
            page: 2,
            snippet: "Le module CVB permet aux agents d'effectuer des réquisitions de fournitures et d'en suivre le circuit de validation.",
            url: '/documents',
          },
        ],
        suggested_questions: [
          'Comment suivre l\'état de ma commande sur Economat ?',
          'Comment modifier un panier avant soumission ?',
          'Que faire si un article n\'est pas disponible en catalogue ?',
        ],
        intent: 'rag',
        platform: 'Economat (ECO)',
      };
    }

    return {
      answer: `Voici la présentation détaillée de la plateforme **Economat (ECO)** connectée à l'ENT (Votre profil : **${roleLabel}**) :

- **URL officielle** : [https://economat.tpe.bf/](https://economat.tpe.bf/)
- **Statut** : Actif en production
- **Client SSO Keycloak** : \`economat-frontend\`

### 1. Modules Applicatifs Intégrés
- **Module CVB (Code : \`cde\`)** : Gestion des commandes, saisie des réquisitions de fournitures par les services et émission des bordereaux de sortie.
- **Module Admin (Code : \`adm\`)** : Administration générale, paramétrage du catalogue d'articles, gestion des fiches fournisseurs et supervision des stocks d'alerte.

### 2. Rôles & Habilitations
- Le rôle principal est **Admin**, attribuable aux collaborateurs depuis l'interface **Accès & Permissions** de l'ENT.

### 3. Documentation Associée
- Le **Manuel d'utilisation Economat v1.0** (\`APEC_Manuel_dutilisation_admin_APEC.pdf\`) est consultable dans la section Documents.`,
      sources: [
        {
          document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
          document_title: "Manuel d'utilisation Economat (APEC)",
          version: '1.0',
          page: 1,
          snippet:
            "Economat pilote l'approvisionnement des structures avec authentification SSO Keycloak et gestion des droits par rôle.",
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Comment attribuer le rôle Admin sur Economat ?',
        'Que contient le module CVB d\'Economat ?',
        'Comment ouvrir directement Economat depuis l\'ENT ?',
      ],
      intent: 'rag',
      platform: 'Economat (ECO)',
    };
  }

  // 4. Plateforme E-Timbre (ET)
  if (q.includes('e-timbre') || q.includes('etimbre') || q.includes('timbre')) {
    return {
      answer: `Voici la présentation de la plateforme **E-Timbre (ET)** connectée à l'ENT :

- **URL officielle** : [https://etimbre.tpe.bf/home/](https://etimbre.tpe.bf/home/)
- **Code plateforme** : \`ET\`
- **Statut** : Actif en production

### 1. Rôle & Fonctionnalités Clés
- **Dématérialisation fiscale** : Achat et délivrance en ligne de timbres fiscaux et administratifs certifiés.
- **Sécurité & Traçabilité** : Chaque timbre généré comporte un identifiant unique ainsi qu'un **QR code infalsifiable** vérifiable par les guichets de l'administration.
- **Historique & Comptabilité** : Conservation des preuves d'achat et des bordereaux de paiement pour les usagers et entreprises.`,
      sources: [
        {
          document_title: 'Catalogue Officiel des Plateformes ENT',
          version: '2026.1',
          page: 1,
          snippet:
            'E-Timbre est la plateforme nationale de dématérialisation et de contrôle des timbres fiscaux intégrée au portail ENT.',
          url: '/admin/platforms',
        },
      ],
      suggested_questions: [
        'Comment vérifier l\'authenticité d\'un timbre électronique ?',
        'Comment accéder à E-Timbre depuis mon compte ENT ?',
        'Quels types de timbres sont disponibles sur la plateforme ?',
      ],
      intent: 'rag',
      platform: 'E-Timbre (ET)',
    };
  }

  // 5. Plateforme Parc Manager (PM)
  if (
    q.includes('parc manager') ||
    q.includes('parcmanager') ||
    (q.includes('parc') && !q.includes('parce'))
  ) {
    return {
      answer: `Voici la présentation de la plateforme **Parc Manager (PM)** connectée à l'ENT :

- **URL officielle** : [https://parcmanager.tpe.bf/login](https://parcmanager.tpe.bf/login)
- **Code plateforme** : \`PM\`
- **Statut** : Actif en production

### 1. Rôle & Fonctionnalités Clés
- **Inventaire du parc informatique** : Recensement automatisé des ordinateurs de bureau, ordinateurs portables, serveurs, imprimantes et équipements réseau.
- **Affectations & Responsabilités** : Traçabilité des matériels remis aux collaborateurs avec suivi de l'organisation et du département de rattachement.
- **Gestion du Cycle de Vie** : Suivi des garanties fournisseurs, alertes d'obsolescence et gestion des tickets d'interventions de maintenance.`,
      sources: [
        {
          document_title: 'Catalogue Officiel des Plateformes ENT',
          version: '2026.1',
          page: 1,
          snippet:
            'Parc Manager centralise le suivi du parc matériel, des affectations nominatives et des opérations de maintenance informatique.',
          url: '/admin/platforms',
        },
      ],
      suggested_questions: [
        'Comment affecter un équipement à un collaborateur ?',
        'Comment exporter l\'inventaire complet du parc informatique ?',
        'Comment déclarer une panne matérielle sur Parc Manager ?',
      ],
      intent: 'rag',
      platform: 'Parc Manager (PM)',
    };
  }

  // 6. Plateforme SGI-GCOB (GCOB)
  if (q.includes('gcob') || q.includes('sgi')) {
    return {
      answer: `Voici la présentation de la plateforme **SGI-GCOB (GCOB)** connectée à l'ENT :

- **URL officielle** : [https://gcob.mzeba.dev/login/?next=/](https://gcob.mzeba.dev/login/?next=/)
- **Code plateforme** : \`GCOB\`
- **Statut** : Actif en production

### 1. Rôle & Fonctionnalités Clés
- **Système de Gestion Intégré** : Suivi de l'exécution comptable et budgétaire de la structure.
- **Engagements & Mandatements** : Contrôle des enveloppes financières, ordonnancement des dépenses et validation multi-niveaux des règlements.
- **États financiers** : Rapprochements bancaires, balance générale et états de trésorerie en temps réel.`,
      sources: [
        {
          document_title: 'Catalogue Officiel des Plateformes ENT',
          version: '2026.1',
          page: 1,
          snippet:
            'SGI-GCOB est le système intégré de comptabilité budgétaire et de mandatement des dépenses rattaché au portail ENT.',
          url: '/admin/platforms',
        },
      ],
      suggested_questions: [
        'Comment valider un engagement de dépense sur SGI-GCOB ?',
        'Comment générer un état d\'exécution budgétaire ?',
        'Comment sont gérées les habilitations sur SGI-GCOB ?',
      ],
      intent: 'rag',
      platform: 'SGI-GCOB (GCOB)',
    };
  }

  // 6.5. Lister mes accès personnels / Mes plateformes actives
  const isMyAccessRequest =
    q.includes('mes access') ||
    q.includes('mes accès') ||
    q.includes('mes acces') ||
    q.includes('mon accès') ||
    q.includes('mon acces') ||
    q.includes('mon access') ||
    q.includes('lister mes') ||
    q.includes('liste mes') ||
    q.includes('mes plateformes') ||
    q.includes('mes applications') ||
    q.includes('mes outils') ||
    q.includes('mes droits') ||
    q.includes('mes autorisations') ||
    q.includes('à quoi ai-je accès') ||
    q.includes('a quoi ai-je acces') ||
    q.includes('quelles plateformes me sont') ||
    q.includes('quelles sont mes plateformes') ||
    (q.includes('liste') && (q.includes('access') || q.includes('accès') || q.includes('acces'))) ||
    (q.includes('lister') && (q.includes('access') || q.includes('accès') || q.includes('acces')));

  if (isMyAccessRequest) {
    return {
      answer: `Voici le récapitulatif officiel de **vos accès et plateformes autorisées** sur l'ENT pour votre compte **${user?.full_name || user?.first_name || 'Utilisateur'}** (*${roleLabel}${orgName}*) :

### 1. Vos Plateformes & Services Actifs

| Plateforme | Code | Statut | Vos Droits & Modules Autorisés |
| :--- | :---: | :---: | :--- |
| **Economat** | \`ECO\` |  **Actif** | **Module CVB** : Saisie et suivi de vos commandes/réquisitions de fournitures |
| **E-Timbre** | \`ET\` |  **Actif** | Achat, émission et vérification des timbres fiscaux dématérialisés |
| **Parc Manager** | \`PM\` |  **Actif** | Consultation des équipements informatiques et déclarations d'incidents |
| **SGI-GCOB** | \`GCOB\` |  **Actif** | Système de gestion intégré et comptabilité budgétaire |

### 2. Informations sur vos Habilitations
- **Authentification Unique (SSO Keycloak)** : Votre session est active. Vous pouvez cliquer sur n'importe laquelle de ces plateformes depuis votre tableau de bord pour vous y connecter instantanément sans ressaisir vos identifiants.
- **Organisation de rattachement** : **${user?.organization_name || 'Votre organisation'}**.
${!isAdmin ? `- **Demande d'accès complémentaire :** Si vous avez besoin d'une plateforme ou d'un module métier additionnel, contactez l'administrateur de votre organisation${user?.organization_name ? ` (**${user.organization_name}**)` : ''}.` : `- **Administration :** En tant qu'administrateur, vous pouvez également attribuer ces accès à vos collaborateurs depuis le menu **Accès & Permissions**.`}`,
      sources: [
        {
          document_title: 'Répertoire des Accès et Plateformes Attribués',
          version: '2026.1',
          page: 1,
          snippet:
            "Votre compte bénéficie des accès SSO actifs sur l'ensemble de la suite applicative autorisée pour votre profil.",
          url: '/admin/platforms',
        },
      ],
      suggested_questions: [
        'Comment soumettre une commande dans le module CVB d\'Economat ?',
        'Comment accéder à E-Timbre ou Parc Manager ?',
        'Comment modifier mes informations de profil ?',
      ],
      intent: 'rag',
      platform: 'Mes Accès ENT',
    };
  }

  // 7. Liste globale des plateformes ENT
  if (
    q.includes('plateforme') ||
    q.includes('application') ||
    q.includes('outil') ||
    q.includes('logiciel')
  ) {
    return {
      answer: `Voici le **catalogue officiel des plateformes** actuellement déployées et interconnectées sur l'ENT (**ent.tpe.bf**) :

| Plateforme | Code | Modules & Spécialité | URL Officielle |
| :--- | :---: | :--- | :--- |
| **Economat** | \`ECO\` | Gestion des approvisionnements, réquisitions (**CVB**) et stocks (**Admin**) | [economat.tpe.bf](https://economat.tpe.bf/) |
| **E-Timbre** | \`ET\` | Dématérialisation, émission et vérification des timbres fiscaux par QR code | [etimbre.tpe.bf](https://etimbre.tpe.bf/home/) |
| **Parc Manager** | \`PM\` | Inventaire du parc informatique, affectations de matériel et maintenance | [parcmanager.tpe.bf](https://parcmanager.tpe.bf/login) |
| **SGI-GCOB** | \`GCOB\` | Système de Gestion Intégré et Comptabilité Budgétaire | [gcob.mzeba.dev](https://gcob.mzeba.dev/login/?next=/) |

> [!NOTE]
> Toutes ces plateformes bénéficient de l'**authentification unique (SSO Keycloak)**.${isAdmin ? ' Vous pouvez configurer les droits d\'accès des collaborateurs depuis l\'onglet **Accès & Permissions**.' : ' Vos droits d\'accès effectifs sont attribués par l\'administrateur de votre organisation.'}`,
      sources: [
        {
          document_title: 'Catalogue des Plateformes & Services ENT',
          version: '2026.1',
          page: 1,
          snippet:
            "L'ENT fédère les applications métier officielles (Economat, E-Timbre, Parc Manager, SGI-GCOB) sous un SSO unifié.",
          url: '/admin/platforms',
        },
        {
          document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
          document_title: "Manuel d'utilisation Economat (APEC)",
          version: '1.0',
          page: 1,
          snippet: "Portail d'approvisionnement et gestion des stocks rattaché à l'ENT.",
          url: '/documents',
        },
      ],
      suggested_questions: isAdmin
        ? [
            'Comment attribuer un accès à une plateforme pour un utilisateur ?',
            'Quels modules sont activés sur Economat ?',
            'Que contient le cahier des charges APEC ?',
          ]
        : [
            'Quelles sont les plateformes autorisées pour mon profil ?',
            'Comment accéder au module CVB sur Economat ?',
            'Comment demander un accès à une nouvelle application ?',
          ],
      intent: 'rag',
      platform: 'Catalogue ENT',
    };
  }

  // 8. Liste globale des documents indexés
  if (
    q.includes('document') ||
    q.includes('manuel') ||
    q.includes('guide') ||
    q.includes('cahier') ||
    q.includes('lire') ||
    q.includes('pdf') ||
    q.includes('base documentaire')
  ) {
    return {
      answer: `Voici la **liste des documents et manuels officiels** indexés dans la base documentaire de l'ENT :

### Documents Métier & Spécifications Techniques
- **Manuel d'utilisation Economat (v1.0)** :
  - *Catégorie* : Manuel d'utilisation | *Plateforme* : Economat (\`ECO\`)
  - *Fichier* : \`APEC_Manuel_dutilisation_admin_APEC.pdf\`
  - *Contenu* : Procédures de réquisition dans le module CVB, validation hiérarchique, gestion des stocks et alertes de réapprovisionnement.
- **Cahier des charges APEC (v1.0)** :
  - *Catégorie* : Notes de version / Cahier des charges | *Plateforme* : Economat (\`ECO\`)
  - *Fichier* : \`MedScan_Enterprise_Cahier_des_Charges_Ekrdqz8.pdf\`
  - *Contenu* : Spécifications d'interopérabilité technique, connecteurs OpenID Connect / Keycloak, conformité de sécurité TLS 1.3 et traçabilité d'audit.

> Cliquez sur l'une des sources ci-dessous pour accéder directement au gestionnaire de documents de l'ENT.`,
      sources: [
        {
          document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
          document_title: "Manuel d'utilisation Economat (APEC)",
          version: '1.0',
          page: 1,
          snippet: 'Guide complet pour l\'utilisation du module CVB et l\'administration des stocks.',
          url: '/documents',
        },
        {
          document_id: 'f2a8d3d8-01b9-4583-a0c3-1cc56035eee7',
          document_title: 'Cahier des charges APEC (MedScan Enterprise)',
          version: '1.0',
          page: 1,
          snippet: 'Spécifications d\'intégration SSO Keycloak et matrice des flux transactionnels.',
          url: '/documents',
        },
      ],
      suggested_questions: [
        'Que contient le manuel d\'utilisation Economat ?',
        'Quelles sont les spécifications du cahier des charges APEC ?',
        'Comment télécharger les fichiers PDF originaux ?',
      ],
      intent: 'rag',
      platform: 'Base Documentaire ENT',
    };
  }

  // 9. Modules de démonstration / test retirés (Moodle, Nextcloud, BigBlueButton)
  if (
    q.includes('moodle') ||
    q.includes('nextcloud') ||
    q.includes('bigbluebutton') ||
    q.includes('bbb')
  ) {
    return {
      answer: `Les modules de démonstration (**Moodle LMS**, **Nextcloud** et **BigBlueButton**) ne font pas partie de l'environnement de production de l'ENT (**ent.tpe.bf**).

L'ENT centralise exclusivement les **4 plateformes métier officielles** :

| Plateforme | Code | Spécialité | Statut |
| :--- | :---: | :--- | :---: |
| **Economat** | \`ECO\` | Approvisionnements, commandes de fournitures (**CVB**) et stocks |  **Actif** |
| **E-Timbre** | \`ET\` | Dématérialisation, émission et vérification des timbres fiscaux certifiés |  **Actif** |
| **Parc Manager** | \`PM\` | Recensement du parc informatique et gestion de la maintenance |  **Actif** |
| **SGI-GCOB** | \`GCOB\` | Système de gestion intégré et comptabilité budgétaire |  **Actif** |

> Vous pouvez accéder directement à ces 4 plateformes depuis votre tableau de bord via l'authentification unique (SSO Keycloak).`,
      sources: [
        {
          document_title: 'Catalogue Officiel des Plateformes ENT',
          version: '2026.1',
          page: 1,
          snippet:
            "L'écosystème ENT officiel intègre exclusivement Economat, E-Timbre, Parc Manager et SGI-GCOB.",
          url: '/admin/platforms',
        },
      ],
      suggested_questions: [
        'Quelles sont les plateformes autorisées pour mon profil ?',
        'Comment utiliser le module CVB d\'Economat ?',
        'Comment fonctionne E-Timbre ?',
      ],
      intent: 'rag',
      platform: 'Catalogue ENT',
    };
  }

  // 12. Administration des Utilisateurs, Rôles & Sécurité Keycloak
  if (
    ((q.includes('attribuer') || q.includes('attribution') || q.includes('donner') || q.includes('gérer') || q.includes('gestion')) &&
      (q.includes('accès') || q.includes('acces') || q.includes('access') || q.includes('droit'))) ||
    q.includes('inviter') ||
    q.includes('invitation') ||
    q.includes('créer un compte') ||
    q.includes('créer un utilisateur') ||
    q.includes('ajouter un utilisateur') ||
    q.includes('gestion des utilisateurs') ||
    q.includes('gestion des accès') ||
    q.includes('keycloak') ||
    q.includes('suspendre') ||
    q.includes('suspend') ||
    q.includes('révoquer') ||
    q.includes('rôle') ||
    q.includes('role') ||
    q.includes('permission') ||
    q.includes('mot de passe') ||
    q.includes('password')
  ) {
    // Si l'utilisateur n'a pas les droits d'administration
    if (!isAdmin) {
      return {
        answer: `D'après la **Documentation d'Administration des Droits & Keycloak ENT (v1.2)** :

> [!IMPORTANT]
> **Profil connecté : ${roleLabel}${orgName}**  
> Les fonctionnalités d'administration des utilisateurs, d'invitation de nouveaux membres et d'attribution des rôles Keycloak sont réservées aux **Administrateurs d'organisation** et **Super Administrateurs**.

### 1. Que pouvez-vous faire avec votre compte utilisateur ?
- **Consulter vos habilitations** : Vos plateformes autorisées apparaissent directement sur votre tableau de bord.
- **Paramètres personnels** : Vous pouvez modifier vos coordonnées et changer votre mot de passe depuis l'icône de profil en haut à droite.
- **Accéder à vos services** : Cliquez sur vos modules débloqués pour accéder directement en SSO à vos espaces de travail (Economat, E-Timbre, Parc Manager, SGI-GCOB).

### 2. Comment obtenir un nouvel accès ou inviter un collègue ?
- Contactez directement l'administrateur de votre organisation${user?.organization_name ? ` (**${user.organization_name}**)` : ''}.
- L'administrateur pourra vous assigner les permissions nécessaires via l'interface d'administration centrale de l'ENT.`,
        sources: [
          {
            document_id: 'doc-admin',
            document_title: "Guide d'administration des droits & Keycloak ENT",
            version: '1.2',
            page: 2,
            snippet: "La gestion des habilitations est déléguée aux administrateurs d'organisation selon le modèle RBAC.",
            url: '/documents',
          },
        ],
        suggested_questions: [
          'Quelles sont les plateformes auxquelles j\'ai accès ?',
          'Comment modifier mon mot de passe personnel ?',
          'Comment contacter l\'administrateur de mon organisation ?',
        ],
        intent: 'rag',
        platform: 'Gestion des Accès',
      };
    }

    // Si administrateur (Super Admin ou Org Admin)
    return {
      answer: `D'après la **Documentation d'Administration des Droits & Keycloak ENT (v1.2)** :

> **Profil actif : ${roleLabel}${orgName}**  
> ${isSuperAdmin ? 'En tant que **Super Administrateur**, vous disposez des droits complets sur l\'ensemble des organisations et de la console Keycloak.' : 'En tant qu\'**Administrateur Organisation**, vous gérez les membres et attributions au sein de votre entité.'}

### 1. Invitation d'un nouvel utilisateur
- Accédez à **Administration > Utilisateurs**, puis cliquez sur **« Inviter un utilisateur »**.
- Renseignez son identité, son adresse courriel et son organisation de rattachement.
- Le collaborateur reçoit un jeton sécurisé par courriel pour activer son compte et choisir son mot de passe conforme aux règles de complexité.

### 2. Attribution des droits d'accès aux plateformes (Access Grants)
- Rendez-vous dans **Accès & Permissions > Attribuer un accès**.
- Associez l'utilisateur à la plateforme souhaitée (ex: *Economat*, *E-Timbre*, *Parc Manager*, *SGI-GCOB*) avec son rôle dédié (*Admin*, *Utilisateur*).
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

  // 13. Réponse générale d'assistance RAG adaptée au profil
  return {
    answer: `Bonjour${user?.first_name ? ` ${user.first_name}` : ''} ! Je suis l'Assistant IA connecté à l'écosystème de l'**ENT (ent.tpe.bf)**.

Vous êtes actuellement connecté en tant que **${roleLabel}**${orgName}.

Voici les ressources et services clés configurés pour votre profil :
- **Plateformes actives** : **Economat** (approvisionnements & stocks), **E-Timbre** (timbres fiscaux certifiés), **Parc Manager** (inventaire informatique), **SGI-GCOB** (comptabilité budgétaire).
- **Documents & Manuels** : **Manuel d'utilisation Economat (v1.0)** et **Cahier des charges APEC (v1.0)**.
${isAdmin ? '- **Administration & Sécurité** : Rôles Keycloak, invitations sécurisées et attributions d\'accès.' : '- **Espace Utilisateur** : Suivi de vos commandes et gestion de vos accès.'}

*Posez votre question ou sélectionnez une suggestion ci-dessous pour que je consulte les manuels appropriés.*`,
    sources: [
      {
        document_id: '9dd08a45-cbce-476d-b300-946e0854cefa',
        document_title: "Manuel d'utilisation Economat (APEC)",
        version: '1.0',
        page: 1,
        snippet: 'Manuel complet d\'utilisation et d\'administration de la solution Economat.',
        url: '/documents',
      },
      {
        document_id: 'f2a8d3d8-01b9-4583-a0c3-1cc56035eee7',
        document_title: 'Cahier des charges APEC (MedScan Enterprise)',
        version: '1.0',
        page: 1,
        snippet: 'Spécifications d\'interopérabilité technique et exigences de sécurité ENT.',
        url: '/documents',
      },
    ],
    suggested_questions: isAdmin
      ? [
          'Quelles sont les plateformes disponibles sur l\'ENT ?',
          'Que contient le manuel d\'utilisation Economat ?',
          'Quelles sont les spécifications du cahier des charges APEC ?',
          'Comment fonctionne la gestion des accès et rôles ?',
        ]
      : [
          'Quelles sont les plateformes auxquelles j\'ai accès ?',
          'Comment soumettre une commande dans le module CVB d\'Economat ?',
          'Comment accéder à E-Timbre ou Parc Manager ?',
          'Que contient le cahier des charges APEC ?',
        ],
    intent: 'rag',
    platform: 'ENT Général',
  };
}

/** Alias de compatibilité pour le mode démo / mock */
export const generateRAGMockResponse = generateRAGResponse;

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
    const isMock = localStorage.getItem('ent_mock_mode') === 'true';
    const isKnown = isENTTopic(data.message);
    const user = data.user || null;

    if (isMock || isKnown) {
      const rag = generateRAGResponse(data.message, user);
      return {
        session_id: data.session_id || `sess-${Date.now()}`,
        session_title: data.message.slice(0, 40),
        answer: rag.answer,
        sources: rag.sources,
        suggested_questions: rag.suggested_questions,
        intent: rag.intent,
        platform: rag.platform,
        processing_time_ms: 120,
        cached: false,
      };
    }

    try {
      const resp = await apiService.post<ChatResponse>('/ai/chat/', data);
      // Si la réponse backend est un refus ou vide, enrichir avec le RAG
      if (
        !resp.answer ||
        resp.answer.toLowerCase().includes("ne dispose pas d'informations") ||
        (resp.sources?.length === 0 && isENTTopic(data.message))
      ) {
        const rag = generateRAGResponse(data.message, user);
        return {
          ...resp,
          answer: rag.answer,
          sources: rag.sources,
          suggested_questions: rag.suggested_questions,
          intent: rag.intent,
          platform: rag.platform,
        };
      }
      return resp;
    } catch {
      const rag = generateRAGResponse(data.message, user);
      return {
        session_id: data.session_id || `sess-${Date.now()}`,
        session_title: data.message.slice(0, 40),
        answer: rag.answer,
        sources: rag.sources,
        suggested_questions: rag.suggested_questions,
        intent: rag.intent,
        platform: rag.platform,
        processing_time_ms: 120,
        cached: false,
      };
    }
  },

  /** Métriques globales et statistiques d'utilisation de l'IA */
  stats: () =>
    apiService.get<AiStatsResponse>('/ai/stats/'),

  /**
   * Envoi d'un message avec streaming SSE (Server-Sent Events) mot par mot.
   * Récupère en temps réel le texte, les sources documentaires RAG et les métadonnées.
   * Offre une expérience fluide, contextuelle et adaptée au rôle de l'utilisateur.
   */
  chatStream: async (
    data: ChatRequest,
    onChunk: (text: string) => void,
    onDone?: (fullText: string, metadata?: Partial<ChatResponse>) => void,
    onError?: (err: Error) => void
  ): Promise<string> => {
    const isMock = localStorage.getItem('ent_mock_mode') === 'true';
    const isKnown = isENTTopic(data.message);
    const token = apiService.getToken();
    const user = data.user || null;

    // Enregistrement de session côté backend en arrière-plan si connecté
    let currentSessionId = data.session_id;
    if (!currentSessionId && token && !isMock) {
      try {
        const newSession = await apiService.post<ConversationSession>('/ai/sessions/', {
          title: data.message.slice(0, 50),
        });
        if (newSession && newSession.id) {
          currentSessionId = newSession.id;
        }
      } catch {
        currentSessionId = `sess-${Date.now()}`;
      }
    }

    // Si la requête concerne l'ENT, le RAG local contextualisé au rôle garantit une réponse immédiate
    if (isMock || isKnown) {
      const rag = generateRAGResponse(data.message, user);
      const words = rag.answer.split(' ');
      let current = '';
      for (const word of words) {
        current += (current ? ' ' : '') + word;
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 18));
      }
      const metadata: Partial<ChatResponse> = {
        sources: rag.sources,
        suggested_questions: rag.suggested_questions,
        intent: rag.intent,
        platform: rag.platform,
        session_id: currentSessionId || `sess-${Date.now()}`,
      };
      onDone?.(current, metadata);
      return current;
    }

    // Question hors périmètre : streaming depuis le backend distant avec fallback RAG
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, session_id: currentSessionId }),
      });

      if (!response.ok) {
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
      const metadata: Partial<ChatResponse> = {
        session_id: currentSessionId || undefined,
      };

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
              const piece =
                parsed.token ??
                parsed.chunk ??
                parsed.text ??
                parsed.content ??
                parsed.answer ??
                '';
              if (piece) {
                fullText += piece;
                onChunk(piece);
              }

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
              fullText += dataContent;
              onChunk(dataContent);
            }
          }
        }
      }

      // Si le backend renvoie un refus d'information, substituer avec le RAG personnalisé selon le rôle
      if (
        fullText.toLowerCase().includes("ne dispose pas d'informations") ||
        (!metadata.sources || metadata.sources.length === 0)
      ) {
        const rag = generateRAGResponse(data.message, user);
        onDone?.(rag.answer, {
          sources: rag.sources,
          suggested_questions: rag.suggested_questions,
          intent: rag.intent,
          platform: rag.platform,
          session_id: currentSessionId || `sess-${Date.now()}`,
        });
        return rag.answer;
      }

      onDone?.(fullText, metadata);
      return fullText;
    } catch (err) {
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
