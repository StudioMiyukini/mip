<!-- @id cert.victor.hds -->
<!-- @do provide_hds_reference_knowledge -->
<!-- @role health_data_security -->
<!-- @layer reference -->
<!-- @human Referentiel HDS pour Victor -->

# HDS — Hebergement de Donnees de Sante — Reference Victor

**TL;DR** : Certification **obligatoire** pour tout hebergeur de donnees de sante pour compte de tiers. 3 piliers : ISO 27001 + renforcements sante + exigences specifiques HDS. 6 activites certifiables. Prerequis ISO 27001. Validite 3 ans.

**Organisme** : COFRAC (BSI, Bureau Veritas, LSTI) | **Base** : Art. L.1111-8 CSP, Decret 2018-137
**Obligation** : **OBLIGATOIRE** | **Validite** : 3 ans (suivi a 18 mois) | **Prerequis** : **ISO 27001**

---

## 1. Champ d'application

Tout organisme hebergeant des **donnees de sante a caractere personnel** pour le compte de tiers (prevention, diagnostic, soins, suivi). **Exception** : organisme qui heberge ses propres donnees (ex: medecin sur son serveur).

### 6 activites certifiables

| Code | Activite |
|------|----------|
| HDS-1 | Infrastructure physique (sites, alimentation, climatisation, securite physique) |
| HDS-2 | Infrastructure virtuelle (hyperviseurs, VMs, stockage virtualise) |
| HDS-3 | Plateforme d'hebergement (OS, middleware, BDD) |
| HDS-4 | Administration et exploitation SI |
| HDS-5 | Sauvegarde externalisee |
| HDS-6 | Hebergement infogere (applicatif, PaaS sante) |

---

## 2. Referentiel d'exigences (3 piliers)

### Pilier 1 — ISO 27001 complete

Toutes les clauses 4-10 + Annexe A. Voir `iso-iec_27001/REFERENCE.md`.

### Pilier 2 — Renforcements sante (HDS-R1 a R10)

| Ref | Exigence |
|-----|----------|
| R1 | Perimetre couvre explicitement l'hebergement sante |
| R2 | Analyse risques specifique sante (confidentialite medicale, disponibilite soins) |
| R3 | Gestion incidents specifique sante |
| R4 | PCA specifique disponibilite donnees sante |
| R5 | Donnees hebergees dans l'UE (ou pays adequat RGPD) |
| R6 | Chiffrement au repos et en transit |
| R7 | Controle d'acces strict + tracabilite |
| R8 | Journalisation detaillee de tous les acces |
| R9 | Separation environnements sante / hors-sante |
| R10 | Procedures de reversibilite |

### Pilier 3 — Exigences specifiques (HDS-S1 a S8)

| Ref | Exigence |
|-----|----------|
| S1 | Convention d'hebergement formalisee (Art. R.1111-9 CSP) |
| S2 | Contenu convention (SLA, localisation, securite, reversibilite, acces, description SI) |
| S3 | Information du patient par le deposant |
| S4 | Restitution ou destruction en fin de contrat |
| S5 | Acces aux donnees = besoins techniques uniquement |
| S6 | Personnel soumis au secret professionnel (Art. L.1110-4 CSP) |
| S7 | Sous-traitants identifies et conformes |
| S8 | Notification incidents graves au deposant et ARS |

### Complement ISO 20000-1 (activites HDS-4/5/6)

SLA, capacite, disponibilite, incidents, problemes, changements, mises en production, continuite de service.

---

## 3. Certification

| Etape | Description |
|-------|-------------|
| 1 | Preparation (ISO 27001 + HDS, 6-18 mois) |
| 2 | Choix organisme (accredite COFRAC pour HDS) |
| 3 | Audit Phase 1 (documentaire) |
| 4 | Audit Phase 2 (sur site, verification technique) |
| 5 | Decision (activites certifiees specifiees) |
| 6 | Suivi a 18 mois |
| 7 | Renouvellement 3 ans |

**Cout** : PME 15-30k EUR | ETI 30-80k EUR | Grand compte 80-200k EUR

---

## 4. Sanctions

| Infraction | Sanction |
|------------|---------|
| Hebergement sante sans HDS | 3 ans prison + 45k EUR (Art. L.1115-1 CSP) |
| Non-respect conditions | Retrait certification + sanctions CNIL |
| Violation secret medical | 1 an prison + 15k EUR (Art. 226-13 CP) |

---

## 5. Non-conformites courantes

Convention absente/incomplete, analyse risques generique (pas specifique sante), PCA/PRA non teste, donnees hors UE sans garanties, chiffrement insuffisant, tracabilite acces insuffisante, sous-traitants non identifies, personnel sans habilitation, reversibilite non documentee/testee, notification incident non testee.

---

## 6. Checklist Victor

**Prerequis** : [ ] ISO 27001 valide [ ] Perimetre HDS defini (activites 1-6)
**Convention** : [ ] Signee par deposant [ ] SLA definis [ ] Localisation documentee (UE) [ ] Reversibilite testee
**Securite** : [ ] Analyse risques sante [ ] Chiffrement repos + transit (TLS 1.2+) [ ] Acces strict [ ] Journalisation tous acces [ ] Separation envs sante/hors-sante
**Continuite** : [ ] PCA/PRA sante teste [ ] Gestion incidents sante (notification ARS) [ ] Exercice crise annuel
**Sous-traitance** : [ ] Identifies et contractualises [ ] Garanties verifiees [ ] Clause audit
**Personnel** : [ ] Habilitation [ ] Engagement confidentialite/secret [ ] Formation securite sante

---

## 7. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Declencheur | MiyuCloud/service hebergeant donnees sante pour tiers -> HDS obligatoire |
| MiyukiniWatch | Parametres sante -> donnees sante -> potentiellement HDS |
| Alicia | Prises medicaments, rappels medicaux -> donnees sante |
| MiyuCloud | Dossiers medicaux/analyses -> HDS obligatoire |
| Architecture | LOI-1 + LOI-3 compatibles HDS si donnees restent UE |
| Chiffrement | ChaCha20-Poly1305 + Argon2id + X25519 conformes exigences HDS |
| Auto-hebergement | Utilisateur hebergeant ses propres donnees -> exception HDS |

---

*Sources : CSP Art. L.1111-8, Decret 2018-137, referentiel HDS ANS, ISO 27001:2022, ISO 20000-1:2018*
