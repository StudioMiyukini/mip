<!-- @id cert.victor.cissp -->
<!-- @do provide_cissp_reference_knowledge -->
<!-- @role security_governance -->
<!-- @layer reference -->
<!-- @human Referentiel CISSP pour Victor -->

# CISSP — Referentiel Victor

> **TL;DR** : Certification elite en securite (ISC)2, couvrant 8 domaines de gouvernance et d'architecture securite.
> Pour Victor : cadre de reference principal pour audits securite, risk assessment et conformite Miyukini.
> Impact : structure les decisions de securite de P0 (threat modeling) a P4 (audit /100).

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | (ISC)2 — International Information System Security Certification Consortium |
| Obligation | Recommande pour roles gouvernance securite, exige dans contextes reglementaires |
| Validite | 3 ans, renouvellement par CPE (40 credits/an, 120 total) |
| Prerequis | 5 ans experience dans 2+ domaines (ou 4 ans + diplome) |

## Domaine d'application

Gouvernance globale de la securite des systemes d'information : de la strategie de risque au developpement securise, en passant par l'architecture, les reseaux, l'IAM, les tests et les operations.

## Exigences cles — 8 domaines

| Ref | Domaine | Points critiques |
|-----|---------|-----------------|
| D1 | Security & Risk Management | Cadres risque (NIST, ISO 27005), politiques, ethique, conformite legale, BIA |
| D2 | Asset Security | Classification donnees, retention, privacy, responsabilite proprietaire |
| D3 | Security Architecture & Engineering | Modeles (Bell-LaPadula, Biba, Clark-Wilson), crypto, defense en profondeur |
| D4 | Communication & Network Security | OSI/TCP-IP, segmentation, firewalls, VPN, protocoles securises |
| D5 | Identity & Access Management | AAA, RBAC/ABAC, federation, MFA, gestion identites, moindre privilege |
| D6 | Security Assessment & Testing | Pentests, scans vulnerabilites, audits, log review, KPI securite |
| D7 | Security Operations | Incident response, forensics, DRP/BCP, SIEM, change management |
| D8 | Software Development Security | SDLC securise, OWASP, code review, tests securite, DevSecOps |

## Modeles de securite

| Modele | Propriete | Usage |
|--------|-----------|-------|
| Bell-LaPadula | Confidentialite (no read up, no write down) | Systemes classifies |
| Biba | Integrite (no read down, no write up) | Integrite donnees critiques |
| Clark-Wilson | Integrite transactionnelle (CDI, TP, IVP) | Applications commerciales |
| Brewer-Nash (Chinese Wall) | Separation conflits d'interet | Contextes financiers |

## Cadres de gestion du risque

| Cadre | Focus | Application |
|-------|-------|-------------|
| NIST SP 800-37 (RMF) | Cycle risque federal | Structure analyse risque |
| ISO 27005 | Risque SI | Complement ISO 27001 |
| FAIR | Risque quantitatif | Justification budgetaire |
| OCTAVE | Risque organisationnel | Auto-evaluation equipe |

## BCP/DRP — Continuite et reprise

| Element | Objectif | Metrique |
|---------|----------|----------|
| BIA (Business Impact Analysis) | Identifier processus critiques | RTO, RPO par service |
| Plan de continuite (BCP) | Maintien operations minimales | Temps de basculement |
| Plan de reprise (DRP) | Restauration apres sinistre | Delai de restauration |
| Tests reguliers | Valider les plans | Frequence, taux de reussite |

## Checklist Victor

- [ ] **P1** Definir cadre risk assessment (NIST RMF ou ISO 27005) pour le projet
- [ ] **P1** Classifier actifs (donnees, services, cles) selon sensibilite
- [ ] **P1** Implementer modele acces (RBAC minimum, ABAC si multi-tenant)
- [ ] **P2** Valider architecture reseau (segmentation, TLS, ports exposes)
- [ ] **P2** Etablir plan de tests securite (pentest scope, outils, frequence)
- [ ] **P2** Rediger plan incident response (detection, containment, recovery)
- [ ] **P3** Integrer securite dans SDLC (code review, SAST, dependency audit)
- [ ] **P3** Documenter BCP/DRP (backup, restore, RTO/RPO)
- [ ] **P3** Verifier conformite legale (RGPD, retention donnees, consentement)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Securite ajoutee en fin de projet | Integrer des P0 (threat modeling) |
| Risques non quantifies | Utiliser FAIR ou matrice impact/probabilite |
| Acces root/admin partout | Moindre privilege + separation des devoirs |
| Pas de plan incident | Rediger IRP avant la mise en production |
| Crypto maison | Utiliser primitives eprouvees (ChaCha20, AES-GCM, Argon2) |
| Logs insuffisants | Journaliser auth, acces donnees, erreurs, admin ops |

## Application Miyukini

| Domaine CISSP | Composant Miyukini | Implementation |
|---------------|-------------------|----------------|
| D1 Risk Mgmt | `.mip/audits/` | Score securite /100 en P4 |
| D2 Asset Security | MiyuCloud crypto | ChaCha20-Poly1305 at-rest, classification donnees |
| D3 Architecture | LOI-1 a LOI-8 | Defense en profondeur, isolation, zero trust local |
| D4 Network | MiyuCloud P2P | TLS, X25519 E2E, segmentation API/web |
| D5 IAM | Auth services | Argon2id + HKDF, canary passphrase, RBAC |
| D6 Assessment | Victor P3/P4 | Spot-checks, grep patterns, audit deps |
| D7 Operations | Central services | Incident response, backup KindMother |
| D8 Software Dev | MIP v2 TDD | SDLC securise, code review, 0 unsafe |
