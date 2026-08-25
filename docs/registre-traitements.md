<!-- @id mip.doc.registre
     @do formaliser_le_registre_des_traitements_rgpd_art_30
     @role rule
     @layer doc
     @human Le registre des traitements — RGPD article 30 -->

# Registre des traitements

*Dernière mise à jour : 25 août 2026.*

Ce document formalise, au sens de l'**article 30 du RGPD**, ce que la
[politique de confidentialité](../CONFIDENTIALITE.md) énonce déjà en prose. Il
tient sur une page parce que le service collecte peu.

## Responsable de traitement

**NGUYEN « Miyukini » Van Jean**, personne physique, à titre non professionnel —
[miyukini@gmail.com](mailto:miyukini@gmail.com). Pas de délégué à la protection
des données (traitement d'ampleur limitée, hors des cas de désignation
obligatoire de l'article 37).

## Les traitements

### 1 — Comptes

| | |
| --- | --- |
| **Finalité** | permettre de retrouver ses cadrages d'une visite à l'autre |
| **Base légale** | exécution du contrat formé à la création du compte (art. 6.1.b) |
| **Personnes** | les utilisateurs qui choisissent de créer un compte |
| **Données** | adresse électronique, empreinte Argon2id du mot de passe, date de création, date de dernière connexion |
| **Destinataires** | aucun — les données ne quittent pas la machine |
| **Conservation** | jusqu'à suppression par la personne, ou 24 mois sans connexion |
| **Sécurité** | Argon2id + sel par compte, HTTPS, en-têtes de sécurité, appartenance vérifiée en base |

### 2 — Cadrages

| | |
| --- | --- |
| **Finalité** | conserver le travail de la personne connectée |
| **Base légale** | exécution du contrat (art. 6.1.b) |
| **Personnes** | les utilisateurs disposant d'un compte |
| **Données** | le contenu des cadrages (titre, réponses, prompt produit) |
| **Destinataires** | aucun — jamais lus, analysés, partagés, ni utilisés pour entraîner un modèle |
| **Conservation** | supprimés avec le compte (cascade) |
| **Sécurité** | appartenance vérifiée dans la requête SQL, aucun partage possible |

### 3 — Limitation de cadence

| | |
| --- | --- |
| **Finalité** | protéger un service partagé (suggestions, création de compte, connexion) |
| **Base légale** | intérêt légitime (art. 6.1.f) |
| **Personnes** | tout appelant des routes concernées |
| **Données** | adresse IP, en mémoire vive uniquement |
| **Destinataires** | aucun |
| **Conservation** | la fenêtre glissante (10 min à 1 h), puis effacement automatique — jamais écrite sur disque |

### 4 — Session

| | |
| --- | --- |
| **Finalité** | garder la personne connectée d'une page à l'autre |
| **Base légale** | strictement nécessaire au service demandé (dispense de consentement) |
| **Personnes** | les utilisateurs connectés |
| **Données** | un cookie de session (`HttpOnly`, `SameSite=Lax`, `Secure`) |
| **Destinataires** | aucun |
| **Conservation** | à la déconnexion, ou 30 jours |

## Ce qui n'existe pas

Pas de mesure d'audience, pas de traceur, pas de profilage, pas de décision
automatisée (art. 22), aucun transfert hors Union européenne, aucune donnée
sensible (art. 9). Une **analyse d'impact (DPIA, art. 35) n'est pas requise** :
le traitement ne présente pas de risque élevé au sens de l'article.

## Sous-traitants et intermédiaires

- **Cloudflare, Inc.** — intermédiaire technique de transport (tunnel). N'a
  accès ni aux comptes ni aux cadrages : ceux-ci ne quittent pas la machine
  française.
- **Modèle de langage local** — les suggestions de pré-remplissage sont
  produites sur la machine hôte. Aucun texte n'est envoyé à un service tiers.
