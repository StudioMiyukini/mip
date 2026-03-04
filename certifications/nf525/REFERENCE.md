<!-- @id cert.victor.nf525 -->
<!-- @do provide_nf525_reference_knowledge -->
<!-- @role fiscal_compliance -->
<!-- @layer reference -->
<!-- @human Referentiel NF525 pour Victor -->

# NF525 — Logiciel de Gestion d'Encaissement — Reference Victor

**TL;DR** : Certification **obligatoire** (depuis 01/01/2018) pour tout logiciel de caisse. 4 conditions ISCA : inalterabilite, securisation, conservation, archivage. Chainage cryptographique, GT cumulatif, clotures obligatoires. Art. 286 bis CGI. Amende 7500 EUR/logiciel non conforme.

**Organisme** : INFOCERT / LNE / AFNOR | **Base** : Art. 286 bis CGI, Art. 88 LdF 2016
**Obligation** : **OBLIGATOIRE** | **Validite** : Continue (re-certification version majeure)
**Evolution 2026** : Art. 125 LdF 2026 reintroduit option auto-certification editeur

---

## 1. Champ d'application

Tout assujetti TVA utilisant un logiciel/systeme de caisse -> conditions ISCA obligatoires.

**Exemptions** : Micro-entrepreneurs sous seuil TVA, organismes exoneres TVA, pas de logiciel caisse (facturation manuelle).

**Preuve conformite** : 1) Certification NF525 (INFOCERT/LNE), ou 2) Attestation editeur (auto-certification, Art. 125 LdF 2026).

---

## 2. Les 4 conditions ISCA

### Inalterabilite (INAL-01 a 10)

| Ref | Exigence |
|-----|----------|
| INAL-01/02/03 | Aucune modification/suppression sans trace, corrections par ecriture nouvelle, annulations tracees |
| INAL-04/05/06 | Numerotation sequentielle continue, **chainage cryptographique** (hash chain), tickets numerotes |
| INAL-07/08 | **Grand Total (GT) cumulatif non reinitilisable**, compteurs perpetuels |
| INAL-09/10 | Pas de fonction dissimulation, journal technique complet |

### Securisation (SECU-01 a 09)

| Ref | Exigence |
|-----|----------|
| SECU-01/02/03 | Signature/hash par transaction, chainage signatures, verification integrite |
| SECU-04/05/06 | Protection code source, authentification utilisateurs, gestion roles (admin/caissier/manager) |
| SECU-07/08/09 | Journal technique protege, cles cryptographiques securisees, **pas de porte derobee** |

### Conservation (CONS-01 a 10)

| Ref | Exigence |
|-----|----------|
| CONS-01/02 | **6 exercices fiscaux min** (7 ans si non calendaire) |
| CONS-03/04 | Accessibilite/lisibilite, format structure |
| CONS-05/06/07 | **Cloture journaliere** (Ticket Z), **mensuelle**, **annuelle** |
| CONS-08/09/10 | Gel donnees par cloture, cumuls par cloture, conservation donnees brutes (pas seulement agregats) |

### Archivage (ARCH-01 a 10)

| Ref | Exigence |
|-----|----------|
| ARCH-01/02/03 | Archivage automatique periodique, horodatage, hash integrite |
| ARCH-04/05 | Format lisible/structure, export pour administration fiscale |
| ARCH-06/07/08 | Transactions + clotures + journal technique inclus |
| ARCH-09/10 | Archive non modifiable, lisible sans logiciel proprietaire |

---

## 3. Controles techniques complementaires

Ticket Z avec GT cumulatif, revue code source (INFOCERT/LNE), tests fonctionnels complets, documentation algorithmes (hash/chainage/signature), gestion versions, mode formation ne cree pas de transactions reelles cachees.

---

## 4. Certification

| Etape | Description |
|-------|-------------|
| 1 | Candidature INFOCERT/LNE |
| 2 | Revue code source |
| 3 | Tests fonctionnels |
| 4 | Revue documentation (algorithmes, architecture) |
| 5 | Decision certification NF525 |
| 6 | Surveillance annuelle (verification MAJ) |
| 7 | Re-certification obligatoire pour versions majeures |

**Auto-certification (Art. 125 LdF 2026)** : Attestation individuelle editeur. Responsabilite penale.

---

## 5. Sanctions

| Infraction | Sanction |
|------------|---------|
| Logiciel non conforme | **7 500 EUR/logiciel** (Art. 1770 duodecies CGI) |
| Recidive dans 60 jours | Nouvelle amende 7 500 EUR |
| Rejet comptabilite | Administration peut rejeter toute la comptabilite |
| Rappel TVA majore | Majoration 80% TVA due |
| Faux certificat | **3 ans prison + 45 000 EUR** (delit penal) |

---

## 6. Non-conformites courantes

GT reinitilisable/modifiable (**critique**), chaine hash interrompue, suppression transactions accessible, Ticket Z incomplet, algo crypto faible (MD5/SHA-1), journal technique absent/non protege, archives non horodatees, mode demo creant transactions reelles, documentation code insuffisante, gestion roles absente.

---

## 7. Checklist Victor

**Inalterabilite** : [ ] Pas de suppression/modification sans trace [ ] Corrections par ecriture nouvelle [ ] Numerotation sequentielle [ ] Chainage crypto (hash chain) [ ] GT cumulatif non reinitilisable [ ] Compteurs perpetuels [ ] Pas de fonction dissimulation
**Securisation** : [ ] Hash/signature par transaction [ ] Chainage [ ] Verification integrite [ ] Auth utilisateurs [ ] Roles differencies [ ] Journal technique protege [ ] Cles securisees [ ] Pas de backdoor
**Conservation** : [ ] 6 exercices min [ ] Cloture journaliere (Ticket Z) + GT [ ] Cloture mensuelle + annuelle [ ] Donnees brutes conservees [ ] Lisibles pendant duree legale
**Archivage** : [ ] Archivage auto periodique [ ] Archives horodatees [ ] Hash integrite [ ] Export fiscal [ ] Transactions + clotures + journal inclus [ ] Lisible sans logiciel proprietaire

---

## 8. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| JayKonta | Si encaissement -> NF525 **obligatoire** |
| Chaine hash | Pattern similaire MiyuCloud (integrity chain) |
| Algorithmes | SHA-256 minimum (SHA-1/MD5 insuffisants) |
| GT et compteurs | Registre cumulatif persistant dans KindMother |
| Clotures | Automatisation journalieres/mensuelles/annuelles |
| Export fiscal | Fonction export structuree administration fiscale |
| LOI-3 | Etat local souverain compatible exigences conservation |

---

*Sources : Art. 286 bis CGI, Art. 1770 duodecies CGI, Art. 88 LdF 2016, BOI-TVA-DECLA-30-10-30, INFOCERT NF525, Art. 125 LdF 2026*
