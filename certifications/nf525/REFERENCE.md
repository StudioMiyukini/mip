# NF525 — Logiciel de Gestion d'Encaissement — Reference Victor

> Certification des logiciels de caisse et systemes d'encaissement

**Organisme** : INFOCERT / LNE (Laboratoire National de Metrologie et d'Essais) / AFNOR Certification
**Base legale** : Article 286 bis du Code General des Impots (CGI)
**Loi fondatrice** : Article 88 de la Loi de Finances 2016 (n° 2015-1785)
**Validite** : Continue (re-certification a chaque version majeure)
**Obligation legale** : **OUI — OBLIGATOIRE** depuis le 1er janvier 2018 pour tout logiciel de caisse
**Prerequis** : Aucun
**Evolution 2026** : Article 125 LdF 2026 reintroduit l'option d'auto-certification

---

## 1. Champ d'application

### Qui est concerne ?

Tout assujetti a la TVA qui enregistre les paiements de ses clients au moyen d'un **logiciel ou systeme de caisse** doit utiliser un logiciel satisfaisant aux conditions d'**inalterabilite, de securisation, de conservation et d'archivage** (conditions ISCA).

### Exemptions

- Micro-entrepreneurs en dessous du seuil de TVA (sous certaines conditions)
- Organismes exoneres de TVA
- Entreprises qui n'utilisent pas de logiciel de caisse (facturation manuelle)

### Preuve de conformite (2 options)

1. **Certification NF525** par INFOCERT ou certification LNE
2. **Attestation individuelle de l'editeur** (auto-certification, reintroduite Art. 125 LdF 2026)

---

## 2. Les 4 conditions ISCA

### Condition 1 — Inalterabilite

> Les donnees de reglement enregistrees ne peuvent etre alterees, supprimees ou masquees.

| Ref | Exigence | Detail |
|-----|----------|--------|
| INAL-01 | Interdiction de modification | Aucune modification ou suppression de transaction enregistree sans trace |
| INAL-02 | Corrections par ecriture nouvelle | Toute correction genere une nouvelle ecriture avec reference a l'originale |
| INAL-03 | Annulations tracees | Les annulations sont enregistrees comme nouvelles operations |
| INAL-04 | Numerotation sequentielle | Numerotation continue et ininterrompue des transactions |
| INAL-05 | Chaine cryptographique | Chainage par empreinte cryptographique de chaque transaction |
| INAL-06 | Tickets numerotes | Chaque ticket porte un numero unique sequentiel |
| INAL-07 | Grand Total (GT) cumulatif | GT irreversible et non reinitilisable |
| INAL-08 | Compteurs perpetuels | Compteurs cumulatifs non remis a zero |
| INAL-09 | Pas de fonction de dissimulation | Aucune fonction permettant de cacher ou supprimer des donnees de paiement |
| INAL-10 | Journal technique | Journal enregistrant tous les evenements systeme |

### Condition 2 — Securisation

> Les donnees sont securisees par des mecanismes cryptographiques garantissant leur integrite.

| Ref | Exigence | Detail |
|-----|----------|--------|
| SECU-01 | Signature/empreinte par transaction | Signature electronique ou hash cryptographique sur chaque transaction |
| SECU-02 | Chainage des signatures | Chaque signature inclut le hash de la transaction precedente |
| SECU-03 | Verification d'integrite | Fonction de verification a tout moment |
| SECU-04 | Protection du code source | Protection contre la modification non autorisee du code |
| SECU-05 | Authentification des utilisateurs | Identification et authentification avant utilisation |
| SECU-06 | Gestion des roles | Roles differencies (administrateur, caissier, manager) |
| SECU-07 | Protection du journal technique | Journal non modifiable et non supprimable |
| SECU-08 | Protection des cles cryptographiques | Stockage securise des cles |
| SECU-09 | Absence de porte derobee | Pas de backdoor ni de fonction cachee pour alterer les donnees |

### Condition 3 — Conservation

> Les donnees sont conservees de facon perenne et accessible pendant la duree legale.

| Ref | Exigence | Detail |
|-----|----------|--------|
| CONS-01 | Conservation 6 exercices fiscaux minimum | Toutes les donnees transactionnelles conservees |
| CONS-02 | 7 ans si exercice non calendaire | Extension si l'exercice fiscal ne coincide pas avec l'annee civile |
| CONS-03 | Accessibilite et lisibilite | Donnees consultables et lisibles pendant toute la duree |
| CONS-04 | Format structure | Donnees exploitables par l'administration fiscale |
| CONS-05 | **Cloture journaliere** (Ticket Z) | Obligatoire en fin de journee |
| CONS-06 | **Cloture mensuelle** | Obligatoire en fin de mois |
| CONS-07 | **Cloture annuelle** | Obligatoire en fin d'exercice |
| CONS-08 | Gel des donnees | La cloture fige toutes les donnees de la periode |
| CONS-09 | Cumuls par cloture | Chaque cloture genere des totaux cumulatifs |
| CONS-10 | Conservation des donnees brutes | Pas seulement les agrégats, mais les donnees detaillees |

### Condition 4 — Archivage

> Les donnees sont archivees de facon periodique, horodatee et integre.

| Ref | Exigence | Detail |
|-----|----------|--------|
| ARCH-01 | Archivage automatique periodique | Journalier, mensuel, annuel |
| ARCH-02 | Horodatage des archives | Chaque archive est horodatee |
| ARCH-03 | Integrite des archives | Hash de verification sur chaque archive |
| ARCH-04 | Format lisible et structure | Archive dans un format exploitable |
| ARCH-05 | Fonction d'export | Export a destination de l'administration fiscale |
| ARCH-06 | Transactions originales incluses | L'archive contient toutes les transactions d'origine |
| ARCH-07 | Clotures incluses | L'archive contient tous les tickets Z |
| ARCH-08 | Journal technique inclus | L'archive contient le journal des evenements systeme |
| ARCH-09 | Archive non modifiable | Protection contre l'alteration |
| ARCH-10 | Reversibilite | Archives lisibles sans logiciel proprietaire |

---

## 3. Controles techniques complementaires

| Ref | Exigence | Detail |
|-----|----------|--------|
| TECH-01 | Ticket Z avec GT cumulatif | La cloture journaliere inclut le grand total cumulatif |
| TECH-02 | Revue du code source | INFOCERT/LNE examinent le code source |
| TECH-03 | Tests fonctionnels complets | Toutes les operations de caisse testees |
| TECH-04 | Documentation des algorithmes | Hash, chainage, signature documentes |
| TECH-05 | Gestion des versions | Tracabilite des modifications logicielles |
| TECH-06 | Pas de mode formation masquant | Le mode demo/formation ne doit pas creer de transactions reelles cachees |

---

## 4. Processus de certification NF525

1. **Candidature** : Depot du dossier aupres d'INFOCERT ou LNE
2. **Revue du code source** : Analyse du code par les auditeurs certifies
3. **Tests fonctionnels** : Tests de toutes les fonctionnalites certifiees
4. **Revue de la documentation** : Algorithmes, architecture, administration
5. **Decision de certification** : Attribution de la certification NF525
6. **Surveillance** : Annuelle (verification des mises a jour)
7. **Re-certification** : Obligatoire pour les changements de version majeurs

### Auto-certification (Art. 125 LdF 2026)

Depuis fevrier 2026, l'editeur peut delivrer une **attestation individuelle** de conformite. L'editeur reste responsable penalement de la veracite de l'attestation.

---

## 5. Sanctions

| Infraction | Sanction |
|------------|---------|
| Utilisation d'un logiciel non conforme | **7 500 EUR d'amende** par logiciel (Art. 1770 duodecies CGI) |
| Delai de mise en conformite | 60 jours apres PV de constat |
| Recidive dans les 60 jours | Nouvelle amende de 7 500 EUR |
| Rejet de comptabilite | L'administration peut rejeter toute la comptabilite |
| Rappel TVA majore | Majoration de 80% sur les montants de TVA dus |
| Faux certificat de conformite | **3 ans d'emprisonnement + 45 000 EUR d'amende** (delit penal) |

---

## 6. Non-conformites courantes

1. **Grand Total (GT) reinitilisable ou modifiable** — non-conformite critique
2. **Chaine de hash interrompue** (ecart dans le chainage cryptographique)
3. **Fonction de suppression de transactions** accessible
4. **Ticket Z incomplet** (cumuls manquants)
5. **Algorithme cryptographique faible** (MD5, SHA-1 insuffisants)
6. **Journal technique absent** ou non protege
7. **Archives non horodatees** ou non protegees en integrite
8. **Mode demo/formation creant des transactions reelles** sans trace
9. **Documentation du code source insuffisante**
10. **Gestion des roles utilisateurs absente** ou incomplete

---

## 7. Checklist Victor — Audit NF525

### Inalterabilite
- [ ] Aucune suppression/modification de transaction possible sans trace
- [ ] Corrections par ecriture nouvelle avec reference
- [ ] Numerotation sequentielle continue et ininterrompue
- [ ] Chainage cryptographique de chaque transaction (hash chain)
- [ ] Grand Total (GT) cumulatif et non reinitilisable
- [ ] Compteurs perpetuels non remis a zero
- [ ] Pas de fonction de dissimulation ou suppression

### Securisation
- [ ] Signature/hash sur chaque transaction
- [ ] Chainage des signatures/hash
- [ ] Fonction de verification d'integrite disponible
- [ ] Authentification des utilisateurs
- [ ] Roles differencies (admin, caissier, manager)
- [ ] Journal technique protege en integrite
- [ ] Cles cryptographiques stockees de facon securisee
- [ ] Pas de porte derobee (verification code source)

### Conservation
- [ ] Conservation 6 exercices fiscaux minimum
- [ ] Cloture journaliere (Ticket Z) avec GT cumulatif
- [ ] Cloture mensuelle
- [ ] Cloture annuelle
- [ ] Donnees brutes conservees (pas seulement agregats)
- [ ] Donnees lisibles et accessibles pendant la duree legale

### Archivage
- [ ] Archivage automatique periodique
- [ ] Archives horodatees
- [ ] Integrite des archives verifiee (hash)
- [ ] Export pour controle fiscal disponible
- [ ] Archives incluent transactions, clotures et journal technique
- [ ] Archives lisibles sans logiciel proprietaire

---

## 8. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **JayKonta** | Si JayKonta inclut une fonctionnalite d'encaissement → NF525 **obligatoire** |
| **Chaine de hash** | Le pattern de chainage cryptographique est similaire a MiyuCloud (integrity chain) |
| **Algorithmes** | SHA-256 minimum recommande (SHA-1/MD5 insuffisants) |
| **GT et compteurs** | Implementation d'un registre cumulatif persistant dans KindMother |
| **Clotures** | Automatisation des clotures journalieres/mensuelles/annuelles |
| **Export fiscal** | Fonction d'export structuree pour l'administration fiscale |
| **LOI-3** | L'etat local souverain (LOI-3) est compatible avec les exigences de conservation |

---

*Sources : Art. 286 bis CGI, Art. 1770 duodecies CGI, Art. 88 LdF 2016, BOI-TVA-DECLA-30-10-30, regles INFOCERT NF525, Art. 125 LdF 2026*
