<!-- @id cert.george.rgpd -->
<!-- @do provide_rgpd_reference_knowledge -->
<!-- @role data_protection -->
<!-- @layer reference -->
<!-- @human Referentiel RGPD pour George -->

# RGPD / GDPR -- Referentiel George

> **TL;DR** : Reglement europeen 2016/679 sur la protection des donnees personnelles, applicable depuis mai 2018.
> Impose des obligations aux responsables de traitement et sous-traitants.
> Impact Miyukini : encadre toute collecte/traitement de donnees personnelles (MiyuCloud, services, analytics).

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | Union Europeenne (Parlement + Conseil) |
| Obligation | Obligatoire pour tout traitement de donnees de residents UE |
| Validite | En vigueur depuis le 25 mai 2018, pas de date d'expiration |
| Prerequis | S'applique des qu'on traite des donnees personnelles de residents UE |

## Domaine d'application

Tout traitement de donnees a caractere personnel effectue par un responsable de traitement ou sous-traitant etabli dans l'UE, ou ciblant des personnes dans l'UE. S'applique au traitement automatise et aux fichiers manuels structures.

## 7 principes fondamentaux (Article 5)

| # | Principe | Description |
|---|----------|-------------|
| 1 | Liceite, loyaute, transparence | Traitement licite, loyal et transparent envers la personne |
| 2 | Limitation des finalites | Collecte pour des finalites determinees, explicites et legitimes |
| 3 | Minimisation des donnees | Adequates, pertinentes et limitees au necessaire |
| 4 | Exactitude | Donnees exactes et tenues a jour |
| 5 | Limitation de conservation | Conservees sous forme identifiable pour la duree necessaire |
| 6 | Integrite et confidentialite | Securite appropriee (technique et organisationnelle) |
| 7 | Responsabilite (accountability) | Le responsable doit demontrer la conformite |

## 6 bases legales de traitement (Article 6)

| Base | Description | Exemple |
|------|-------------|---------|
| Consentement | Libre, specifique, eclaire, univoque | Inscription newsletter |
| Contrat | Necessaire a l'execution d'un contrat | Livraison de service |
| Obligation legale | Imposee par la loi | Declaration fiscale |
| Interets vitaux | Protection de la vie de la personne | Urgence medicale |
| Mission d'interet public | Autorite publique | Service public |
| Interet legitime | Balance interet responsable vs droits personne | Prevention fraude |

## Droits des personnes concernees

| Droit | Article | Delai de reponse |
|-------|---------|-----------------|
| Information | 13-14 | Au moment de la collecte |
| Acces | 15 | 1 mois |
| Rectification | 16 | 1 mois |
| Effacement (oubli) | 17 | 1 mois |
| Limitation du traitement | 18 | 1 mois |
| Portabilite | 20 | 1 mois |
| Opposition | 21 | Sans delai |
| Non-profilage automatise | 22 | Sans delai |

## Obligations cles

| Ref | Obligation | Article | Detail |
|-----|-----------|---------|--------|
| O1 | Registre des traitements | 30 | Obligatoire si > 250 employes ou traitements reguliers |
| O2 | AIPD (DPIA) | 35 | Obligatoire si risque eleve pour les personnes |
| O3 | DPO (DPD) | 37-39 | Obligatoire pour autorites publiques et traitements a grande echelle |
| O4 | Privacy by Design | 25 | Protection des donnees des la conception |
| O5 | Notification de violation | 33-34 | 72h a l'autorite, sans delai si risque eleve aux personnes |
| O6 | Contrats sous-traitants | 28 | Clauses obligatoires (securite, audit, suppression) |
| O7 | Transferts hors UE | 44-49 | Adequation, clauses types, BCR, ou derogations |
| O8 | Analyse d'impact (AIPD) | 35 | Profilage, surveillance, donnees sensibles a grande echelle |

## Sanctions (Article 83)

| Niveau | Montant maximum | Infractions |
|--------|-----------------|-------------|
| Niveau 1 | 10M EUR ou 2% CA mondial | Obligations techniques (registre, DPO, notification) |
| Niveau 2 | 20M EUR ou 4% CA mondial | Principes, droits des personnes, transferts |

## Checklist George

- [ ] Registre des traitements (Article 30) complet et a jour
- [ ] Base legale identifiee et documentee par traitement
- [ ] Mentions d'information (privacy notices) accessibles
- [ ] Mecanismes de consentement conformes (libre, eclaire, retractable)
- [ ] AIPD realisee pour les traitements a risque eleve
- [ ] Procedure de notification de violation en place (72h)
- [ ] DPO designe (si applicable) ou justification d'exemption
- [ ] Contrats sous-traitants conformes (Article 28) signes
- [ ] Procedures d'exercice des droits operationnelles (acces, rectif, effacement)
- [ ] Mesures de securite techniques et organisationnelles documentees

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Consentement pre-coche ou force | Consentement actif, granulaire, retractable facilement |
| Collecte de donnees "au cas ou" | Minimisation : collecter uniquement ce qui est necessaire |
| Pas de registre des traitements | Documenter chaque traitement meme si < 250 employes |
| Conservation illimitee des donnees | Definir et appliquer des durees de conservation par finalite |
| Privacy policy generique copier-coller | Mentions specifiques au traitement reel de l'organisation |
| Pas de procedure de violation | Preparer le workflow de notification AVANT l'incident |
| Transfert hors UE sans garanties | Verifier adequation ou mettre en place clauses contractuelles types |

## Application Miyukini

| Exigence RGPD | Implementation COG |
|----------------|--------------------|
| Privacy by Design | LOI-1 (zero dep externe), chiffrement MiyuCloud at-rest |
| Minimisation | Services locaux, pas de telemetrie, donnees utilisateur minimales |
| Registre des traitements | A documenter par service (MiyuCloud, JayFestival, etc.) |
| Securite (Art. 32) | ChaCha20-Poly1305, Argon2id, X25519, audit Victor /100 |
| Droit a l'effacement | MiyuCloud : suppression fichiers + corbeille vidable |
| Portabilite | MiyuCloud : export ZIP, formats ouverts |
| Notification violation | Procedure a definir si service expose au reseau |
| Sous-traitance | LOI-1 : pas de sous-traitant cloud, tout est auto-heberge |
| Transferts hors UE | Non applicable si deploiement local uniquement |
