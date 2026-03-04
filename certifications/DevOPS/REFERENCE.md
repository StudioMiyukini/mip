<!-- @id cert.hugo.devops -->
<!-- @do provide_devops_reference_knowledge -->
<!-- @role devops_practices -->
<!-- @layer reference -->
<!-- @human Referentiel DevOps pour Hugo -->

# DevOps — Pratiques, Certifications et Reference Hugo

**TL;DR** : Methodologie et culture de livraison logicielle continue. 5 piliers CALMS, Three Ways (Gene Kim). Pratiques cles : CI/CD, IaC, conteneurisation, monitoring, DevSecOps. 4 metriques DORA. Certification principale : DOFD v3.3 (DevOps Institute, 40 QCM, 65%).

**Organismes** : DevOps Institute, IDCA, DASA, Scaled Agile, AWS/GCP/Azure
**Obligation** : Aucune | **DOFD prerequis** : Aucun (16h formation recommandees)

---

## 1. Fondamentaux

### CALMS (5 piliers)

| Pilier | Description |
|--------|-------------|
| **C**ulture | Collaboration, confiance, apprentissage continu, responsabilite partagee |
| **A**utomatisation | CI/CD, IaC, tests automatises, deploiement automatique |
| **L**ean | Elimination gaspillage, flux continu, amelioration continue |
| **M**esure | Metriques, feedback, decisions data-driven |
| **S**haring | Partage connaissances, transparence, boucles feedback |

### Three Ways (Gene Kim)

| Way | Principe | Pratiques |
|-----|----------|-----------|
| 1st | Flux (gauche->droite) | Pipeline CI/CD, petits lots, limiter WIP |
| 2nd | Feedback (droite->gauche) | Monitoring, alerting, telemetrie, post-mortems |
| 3rd | Experimentation | Culture blame-free, Kaizen, dette technique, innovation |

### Mouvements fondateurs

Lean (systems thinking, qualite integree), Continuous Delivery (pipeline deploiement), Toyota Kata (vision->cible->iteration), Theory of Constraints (petites equipes, lots reduits), Agile Manifesto, Infrastructure Agile (IaC, cloud hybride).

---

## 2. Pratiques essentielles

### CI (CI-01 a 06)

Trunk-based dev, commits frequents, build auto chaque commit, tests auto (unitaires+integration), feedback <10min, fix immediat si build casse.

### CD (CD-01 a 07)

Pipeline deploiement (build->test->staging->prod), artefacts immuables, environnements identiques (IaC), deploiements automatises, rollback <5min, feature flags, canary/blue-green.

### IaC (IAC-01 a 05)

Tout en code (Terraform/Ansible/Pulumi), versionne Git, reproductible de zero, idempotent, tests infra.

### Conteneurisation (CTN-01 a 07)

Docker/Podman, images multi-stage, registry prive, orchestration (K8s/Compose/Nomad), health checks, immutabilite, scan securite images.

### Monitoring (MON-01 a 07)

Metriques applicatives (RED), metriques systeme (USE), logging centralise (ELK/Loki), tracing distribue (Jaeger/Zipkin), alerting proactif, dashboards temps reel, telemetrie (Prometheus/OTEL).

### DevSecOps (SEC-01 a 07)

Shift-left, SAST (SonarQube/Semgrep), DAST, SCA (deps/CVE), secrets management (Vault/SOPS), policy as code, threat modeling.

---

## 3. Metriques DORA

| Metrique | Elite | High | Medium | Low |
|----------|-------|------|--------|-----|
| Deployment Frequency | Plusieurs/jour | 1/sem-1/mois | 1-6/mois | <1/6mois |
| Lead Time for Changes | <1 jour | 1j-1sem | 1sem-1mois | 1-6 mois |
| Change Failure Rate | <5% | 5-10% | 10-15% | >15% |
| MTTR | <1h | <1j | <1sem | >6mois |

---

## 4. Outils par categorie

| Categorie | Outils cles |
|-----------|-------------|
| Source | Git, GitHub, GitLab |
| CI/CD | GitHub Actions, GitLab CI, Jenkins |
| Conteneurs | Docker, Kubernetes, Compose |
| IaC | Terraform, Ansible, Pulumi |
| Monitoring | Prometheus, Grafana, ELK/OpenSearch, OpenTelemetry |
| Securite | SonarQube, Trivy, HashiCorp Vault |

---

## 5. DOFD v3.3 (DevOps Foundation)

| Critere | Detail |
|---------|--------|
| Organisme | DevOps Institute |
| Questions | 40 QCM, 60 min, note min 65% (26/40) |
| Prerequis | Aucun (16h recommandees) |
| Format | Non supervise, livre ouvert |

### Modules (8)

| Module | Description | Max Q |
|--------|-------------|-------|
| 1 | Exploration DevOps (but, valeur economique) | 5 |
| 2 | Principes fondamentaux (Three Ways) | 4 |
| 3 | Pratiques (CI/CD) | 7 |
| 4 | Cadres (ITIL, Agile, normes) | 7 |
| 5 | Culture, comportements, modeles operationnels | 6 |
| 6 | Automatisation, architecture toolchains | 5 |
| 7 | Mesure, metriques, rapports | 2 |
| 8 | Partage, observation, rapports | 4 |

**Concepts cles** : Agile/Scrum/Kanban/Lean, CALMS, Three Ways, Conway, Kaizen, CI/CD/IaC/Microservices/Feature flags/Blue-green/Canary, metriques DORA, ITIL/ISO 20000/SAFe/SRE, Anti-fragile/ChatOps/Chaos Monkey/Shift-left.

---

## 6. Panorama certifications DevOps

| Certification | Organisme | Niveau | Focus |
|--------------|-----------|--------|-------|
| DOFD | DevOps Institute | Fondation | Principes, culture, pratiques |
| DevSecOps Foundation | DevOps Institute | Fondation | Securite integree |
| Certified DevOps Generalist | IDCA | Fondation | Methodologie complete |
| DevOps Engineer Pro | AWS | Professional | CI/CD, IaC, monitoring AWS |
| DASA Fundamentals | DASA | Fondation | Principes, equipes |
| SAFe DevOps | Scaled Agile | Practitioner | DevOps enterprise |
| GCP DevOps Engineer | Google Cloud | Professional | SRE, monitoring GCP |
| Azure DevOps Expert | Microsoft | Expert | Pipelines Azure |

---

## 7. Pipeline de reference

```
Commit -> LINT (0 erreur) -> TEST (100% pass) -> SECURITY (SAST+SCA, 0 vuln critique) -> BUILD (artefact+tag+push) -> STAGING (smoke+e2e) -> PROD (canary/blue-green, monitoring, rollback auto)
```

---

## 8. Anti-patterns

Silos Dev/Ops, CI sans tests, deploiements manuels, snowflake servers, securite afterthought, pas de monitoring, feature branches longues, tooling over culture, manual change approval, no post-mortems.

---

## 9. Checklist Hugo

**CI/CD** : [ ] Pipeline auto (commit->deploy) [ ] Tests auto chaque commit [ ] Feedback <10min [ ] Artefacts immuables (semver) [ ] Rollback <5min [ ] Feature flags
**Infra** : [ ] IaC versionnee [ ] Envs reproductibles [ ] Conteneurisation multi-stage [ ] Health checks [ ] Pas de secrets dans code/images [ ] Pas de `latest` en prod
**Monitoring** : [ ] Metriques RED applicatives [ ] Metriques USE systeme [ ] Logging centralise/structure [ ] Alerting + escalade [ ] Dashboards equipe
**Securite** : [ ] SAST pipeline [ ] SCA deps (CVE) [ ] Scan images conteneurs [ ] Secrets dans vault [ ] TLS partout
**Culture** : [ ] Metriques DORA suivies [ ] Post-mortems blame-free [ ] Value stream mapping [ ] Runbooks a jour [ ] Temps dette technique

---

## 10. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Pipeline CI/CD | GitHub Actions pour workspace Cargo (build->test->clippy->deploy) |
| Conteneurisation | Docker pour services exposes (MiyuCloud, Origin, miou-llm-bridge) |
| IaC | Ansible/Terraform pour VPS deploiement |
| Monitoring | Prometheus + Grafana pour services, OTEL pour tracing |
| Securite | cargo-audit (SCA), clippy pedantic (SAST-like), secrets Vault/SOPS |
| DORA | Freq = chaque merge main, Lead time = P3-P5, CFR = bugs post-deploy, MTTR = temps fix |
| MIP v2 | P0->P6, TDD, gates compatible culture DevOps. Hugo supervise P4-P5 |
| Anti-patterns | Eviter deploiements manuels, branches longues (MIP enforce feature branches courtes) |

---

*Sources : DevOps Institute DOFD v3.3, DevOps Revealed (IDCA), Gene Kim "The Phoenix Project", "Accelerate" (Forsgren, Humble, Kim)*
