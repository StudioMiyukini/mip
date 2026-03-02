# DevOps — Pratiques, Certifications et Reference Hugo

> Methodologie et culture de developpement et livraison logicielle continue

**Organismes** : DevOps Institute (DOFD, DevSecOps), International DevOps Certification Academy (IDCA), DASA, Scaled Agile (SAFe DevOps)
**Certifications principales** : DevOps Foundation (DOFD), Certified DevOps Generalist, DevOps Engineer Professional (AWS), DevSecOps Foundation
**Obligation legale** : Aucune (mais forte demande marche et appels d'offres)
**Prerequis DOFD** : Aucun (16h formation recommandees)

---

## 1. Definition et principes fondamentaux

### Qu'est-ce que DevOps ?

DevOps est un **processus pour developper, livrer et operer du logiciel**. C'est une methodologie et une culture qui vise a :
- Rapprocher les equipes de developpement (Dev) et d'exploitation (Ops)
- Automatiser le cycle de vie du logiciel de l'idee a la production
- Reduire le temps de livraison (lead time) tout en maintenant la qualite et la stabilite

### Modele CALMS (5 piliers DevOps)

| Pilier | Description |
|--------|-------------|
| **Culture** | Collaboration, confiance, apprentissage continu, responsabilite partagee |
| **Automatisation** | CI/CD, IaC, tests automatises, deploiement automatique |
| **Lean** | Elimination du gaspillage, flux continu, amelioration continue |
| **Mesure** | Metriques, feedback, visibilite, decisions basees sur les donnees |
| **Sharing** (Solidarite) | Partage des connaissances, transparence, boucles de feedback |

### Three Ways (Gene Kim)

| Way | Principe | Pratiques |
|-----|----------|-----------|
| **First Way** | Flux (gauche → droite) | Pipeline CI/CD, petits lots, limiter le WIP, rendre le travail visible |
| **Second Way** | Feedback (droite → gauche) | Monitoring, alerting, telemetrie, post-mortems, tests automatises |
| **Third Way** | Experimentation & apprentissage | Culture blame-free, Kaizen, 20% temps pour dette technique, innovation |

---

## 2. Mouvements fondateurs

| Mouvement | Principes cles |
|-----------|----------------|
| **Lean Movement** | Voir le tout (systems thinking), qualite integree, livrer vite, amplifier l'apprentissage, responsabiliser l'equipe, eliminer le gaspillage, decider au dernier moment responsable |
| **Continuous Delivery** | Pipeline de deploiement (visibilite + feedback + deploiement continu) |
| **Toyota Improvement Kata** | Vision → conditions actuelles → conditions cibles → iteration continue vers la cible |
| **Theory of Constraints** | Petites equipes autonomes, reduire la taille des lots, reduire le lead time, feedback rapide et fiable |
| **Agile Manifesto** | Individus, logiciel fonctionnel, collaboration client, reponse au changement |
| **Infrastructure Agile** | IaC, cloud hybride, provisionnement rapide, flexibilite architecturale |

---

## 3. Pratiques DevOps essentielles

### 3.1 Integration Continue (CI)

| Ref | Pratique | Detail |
|-----|----------|--------|
| CI-01 | Trunk-based development | Developpement sur une branche principale, branches courtes (<1 jour) |
| CI-02 | Commits frequents | Commits petits et frequents (plusieurs par jour) |
| CI-03 | Build automatique | Chaque commit declenche un build automatique |
| CI-04 | Tests automatises | Suite de tests executee a chaque build (unitaires, integration) |
| CI-05 | Feedback rapide | Resultat du build en <10 minutes, notification immediate |
| CI-06 | Fix immediat | Un build casse est la priorite #1 de l'equipe |

### 3.2 Livraison Continue (CD) / Deploiement Continu

| Ref | Pratique | Detail |
|-----|----------|--------|
| CD-01 | Pipeline de deploiement | Enchainement automatique : build → test → staging → production |
| CD-02 | Artefacts immuables | Un artefact build une fois, deploye partout (dev, staging, prod) |
| CD-03 | Environnements identiques | Dev, staging, prod aussi identiques que possible (IaC) |
| CD-04 | Deploiements automatises | Zero intervention manuelle pour deployer |
| CD-05 | Rollback rapide | Capacite de retour arriere en <5 minutes |
| CD-06 | Feature flags | Decouplage deploiement / activation de fonctionnalites |
| CD-07 | Canary / Blue-Green | Strategies de deploiement progressif (canary releases, blue-green) |

### 3.3 Infrastructure as Code (IaC)

| Ref | Pratique | Detail |
|-----|----------|--------|
| IAC-01 | Tout en code | Infrastructure definie dans des fichiers versionnes (Terraform, Ansible, Pulumi) |
| IAC-02 | Versionnement | Infrastructure versionnee dans Git comme le code applicatif |
| IAC-03 | Reproductibilite | Un environnement peut etre recree de zero a partir du code |
| IAC-04 | Idempotence | Appliquer la config N fois donne le meme resultat |
| IAC-05 | Tests d'infrastructure | Tests automatises sur l'infra (compliance, securite) |

### 3.4 Conteneurisation

| Ref | Pratique | Detail |
|-----|----------|--------|
| CTN-01 | Conteneurs applicatifs | Applications empaquetees dans des conteneurs (Docker, Podman) |
| CTN-02 | Images multi-stage | Dockerfiles multi-stage pour minimiser la taille des images |
| CTN-03 | Registry prive | Images stockees dans un registry interne securise |
| CTN-04 | Orchestration | Orchestration des conteneurs (Kubernetes, Docker Compose, Nomad) |
| CTN-05 | Health checks | Chaque conteneur expose un endpoint de sante |
| CTN-06 | Immutabilite | Images immuables, pas de modifications en production |
| CTN-07 | Scan de securite | Scan des images pour vulnerabilites avant deploiement |

### 3.5 Monitoring et Observabilite

| Ref | Pratique | Detail |
|-----|----------|--------|
| MON-01 | Metriques applicatives | Temps de reponse, taux d'erreur, throughput (RED/USE method) |
| MON-02 | Metriques systeme | CPU, memoire, disque, reseau |
| MON-03 | Logging centralise | Aggregation des logs (ELK, Loki, Fluentd) |
| MON-04 | Tracing distribue | Tracing des requetes a travers les services (Jaeger, Zipkin) |
| MON-05 | Alerting | Alertes proactives sur les seuils critiques (PagerDuty, Grafana) |
| MON-06 | Dashboards | Tableaux de bord en temps reel accessibles a toute l'equipe |
| MON-07 | Telemetrie | Collecte systematique de donnees de performance (Prometheus, OTEL) |

### 3.6 Securite (DevSecOps)

| Ref | Pratique | Detail |
|-----|----------|--------|
| SEC-01 | Shift-left security | Integrer la securite des les premieres phases du developpement |
| SEC-02 | SAST | Analyse statique du code source (SonarQube, Semgrep) |
| SEC-03 | DAST | Tests dynamiques de securite sur l'application deployee |
| SEC-04 | SCA | Analyse de composition logicielle (dependances, licences, CVE) |
| SEC-05 | Secrets management | Gestion centralisee des secrets (Vault, SOPS, sealed-secrets) |
| SEC-06 | Policy as Code | Politiques de securite definies en code et appliquees automatiquement |
| SEC-07 | Threat modeling | Modelisation des menaces integree au cycle de dev |

---

## 4. Metriques DORA (DevOps Research and Assessment)

Les 4 metriques cles qui distinguent les equipes elite :

| Metrique | Elite | High | Medium | Low |
|----------|-------|------|--------|-----|
| **Deployment Frequency** | Plusieurs/jour | 1/semaine-1/mois | 1/mois-6/mois | <1/6mois |
| **Lead Time for Changes** | <1 jour | 1 jour-1 semaine | 1 semaine-1 mois | 1-6 mois |
| **Change Failure Rate** | <5% | 5-10% | 10-15% | >15% |
| **Mean Time to Restore** | <1 heure | <1 jour | <1 semaine | >6 mois |

---

## 5. Roles DevOps

| Role | Responsabilites |
|------|-----------------|
| **DevOps Engineer** | CI/CD, IaC, monitoring, automatisation, deployment pipeline |
| **SRE (Site Reliability Engineer)** | Fiabilite, SLO/SLI/SLA, error budgets, incident management |
| **DevOps Architect** | Architecture loosely-coupled, services, environnements, outils |
| **DevOps Developer** | Developpement + conscience operationnelle, ownership end-to-end |
| **DevOps Operations Engineer** | Monitoring, deploiement, infrastructure, disponibilite |
| **DevOps QA Engineer** | Automatisation des tests, strategie de test, qualite continue |
| **DevOps Security Engineer** | Securite integree, SAST/DAST, audit, strategy securite |
| **DevOps Release Manager** | Coordination des releases, pipeline end-to-end, risques |
| **DevOps Product Owner** | Backlog, roadmap, priorisation, stakeholder management |

---

## 6. Outils DevOps par categorie

### Gestion de source

| Outil | Type | Usage |
|-------|------|-------|
| **Git** | DVCS | Standard de facto, branches, merge, historique |
| **GitHub** | Plateforme | Hosting Git + CI/CD (Actions) + PR + Issues |
| **GitLab** | Plateforme | Hosting Git + CI/CD natif + Registry + Wiki |

### Integration continue

| Outil | Type | Usage |
|-------|------|-------|
| **GitHub Actions** | CI/CD cloud | Workflows YAML, marketplace d'actions |
| **GitLab CI** | CI/CD integre | Pipelines .gitlab-ci.yml, runners |
| **Jenkins** | CI/CD self-hosted | Pipelines as code (Jenkinsfile), extensible |

### Conteneurisation et orchestration

| Outil | Type | Usage |
|-------|------|-------|
| **Docker** | Conteneurisation | Build, run, distribution d'images |
| **Kubernetes** | Orchestration | Deploiement, scaling, self-healing, networking |
| **Docker Compose** | Orchestration locale | Multi-conteneurs pour dev/test |

### Infrastructure as Code

| Outil | Type | Usage |
|-------|------|-------|
| **Terraform** | IaC declaratif | Multi-cloud, etat, modules, plans |
| **Ansible** | Configuration mgmt | Agentless, YAML playbooks, idempotent |
| **Pulumi** | IaC programmable | IaC en langages reels (Python, TS, Go) |

### Monitoring et observabilite

| Outil | Type | Usage |
|-------|------|-------|
| **Prometheus** | Metriques | Collecte pull-based, PromQL, alerting |
| **Grafana** | Dashboards | Visualisation multi-sources |
| **ELK/OpenSearch** | Logging | Elasticsearch + Logstash + Kibana |
| **OpenTelemetry** | Observabilite | Standard unifie metriques + traces + logs |

### Securite

| Outil | Type | Usage |
|-------|------|-------|
| **SonarQube** | SAST | Analyse statique, quality gates |
| **Trivy** | Scanner images | CVE scanning conteneurs et IaC |
| **HashiCorp Vault** | Secrets | Gestion centralisee des secrets et cles |

---

## 7. Certification DevOps Foundation (DOFD)

### Format de l'examen

| Critere | Detail |
|---------|--------|
| **Organisme** | DevOps Institute |
| **Code** | DOFD v3.3 |
| **Questions** | 40 questions a choix multiples |
| **Duree** | 60 minutes |
| **Note minimale** | 65% (26/40) |
| **Prerequis** | Aucun (16h formation recommandees) |
| **Supervise** | Non |
| **Livre ouvert** | Oui |
| **Badge** | DevOps Foundation Certified |

### Modules et ponderation

| Module | Description | Questions max |
|--------|-------------|---------------|
| DOFD-1 | Exploration de l'approche DevOps (but, objectifs, valeur economique) | 5 |
| DOFD-2 | Principes fondamentaux DevOps (Three Ways) | 4 |
| DOFD-3 | Principales pratiques DevOps (CI/CD) | 7 |
| DOFD-4 | Cadres professionnels et technologiques (ITIL, Agile, normes) | 7 |
| DOFD-5 | Culture, comportements et modeles operationnels | 6 |
| DOFD-6 | Automatisation et architecture de toolchains DevOps | 5 |
| DOFD-7 | Mesure, metriques et rapports | 2 |
| DOFD-8 | Partage, observation et production de rapports | 4 |

### Concepts cles a maitriser

**Culture et methodologie** : Manifeste Agile, Scrum, Kanban, Lean, CALMS, Three Ways, Theory of Constraints, Loi de Conway, Culture blame-free, Kaizen, Toyota Kata

**Pratiques techniques** : CI, CD, Continuous Deployment, Trunk-based dev, IaC, Microservices, Feature flags, Blue-green deploy, Canary releases, A/B testing

**Metriques** : Deployment frequency, Lead time, Change failure rate, MTTR, Cycle time, WIP limits, Value stream mapping

**Cadres** : ITIL, ISO/IEC 20000, SAFe, Scrum (roles, artefacts, evenements), SRE, DevSecOps

**Termes cles** : Anti-fragile, ChatOps, Chaos Monkey/Simian Army, Dojo, eNPS, Shift-left, SPOF, Technical debt, Burndown chart, KPI, SMART objectives

---

## 8. Certifications DevOps — Panorama

| Certification | Organisme | Niveau | Focus |
|--------------|-----------|--------|-------|
| **DevOps Foundation (DOFD)** | DevOps Institute | Fondation | Principes, culture, pratiques DevOps |
| **DevSecOps Foundation** | DevOps Institute | Fondation | Securite integree dans DevOps |
| **Certified DevOps Generalist** | IDCA | Fondation | Methodologie DevOps complete |
| **DevOps Engineer Professional** | AWS | Professional | CI/CD, IaC, monitoring sur AWS |
| **DASA DevOps Fundamentals** | DASA | Fondation | Principes, equipes, culture |
| **SAFe DevOps** | Scaled Agile | Practitioner | DevOps dans un cadre SAFe enterprise |
| **Google Cloud DevOps Engineer** | Google Cloud | Professional | CI/CD, SRE, monitoring sur GCP |
| **Azure DevOps Engineer Expert** | Microsoft | Expert | Pipelines, IaC, securite sur Azure |

---

## 9. Pipeline de reference

### Structure standard (lint → test → security → build → deploy)

```
Code commit
  │
  ├── Stage 1: LINT
  │   ├── Analyse statique du code
  │   ├── Formatage / linting rules
  │   └── GATE: 0 erreur critique
  │
  ├── Stage 2: TEST
  │   ├── Tests unitaires
  │   ├── Tests d'integration
  │   ├── Tests de performance (optionnel)
  │   └── GATE: 100% tests passent
  │
  ├── Stage 3: SECURITY
  │   ├── SAST (analyse statique securite)
  │   ├── SCA (dependances / CVE)
  │   ├── Secret scanning
  │   └── GATE: 0 vulnerabilite critique/haute
  │
  ├── Stage 4: BUILD
  │   ├── Build de l'artefact (binaire, image Docker)
  │   ├── Tag avec version semantique
  │   ├── Push vers registry
  │   └── GATE: Build reussi
  │
  ├── Stage 5: DEPLOY STAGING
  │   ├── Deploiement automatique en staging
  │   ├── Smoke tests
  │   ├── Tests end-to-end
  │   └── GATE: Smoke tests OK
  │
  └── Stage 6: DEPLOY PRODUCTION
      ├── Deploiement canary / blue-green
      ├── Monitoring des metriques
      ├── Rollback automatique si anomalie
      └── GATE: Metriques stables pendant X minutes
```

---

## 10. Anti-patterns DevOps

1. **Silos Dev/Ops maintenus** — equipes separees avec "mur de confusion"
2. **CI sans tests** — builds verts mais aucune garantie qualite
3. **Deploiements manuels** — processus non reproductibles et source d'erreurs
4. **Snowflake servers** — serveurs configures manuellement, non reproductibles
5. **Securite en afterthought** — audit securite seulement avant la mise en prod
6. **Pas de monitoring** — decouvrir les problemes par les utilisateurs
7. **Feature branches longues** — branches de plus de quelques jours, merge hell
8. **Tooling over culture** — acheter des outils sans changer la culture
9. **Manual change approval** — processus d'approbation lent qui bloque le flux
10. **No post-mortems** — pas d'apprentissage apres les incidents

---

## 11. Checklist Hugo — Audit DevOps

### CI/CD Pipeline
- [ ] Pipeline automatise (commit → deploy) en place
- [ ] Tests automatises executes a chaque commit (unitaires + integration)
- [ ] Feedback en <10 minutes
- [ ] Artefacts immuables et versionnes (semver)
- [ ] Rollback possible en <5 minutes
- [ ] Feature flags pour decouplage deploiement/activation

### Infrastructure
- [ ] Infrastructure definie en code (IaC) et versionnee
- [ ] Environnements reproductibles (dev ≈ staging ≈ prod)
- [ ] Conteneurisation avec images multi-stage optimisees
- [ ] Health checks sur tous les services
- [ ] Pas de secrets dans le code ou les images
- [ ] Images Docker immuables (pas de `latest` en prod)

### Monitoring et Observabilite
- [ ] Metriques applicatives collectees (RED: Rate, Errors, Duration)
- [ ] Metriques systeme collectees (USE: Utilization, Saturation, Errors)
- [ ] Logging centralise et structure
- [ ] Alerting configure avec escalade
- [ ] Dashboards accessibles a toute l'equipe

### Securite (DevSecOps)
- [ ] SAST integre dans le pipeline
- [ ] SCA pour les dependances (CVE scanning)
- [ ] Scan d'images conteneurs avant deploiement
- [ ] Secrets geres par un vault (pas en clair, pas dans Git)
- [ ] TLS partout (en transit)

### Culture et processus
- [ ] Metriques DORA suivies (deployment freq, lead time, CFR, MTTR)
- [ ] Post-mortems blame-free apres chaque incident majeur
- [ ] Value stream mapping realise et optimise
- [ ] Documentation operationnelle a jour (runbooks)
- [ ] Temps reserve pour reduction de la dette technique

---

## 12. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **Pipeline CI/CD** | GitHub Actions pour le workspace Cargo (build → test → clippy → deploy). Hugo configure. |
| **Conteneurisation** | Docker pour les services exposes (MiyuCloud, Origin, miou-llm-bridge). Images multi-stage Rust. |
| **IaC** | Ansible/Terraform pour les VPS de deploiement (si applicable). |
| **Monitoring** | Prometheus + Grafana pour les metriques des services (MiyuCloud, Origin). OTEL pour le tracing. |
| **Securite** | cargo-audit pour SCA, clippy pedantic pour SAST-like, secrets dans Vault/SOPS. |
| **DORA Metriques** | Deployment freq = chaque merge sur main. Lead time = temps P3-P5. CFR = bugs post-deploy. MTTR = temps de fix. |
| **MIP v2** | La structure MIP v2 (P0→P6, TDD, gates) est compatible avec une culture DevOps. Hugo supervise P4-P5. |
| **Anti-patterns** | Eviter les deployments manuels, les branches longues (MIP enforce feature branches courtes). |
| **Rollback** | Tags Git + images Docker versionnees permettent un rollback rapide. |

---

*Sources : DevOps Institute DOFD v3.3 Study Guide, DevOps Revealed (IDCA), Smile "DevOps" (2017), Gene Kim "The Phoenix Project", "Accelerate" (Forsgren, Humble, Kim)*
