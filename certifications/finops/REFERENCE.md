<!-- @id cert.jean.finops -->
<!-- @do reference_certification_finops -->
<!-- @role Jean (Responsable Efficience IA) -->
<!-- @layer reference -->
<!-- @human Referentiel FinOps Certified Practitioner — gestion couts inference IA -->

# FinOps Certified Practitioner

## TL;DR

Gestion financiere du cloud et de l'inference IA. 3 phases (Inform, Optimize, Operate), 6 principes, metriques de cout par unite. FinOps Foundation (The Linux Foundation). Adapte au contexte LLM : cout par token, budget par phase, ROI par tache.

## Identite

| Champ | Valeur |
|-------|--------|
| Nom complet | FinOps Certified Practitioner |
| Organisme | FinOps Foundation (The Linux Foundation) |
| Version | Framework v1.0+ |
| Scope | Gestion financiere cloud + inference IA |
| Agent Miyukini | Jean |

## Exigences cles

### 6 Principes FinOps

| # | Principe | Application MIP |
|---|----------|----------------|
| 1 | Les equipes doivent collaborer | Jean + Arianne + Denis pour budget tokens |
| 2 | Les decisions sont guidees par la valeur business | ROI par tache = valeur livree / tokens consommes |
| 3 | Chacun est responsable de son usage cloud | Chaque agent responsable de ses tokens |
| 4 | Les rapports FinOps sont accessibles et en temps reel | Metriques tokens dans `.mip/metrics/` |
| 5 | Une equipe centralisee pilote FinOps | Jean centralise les recommandations |
| 6 | Tirer profit du modele variable du cloud | Adapter le modele (opus/sonnet/haiku) a la tache |

### 3 Phases du cycle FinOps

| Phase | Description | Application MIP |
|-------|------------|----------------|
| **Inform** | Visibilite sur les couts | Comptage tokens par agent, par phase, par tache |
| **Optimize** | Reduire les couts sans perte de qualite | Compression prompts, chargement selectif, modele adapte |
| **Operate** | Gouvernance continue | Seuils adaptatifs, alertes, baseline performance |

### Metriques de cout adaptees LLM

| Metrique | Formule | Usage |
|----------|---------|-------|
| Cout par token | prix_modele * tokens | Budget brut |
| Tokens par ligne | tokens_consommes / lignes_produites | Efficience production |
| Tokens par tache | tokens_consommes / taches_completees | Efficience workflow |
| ROI tache | valeur_estimee / cout_tokens | Priorisation |

## Checklist MIP

- [ ] Budget tokens estime en P0 Temps 4
- [ ] Modele recommande par agent et par tache
- [ ] Tracking tokens actif dans `.mip/metrics/`
- [ ] Comparaison consommation reelle vs budget en P4
- [ ] Rapport efficience dans `.mip/audits/`
- [ ] Baseline MAJ en P6

## Anti-patterns

| Anti-pattern | Risque | Correction |
|-------------|--------|-----------|
| Opus pour tout | Surcout x10 vs sonnet | Adapter le modele a la complexite |
| Pas de budget | Consommation incontrôlee | Estimer budget en P0 |
| Ignorer les metriques | Pas de feedback loop | Review metriques a chaque checkpoint |
| Optimisation prematuree | Perte de qualite | Mesurer d'abord, optimiser ensuite |

## Application Miyukini

Jean applique FinOps a chaque sequence MIP : budget P0, tracking P3, audit P4, capitalisation P6. L'objectif n'est pas de minimiser les tokens a tout prix mais de maximiser la valeur par token consomme.
