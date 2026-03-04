<!-- @id cert.jean.prompt_eng -->
<!-- @do reference_certification_prompt_engineering -->
<!-- @role Jean (Responsable Efficience IA) -->
<!-- @layer reference -->
<!-- @human Referentiel Prompt Engineering Best Practices — optimisation interactions LLM -->

# Prompt Engineering Best Practices

## TL;DR

Optimisation des interactions avec les LLM. Techniques de compression semantique, few-shot, chain-of-thought, structured output. Reduction tokens sans perte de qualite. Applicable aux prompts systeme, instructions agents, skills, fichiers memoire.

## Identite

| Champ | Valeur |
|-------|--------|
| Nom complet | Prompt Engineering Best Practices |
| Sources | Anthropic docs, OpenAI cookbook, recherche academique |
| Version | Etat de l'art 2025-2026 |
| Scope | Optimisation prompts pour agents IA |
| Agent Miyukini | Jean |

## Exigences cles

### Techniques de compression

| Technique | Description | Gain tokens | Risque qualite |
|-----------|-------------|-------------|---------------|
| **Compression semantique** | Reduire la verbosity, eliminer filler words | 15-30% | Faible |
| **Deduplication** | Supprimer contenu repete entre fichiers | 10-40% | Nul |
| **Modularisation** | Charger uniquement les modules necessaires | 50-90% | Nul si bien indexe |
| **Index + drill-down** | Index leger → detail a la demande | 30-60% | Nul |
| **Abbreviations consistantes** | Raccourcis documentes et coherents | 5-10% | Faible si documente |
| **Tables vs prose** | Tableaux pour donnees structurees | 10-20% | Nul, souvent meilleur |

### Techniques d'interaction

| Technique | Quand utiliser | Cout tokens |
|-----------|---------------|-------------|
| **Zero-shot** | Taches simples, modele capable | Minimal |
| **Few-shot** | Taches avec format specifique | +100-500 tokens |
| **Chain-of-thought** | Raisonnement complexe | +200-1000 tokens |
| **Structured output** | Resultat JSON/table attendu | +50-200 tokens |
| **Role prompting** | Specialisation agent | +50-100 tokens |

### Principes d'optimisation prompts systeme

| Principe | Description |
|----------|-------------|
| **Specificite** | Instructions precises > instructions vagues |
| **Structure** | Headers, listes, tables > blocs de texte |
| **Exemples** | 1-2 exemples concrets > longue explication |
| **Contraintes explicites** | "NE PAS faire X" > esperer que le modele evite X |
| **Priorite** | Regles importantes en premier et en dernier (effet primacy/recency) |
| **Separation** | Contexte, instructions, exemples dans des sections distinctes |

### Optimisation fichiers agents (.md)

| Section | Strategie optimale |
|---------|--------------------|
| YAML frontmatter | Minimal : name, description (TL;DR), model, tools |
| Role principal | Liste a puces courte (5-8 items) |
| Domaines competence | Tables > prose |
| Certifications | Reference INDEX.md, pas de copie |
| Protocole MIP | Uniquement les phases pertinentes a l'agent |
| Regles INVARIANTS | Max 7-10 regles. Chaque regle = 1 ligne |

## Checklist MIP

- [ ] Prompts systeme revus pour compression semantique
- [ ] Deduplication verifiee entre CLAUDE.md, MEMORY.md, agents .md
- [ ] Modules on-demand au lieu de chargement monolithique
- [ ] Tables utilisees pour donnees structurees
- [ ] Regles INVARIANTS <=10 par agent
- [ ] Index + drill-down pour referentiels volumineux

## Anti-patterns

| Anti-pattern | Risque | Correction |
|-------------|--------|-----------|
| Prompt monolithique | Tokens gaspilles a chaque invocation | Modulariser |
| Copie entre fichiers | Desynchronisation + tokens doubles | Source unique + references |
| Prose quand table suffit | +30% tokens pour meme info | Convertir en table |
| Exemples excessifs | +500-2000 tokens | 1-2 exemples max |
| Instructions negatives multiples | Confusion modele | Reformuler en positif |

## Application Miyukini

Jean applique ces principes en continu : revue des agents .md, optimisation SKILL.md (deja fait : 40k → 3.8k tokens), refactorisation MEMORY.md avec Arianne, recommandations de compression aux checkpoints P3.
