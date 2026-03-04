<!-- @id cert.jean.mlops -->
<!-- @do reference_certification_mlops -->
<!-- @role Jean (Responsable Efficience IA) -->
<!-- @layer reference -->
<!-- @human Referentiel MLOps Fundamentals — cycle de vie modeles LLM -->

# MLOps Fundamentals

## TL;DR

Cycle de vie des modeles IA en production. Versioning, monitoring, drift detection, A/B testing. Adapte au contexte agents MIP : suivi des versions de modeles Claude, detection de regression de performance, recommandation de migration entre modeles.

## Identite

| Champ | Valeur |
|-------|--------|
| Nom complet | MLOps Fundamentals |
| Sources | Google MLOps whitepaper, MLOps Community, DMLC |
| Version | Pratiques 2024-2026 |
| Scope | Cycle de vie modeles LLM pour agents |
| Agent Miyukini | Jean |

## Exigences cles

### Cycle de vie modele dans MIP

| Phase | Action | Responsable |
|-------|--------|-------------|
| **Selection** | Choisir le modele adapte (opus/sonnet/haiku) | Jean (recommande), Denis (valide) |
| **Configuration** | Assigner le modele dans l'agent .md (YAML `model:`) | Jean |
| **Monitoring** | Suivre qualite et cout en production | Jean (continu) |
| **Evaluation** | Comparer performance entre sequences MIP | Jean (P6) |
| **Migration** | Proposer changement de modele si nouveau disponible | Jean (recommande) |

### Modeles Claude — Matrice de capacites

| Modele | Forces | Faiblesses | Cout relatif | Usage MIP |
|--------|--------|------------|-------------|-----------|
| **Opus** | Raisonnement profond, architecture, decisions complexes | Lent, couteux | 5x | Lead, audit critique, T5 |
| **Sonnet** | Equilibre, bon code, rapide | Moins de profondeur que Opus | 1x | Workers, implementation, T2-T4 |
| **Haiku** | Tres rapide, tres economique | Capacites limitees | 0.2x | Taches repetitives, T1, classification |

### Monitoring performance modele

| Metrique | Description | Seuil alerte |
|----------|-------------|-------------|
| **Qualite output** | Taux de corrections necessaires | >30% taches avec correction |
| **Tokens/tache** | Consommation moyenne par tache | >1.5x baseline classe |
| **Temps reponse** | Latence moyenne par appel | >2x la normale (peut indiquer congestion) |
| **Taux echec** | Pourcentage d'appels echoues | >5% |
| **Drift** | Changement de comportement apres MAJ modele | Regression sur benchmark interne |

### Versioning modeles

| Element | Ou tracker | Format |
|---------|-----------|--------|
| Version modele | Agent .md (`model:` field) | opus / sonnet / haiku |
| Model ID exact | `.mip/metrics/` | claude-opus-4-6, claude-sonnet-4-6, etc. |
| Date migration | `memory/mip-performance-history.md` | ISO 8601 |
| Raison migration | Meme fichier | Texte libre |

### A/B Testing modeles

Quand un nouveau modele sort, Jean peut recommander un test comparatif :

1. **Selectionner** une tache representative (meme classe, meme type)
2. **Executer** avec l'ancien et le nouveau modele
3. **Comparer** : qualite output, tokens consommes, corrections necessaires
4. **Recommander** migration si nouveau modele est meilleur ou equivalent a cout moindre
5. **Documenter** dans `memory/mip-performance-history.md`

## Checklist MIP

- [ ] Modele assigne dans chaque agent .md
- [ ] Recommandation modele documentee en P0 Temps 4
- [ ] Model ID exact enregistre dans metriques
- [ ] Performance comparee avec baseline en P4
- [ ] Migration documentee si changement de modele
- [ ] Historique performance MAJ en P6

## Anti-patterns

| Anti-pattern | Risque | Correction |
|-------------|--------|-----------|
| Meme modele pour tout | Surcout ou sous-qualite | Adapter au type de tache |
| Pas de tracking version | Impossible de diagnostiquer regression | Logger model ID dans metriques |
| Migration sans test | Regression possible | A/B testing avant migration |
| Ignorer les nouveaux modeles | Perte d'efficience | Veille continue (Jean) |

## Application Miyukini

Jean maintient la matrice de capacites a jour, recommande le modele par agent en P0, monitore la performance en P3, et documente les migrations en P6. L'objectif est d'utiliser le modele le plus efficient pour chaque tache — ni sur-dimensionne (gaspillage), ni sous-dimensionne (corrections couteuses).
