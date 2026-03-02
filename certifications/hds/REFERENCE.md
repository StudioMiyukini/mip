# HDS — Hebergement de Donnees de Sante — Reference Victor

> Certification pour l'hebergement de donnees de sante a caractere personnel

**Organisme** : Organismes certificateurs accredites par le COFRAC (BSI, Bureau Veritas, LSTI, etc.)
**Base reglementaire** : Article L.1111-8 du Code de la sante publique, Decret n° 2018-137 du 26 fevrier 2018
**Obligation legale** : **OUI — OBLIGATOIRE** pour tout hebergeur de donnees de sante a caractere personnel
**Validite** : 3 ans (audit de suivi annuel a 18 mois)
**Prerequis** : **Certification ISO/IEC 27001:2022** (obligatoire, incluse dans le perimetre d'audit HDS)

---

## 1. Champ d'application

### Qui est concerne ?

Tout organisme qui heberge des **donnees de sante a caractere personnel** recueillies a l'occasion d'activites de prevention, diagnostic, soins ou suivi social et medico-social, pour le compte de personnes physiques ou morales a l'origine de la production ou du recueil de ces donnees, ou pour le compte du patient lui-meme.

**Exception** : L'organisme qui produit les donnees de sante et les heberge pour son propre compte n'est **pas** soumis a la certification HDS (ex : un medecin qui stocke les dossiers de ses patients sur son propre serveur).

### Les 6 activites certifiables

| Activite | Code | Description |
|----------|------|-------------|
| **Mise a disposition et maintien en condition operationnelle de l'infrastructure physique** | HDS-1 | Sites physiques, alimentation electrique, climatisation, securite physique |
| **Mise a disposition et maintien en condition operationnelle de l'infrastructure virtuelle** | HDS-2 | Hyperviseurs, machines virtuelles, stockage virtualise |
| **Mise a disposition et maintien en condition operationnelle de la plateforme d'hebergement** | HDS-3 | Systemes d'exploitation, middleware, bases de donnees |
| **Administration et exploitation du SI** | HDS-4 | Supervision, gestion des incidents, gestion des changements, MCO |
| **Sauvegarde externalisee** | HDS-5 | Sauvegarde des donnees de sante dans un site secondaire |
| **Mise a disposition d'un hebergement infogere** | HDS-6 | Hebergement applicatif, PaaS sante |

L'hebergeur doit se certifier sur **au moins une activite** et peut se certifier sur plusieurs.

---

## 2. Referentiel d'exigences

Le referentiel HDS repose sur **3 piliers** :

### Pilier 1 — Conformite ISO 27001:2022

Toutes les exigences ISO 27001 (clauses 4-10 + Annexe A) s'appliquent. Voir `REFERENCE.md` dans `iso-iec_27001/`.

### Pilier 2 — Exigences ISO 27001 renforcees pour la sante

| Ref | Exigence renforcee | Detail |
|-----|---------------------|--------|
| HDS-R1 | Perimeter de certification | Doit couvrir explicitement l'hebergement de donnees de sante |
| HDS-R2 | Analyse de risques specifique sante | Risques specifiques aux donnees de sante (confidentialite medicale, disponibilite pour les soins) |
| HDS-R3 | Gestion des incidents de securite sante | Procedures specifiques pour les incidents impactant des donnees de sante |
| HDS-R4 | Plan de continuite d'activite sante | PCA specifique pour la disponibilite des donnees de sante |
| HDS-R5 | Localisation des donnees | Les donnees de sante doivent etre hebergees dans l'UE (ou pays adequat RGPD) |
| HDS-R6 | Chiffrement des donnees de sante | Chiffrement au repos et en transit des donnees de sante |
| HDS-R7 | Gestion des acces | Controle d'acces strict aux donnees de sante, tracabilite des acces |
| HDS-R8 | Journalisation | Journalisation detaillee de tous les acces aux donnees de sante |
| HDS-R9 | Separation des environnements | Isolation des environnements contenant des donnees de sante |
| HDS-R10 | Reversibilite | Procedures de reversibilite des donnees de sante en fin de contrat |

### Pilier 3 — Exigences specifiques HDS

| Ref | Exigence | Detail |
|-----|----------|--------|
| HDS-S1 | Convention d'hebergement | Contrat formalise entre l'hebergeur et le deposant (Article R.1111-9 CSP) |
| HDS-S2 | Contenu de la convention | Description de la prestation, engagements de niveau de service (SLA), localisation des donnees, politique de securite, procedures de reversibilite, modalites d'acces, description du SI |
| HDS-S3 | Information du patient | Le deposant doit informer le patient de l'hebergement par un tiers |
| HDS-S4 | Restitution ou destruction | En fin de contrat, restitution des donnees au deposant puis destruction securisee |
| HDS-S5 | Acces aux donnees | L'hebergeur ne peut acceder aux donnees de sante que pour les besoins techniques de l'hebergement |
| HDS-S6 | Secret professionnel | Les personnels de l'hebergeur sont soumis au secret professionnel (Article L.1110-4 CSP) |
| HDS-S7 | Sous-traitance | L'hebergeur doit identifier ses sous-traitants et s'assurer qu'ils respectent les memes exigences |
| HDS-S8 | Notification d'incident | Notification au deposant et a l'ARS de tout incident grave de securite impactant les donnees de sante |

---

## 3. Exigences ISO 20000-1 (complementaire)

Pour les activites HDS-4, HDS-5 et HDS-6, des exigences issues de **ISO/IEC 20000-1** sont ajoutees :

| Domaine | Exigences |
|---------|-----------|
| Gestion des niveaux de service | SLA definis, mesures, reporting |
| Gestion de la capacite | Planification des ressources |
| Gestion de la disponibilite | Objectifs de disponibilite, mesures |
| Gestion des incidents | Procedures de gestion, escalade, resolution |
| Gestion des problemes | Analyse des causes racines, actions preventives |
| Gestion des changements | Processus formalise de gestion des changements |
| Gestion des mises en production | Procedures de deploiement controlees |
| Gestion de la continuite de service | PCA/PRA testes regulierement |

---

## 4. Processus de certification HDS

1. **Preparation** — Mise en conformite ISO 27001 + exigences HDS (6-18 mois)
2. **Choix de l'organisme certificateur** — Accredite COFRAC pour le referentiel HDS
3. **Audit initial — Phase 1** — Revue documentaire : SMSI, convention hebergement, politique securite sante, PCA
4. **Audit initial — Phase 2** — Audit sur site : verification technique, entretiens, preuves de mise en oeuvre
5. **Decision de certification** — Par l'organisme certificateur (activites certifiees specifiees)
6. **Audit de suivi** — A 18 mois
7. **Audit de renouvellement** — Tous les 3 ans

### Cout indicatif

- **PME (1 site, 1-2 activites)** : 15 000 - 30 000 EUR (audit seul)
- **ETI (multi-sites)** : 30 000 - 80 000 EUR
- **Grand compte** : 80 000 - 200 000 EUR

---

## 5. Sanctions

| Infraction | Sanction |
|------------|---------|
| Hebergement de donnees de sante sans certification HDS | 3 ans d'emprisonnement + 45 000 EUR d'amende (Art. L.1115-1 CSP) |
| Non-respect des conditions d'hebergement | Retrait de la certification + sanctions CNIL (RGPD) |
| Violation du secret medical | 1 an d'emprisonnement + 15 000 EUR d'amende (Art. 226-13 Code penal) |

---

## 6. Non-conformites courantes

1. **Convention d'hebergement absente ou incomplete** (pas de SLA, pas de localisation)
2. **Analyse de risques generique** (pas specifique aux donnees de sante)
3. **Pas de PCA/PRA teste** pour les services de sante
4. **Donnees de sante hebergees hors UE** sans garanties adequates
5. **Chiffrement insuffisant** (pas de chiffrement au repos, cles mal gerees)
6. **Tracabilite des acces insuffisante** (pas de journalisation detaillee)
7. **Sous-traitants non identifies** ou non soumis aux memes exigences
8. **Personnel sans habilitation** accedant aux donnees de sante
9. **Pas de procedure de reversibilite** documentee et testee
10. **Notification d'incident non testee** (pas d'exercice de crise)

---

## 7. Checklist Victor — Audit HDS

### Prerequis
- [ ] Certification ISO 27001 valide sur le perimetre de l'hebergement de sante
- [ ] Perimetre HDS clairement defini (activites 1-6)

### Convention et contrat
- [ ] Convention d'hebergement signee avec chaque deposant
- [ ] SLA definis (disponibilite, temps de retablissement, support)
- [ ] Localisation des donnees documentee (sites physiques dans l'UE)
- [ ] Procedures de reversibilite documentees et testees

### Securite renforcee
- [ ] Analyse de risques specifique sante realisee
- [ ] Chiffrement au repos des donnees de sante
- [ ] Chiffrement en transit (TLS 1.2+)
- [ ] Controle d'acces strict (besoin d'en connaitre medical)
- [ ] Journalisation detaillee de tous les acces aux donnees de sante
- [ ] Separation des environnements sante / hors-sante

### Continuite et incidents
- [ ] PCA/PRA specifique sante documente et teste
- [ ] Procedure de gestion des incidents sante (notification ARS)
- [ ] Exercice de crise realise (annuel)

### Sous-traitance
- [ ] Sous-traitants identifies et contractualises
- [ ] Verification des garanties sous-traitants
- [ ] Clause d'audit dans les contrats sous-traitants

### Personnel
- [ ] Habilitation du personnel accedant aux donnees de sante
- [ ] Engagement de confidentialite / secret professionnel signe
- [ ] Formation securite sante realisee

---

## 8. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **Declencheur HDS** | Si MiyuCloud ou un service Miyukini heberge des donnees de sante pour un tiers → HDS obligatoire |
| **MiyukiniWatch** | Si surveillance de parametres de sante → donnees de sante → potentiellement HDS |
| **Alicia** | Si gestion de prises de medicaments, rappels medicaux → donnees de sante |
| **MiyuCloud** | Si stocke des dossiers medicaux ou resultats d'analyses → HDS obligatoire |
| **Architecture** | LOI-1 (pas de dependance externe) et LOI-3 (etat local souverain) sont compatibles avec HDS si les donnees restent dans l'UE |
| **Chiffrement** | ChaCha20-Poly1305 + Argon2id + X25519 de MiyuCloud repondent aux exigences HDS de chiffrement |
| **Auto-hebergement** | Si l'utilisateur heberge ses propres donnees → exception HDS (pas d'hebergeur tiers) |

---

*Sources : Code de la sante publique Art. L.1111-8, Decret 2018-137, referentiel HDS ASIP Sante/ANS, ISO 27001:2022, ISO 20000-1:2018*
