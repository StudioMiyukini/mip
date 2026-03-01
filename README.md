# MIP v2 — Miyukini Implementation Protocol

Protocole de developpement orchestre pour l'equipe Miyukini AI Studio.

## Principe

Chaque demande est classee (T1-T5) et traverse les phases necessaires avec des quality gates obligatoires.

## Classification

| Classe | Description | Phases |
|--------|-------------|--------|
| T1 | Micro-fix (<20 lignes, 1 fichier) | P3 → P5 |
| T2 | Fix cible (1-3 fichiers) | P2 → P3 → P5 |
| T3 | Feature moderee (3-10 fichiers) | P1 → P2 → P3 → P5 → P6 |
| T4 | Feature majeure (10+ fichiers) | Toutes phases |
| T5 | Chantier strategique | Toutes phases |

## Phases

| Phase | Nom | Agents | Gate |
|-------|-----|--------|------|
| P0 | Cadrage | Maria + Fabrice | Brief approuve par utilisateur |
| P1 | Specification | Denis | Spec validee |
| P2 | Plan d'execution | Denis | Plan valide |
| P3 | Implementation | Francois + Lise | Tests + clippy passent |
| P4 | Integration & Audit | Denis + George | 0 defaut bloquant |
| P5 | Livraison | Denis | Utilisateur confirme |
| P6 | Archivage | Arianne | Memoire mise a jour |

## Artefacts

- `briefs/` — Briefs de cadrage (P0)
- `specs/` — Specifications techniques (P1)
- `plans/` — Plans d'execution atomiques (P2)
- `audits/` — Rapports d'audit (P4)

## Reference

Skill complet : `.cursor/skills/miyukini-mip-workflow/SKILL.md`
