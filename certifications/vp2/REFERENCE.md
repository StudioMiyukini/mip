<!-- @id cert.victor.vp2 -->
<!-- @do provide_vp2_reference_knowledge -->
<!-- @role data_protection -->
<!-- @layer reference -->
<!-- @human Referentiel Evaluation VP2 pour Victor -->

# Evaluation VP2 — Reference Victor

**TL;DR** : Evaluation AFNOR de maturite RGPD (vie privee niveau 2). 8 domaines d'exigences couvrant gouvernance, registre, droits, AIPD, securite, violations, privacy by design, transferts internationaux. Validite 3 ans, suivi annuel.

**Organisme** : AFNOR Certification | **Referentiel** : NF Z74-501 | **Base** : RGPD (UE) 2016/679 + Loi 78-17
**Obligation** : RGPD obligatoire, VP2 volontaire (demontre conformite) | **Validite** : 3 ans (suivi annuel)

---

## 1. Principes RGPD (Article 5)

| Principe | Description |
|----------|-------------|
| Liceite, loyaute, transparence | Base legale, informations claires |
| Limitation finalites | Determinees, explicites, legitimes |
| Minimisation | Adequates, pertinentes, limitees au necessaire |
| Exactitude | Tenues a jour, rectifiees si inexactes |
| Limitation conservation | Duree n'excedant pas le necessaire |
| Integrite et confidentialite | Securite appropriee |
| Responsabilite (accountability) | RT demontre la conformite |

**Bases legales (Art. 6)** : Consentement, execution contrat, obligation legale, interets vitaux, interet public, interets legitimes.

---

## 2. Exigences VP2 par domaine

### D1 — Gouvernance (VP2-1.1 a 1.8)

DPO designe, politique documentee et approuvee, organigramme, budget dedie, integration dans les decisions, revue direction, formation personnel, gestion sous-traitants.

### D2 — Registre et cartographie (VP2-2.1 a 2.6)

Registre Art. 30 (finalite, categories donnees/personnes, destinataires, transferts, durees, securite), cartographie flux, bases legales, registre sous-traitant, MAJ annuelle minimum.

### D3 — Droits des personnes (VP2-3.1 a 3.12)

| Droit | Article | Detail |
|-------|---------|--------|
| Information | 13-14 | Identite RT, finalites, bases, destinataires, durees, droits, transferts |
| Acces | 15 | Procedure documentee |
| Rectification | 16 | Procedure documentee |
| Effacement | 17 | Droit a l'oubli |
| Limitation | 18 | Procedure documentee |
| Notification | 19 | Aux destinataires apres rectification/effacement/limitation |
| Portabilite | 20 | Format structure, lisible machine |
| Opposition | 21 | Y compris profilage |
| Decisions automatisees | 22 | Profilage |

Delai : 1 mois max (extensible 3 mois). Verification identite. Gratuite (sauf abus).

### D4 — AIPD (VP2-4.1 a 4.7)

Criteres declencheurs : profilage avec effets juridiques, traitement grande echelle donnees sensibles, surveillance systematique, listes CNIL. Contenu : description, necessite/proportionnalite, risques, mesures. Consultation CNIL si risque residuel eleve. Avis DPO. Revision si changement significatif.

### D5 — Securite (VP2-5.1 a 5.8)

Mesures techniques/organisationnelles (Art. 32), pseudonymisation/chiffrement, CIA + resilience, retablissement disponibilite, tests reguliers, evaluation adaptee au risque, controle equipements, RBAC.

### D6 — Violations (VP2-6.1 a 6.6)

Detection/qualification, notification CNIL 72h (Art. 33 : nature, categories, nombre, DPO, consequences, mesures), communication personnes si risque eleve (Art. 34), registre violations (Art. 33.5), analyse post-incident.

### D7 — Privacy by design/default (VP2-7.1 a 7.4)

Conception (Art. 25.1 : pseudonymisation, minimisation), par defaut (Art. 25.2 : seules donnees necessaires), integration cycle dev, revue avant mise en production.

### D8 — Transferts internationaux (VP2-8.1 a 8.5)

Identification transferts hors EEE, decision adequation (Art. 45), CCT/BCR/codes/certifications (Art. 46-47), derogations (Art. 49), TIA.

---

## 3. Processus d'evaluation

| Etape | Description |
|-------|-------------|
| 1 | Candidature AFNOR |
| 2 | Auto-evaluation documentee |
| 3 | Audit documentaire |
| 4 | Audit sur site |
| 5 | Rapport (conformites/NC) |
| 6 | Decision attribution VP2 |
| 7 | Suivi annuel |
| 8 | Renouvellement 3 ans |

---

## 4. Sanctions RGPD

| Niveau | Montant max | Infractions |
|--------|-------------|-------------|
| 1 | 10M EUR / 2% CA | Obligations RT/sous-traitant, organisme certification |
| 2 | 20M EUR / 4% CA | Principes, droits personnes, transferts, non-respect injonction |

---

## 5. Non-conformites courantes

Registre absent/incomplet (80%), information personnes insuffisante, pas de procedure droits, durees conservation non definies, sous-traitants sans clauses DCP, consentement non conforme (pre-coche), pas d'AIPD requise, securite insuffisante (mdp faibles, pas de chiffrement), pas de procedure violations, cookies non conformes.

---

## 6. Checklist Victor

**Gouvernance** : [ ] DPO designe [ ] Politique documentee [ ] Formation personnel [ ] Revue direction RGPD
**Registre** : [ ] Registre complet Art. 30 [ ] Bases legales identifiees [ ] Durees conservation definies [ ] Cartographie flux
**Droits** : [ ] Procedures documentees [ ] Information transparente [ ] Delai 1 mois [ ] Portabilite
**AIPD** : [ ] Criteres connus [ ] AIPD realisees [ ] Consultation DPO
**Securite** : [ ] Mesures techniques (chiffrement, acces) [ ] Tests reguliers [ ] RBAC
**Violations** : [ ] Procedure detection/notification [ ] Registre violations [ ] Notification CNIL 72h testee
**Sous-traitants** : [ ] Contrats Art. 28 [ ] Garanties verifiees [ ] Transferts EEE encadres

---

## 7. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Registre | MiyuCloud, MiyukiniWatch, Alicia gerent des DCP |
| Minimisation | Ne collecter que le necessaire par service |
| Chiffrement | MiyuCloud : ChaCha20-Poly1305, X25519 E2E |
| Droits | API export (portabilite), suppression compte, acces donnees |
| Privacy by design | LOI-1 + LOI-3 alignes privacy by design |
| Violations | Procedure notification a documenter par service manipulant DCP |
| AIPD | Requise pour MiyuCloud (stockage grande echelle) et MiyukiniWatch (surveillance) |

---

*Sources : RGPD (UE) 2016/679, Loi 78-17, referentiel AFNOR VP2, guides CNIL*
