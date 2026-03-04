<!-- @id cert.hugo.docker -->
<!-- @do provide_docker_reference_knowledge -->
<!-- @role containerization -->
<!-- @layer reference -->
<!-- @human Referentiel Docker pour Hugo -->

# Docker — Referentiel Hugo

> **TL;DR** : Reference conteneurisation Docker, couvrant fondamentaux, Dockerfile, Compose, securite et registry.
> Pour Hugo : socle pour conteneuriser les services Miyukini (build, deploy, isolation).
> Impact : images reproductibles, securisees, optimisees pour CI/CD et deploiement Kubernetes.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | Docker Inc. / Mirantis (DCA historique) |
| Obligation | Competence standard industrie pour DevOps et deploiement cloud-native |
| Validite | Competences permanentes (pas d'expiration formelle) |
| Prerequis | Connaissance Linux, reseaux, ligne de commande |

## Domaine d'application

Conteneurisation d'applications : construction d'images, orchestration locale (Compose), gestion du cycle de vie conteneurs, securite images, reseaux et stockage. Socle pour orchestration Kubernetes.

## Fondamentaux conteneurs

| Technologie | Role | Detail |
|-------------|------|--------|
| Namespaces | Isolation processus | pid, net, mnt, uts, ipc, user, cgroup |
| Cgroups | Limitation ressources | CPU, memoire, I/O, PIDs |
| Union Filesystem | Layers images | OverlayFS — layers read-only + layer read-write |
| OCI Runtime | Execution conteneur | runc (standard), crun (alternative) |

## Dockerfile — bonnes pratiques

| Pratique | Pourquoi | Exemple |
|----------|----------|---------|
| Multi-stage build | Image finale minimale | `FROM rust AS build` puis `FROM debian:slim` |
| Minimal base image | Reduire surface attaque | `debian:bookworm-slim`, `alpine`, `distroless` |
| Layer caching | Builds rapides | `COPY Cargo.toml` avant `COPY src/` |
| Non-root USER | Securite runtime | `RUN useradd app && USER app` |
| .dockerignore | Exclure fichiers inutiles | `target/`, `.git/`, `*.md` |
| HEALTHCHECK | Monitoring readiness | `HEALTHCHECK CMD curl -f http://localhost/health` |
| Pinned versions | Reproductibilite | `FROM debian:bookworm-slim@sha256:...` |
| No secrets in image | Securite | Utiliser build secrets (`--mount=type=secret`) |

## Docker Compose

| Directive | Usage | Notes |
|-----------|-------|-------|
| services | Definition conteneurs | Un service = un conteneur |
| networks | Reseaux virtuels | Isolation par defaut, bridge custom |
| volumes | Persistance donnees | Named volumes > bind mounts en prod |
| depends_on | Ordre de demarrage | Utiliser `condition: service_healthy` |
| deploy | Ressources et replicas | Limits CPU/memory, restart policy |
| profiles | Activation conditionnelle | Dev-only services (debug, monitoring) |

## Networking

| Driver | Scope | Usage |
|--------|-------|-------|
| bridge | Host local | Default, isolation entre conteneurs |
| host | Partage stack reseau host | Performance max, pas d'isolation |
| overlay | Multi-host (Swarm/K8s) | Communication inter-noeuds |
| none | Pas de reseau | Conteneurs offline |
| macvlan | IP physique par conteneur | Integration reseau legacy |

## Stockage

| Type | Persistance | Usage |
|------|-------------|-------|
| Volume (named) | Oui, gere par Docker | Donnees prod (DB, uploads) |
| Bind mount | Oui, chemin host | Dev (code source en live) |
| tmpfs | Non (RAM) | Secrets temporaires, cache |

## Securite images

| Mesure | Outil/Methode | Priorite |
|--------|---------------|----------|
| Scan vulnerabilites | Trivy, Grype, Docker Scout | P1 — avant chaque deploy |
| Image signing | Docker Content Trust (Notary) | P2 — supply chain |
| Minimal base | distroless, scratch, slim | P1 — reduire CVEs |
| No root | `USER` directive dans Dockerfile | P1 — limiter blast radius |
| Read-only filesystem | `--read-only` flag | P2 — empecher modifications |
| Capabilities drop | `--cap-drop ALL --cap-add NET_BIND_SERVICE` | P2 — least privilege |

## Checklist Hugo

- [ ] **P1** Multi-stage Dockerfile pour chaque service Rust (build + runtime slim)
- [ ] **P1** .dockerignore complet (`target/`, `.git/`, `*.md`, `.mip/`)
- [ ] **P1** Non-root USER dans toutes les images
- [ ] **P1** HEALTHCHECK sur chaque service expose
- [ ] **P2** Scan images (Trivy/Grype) integre dans CI/CD
- [ ] **P2** Compose config : volumes named, networks custom, resource limits
- [ ] **P2** Volume strategy : named volumes pour KindMother, tmpfs pour secrets
- [ ] **P3** Network isolation : bridge custom par groupe de services
- [ ] **P3** Registry securise : images signees, acces authentifie

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| `FROM ubuntu:latest` | Pinned version + slim/distroless |
| Root dans le conteneur | `USER` non-root, `--cap-drop ALL` |
| Secrets dans `ENV`/`COPY` | Build secrets (`--mount=type=secret`) ou runtime inject |
| Image monolithique (1+ Go) | Multi-stage, base minimale |
| Pas de .dockerignore | Exclure target/, .git/, docs/, .mip/ |
| Bind mounts en prod | Named volumes pour persistance |
| Pas de health check | HEALTHCHECK dans Dockerfile + Compose |
| `docker exec` en prod | Logs via stdout/stderr, debug via sidecar |

## Application Miyukini

| Concept Docker | Composant Miyukini | Implementation |
|----------------|-------------------|----------------|
| Multi-stage | Services Rust (Central, MiyuCloud, LLM Bridge) | Stage 1: `rust:slim` build, Stage 2: `debian:slim` runtime |
| .dockerignore | Tous les services | Exclure `target/`, `.git/`, `.mip/`, `docs/` |
| Non-root | Tous les conteneurs | `useradd miyukini && USER miyukini` |
| HEALTHCHECK | API endpoints | `curl -f http://localhost:{port}/health` |
| Named volumes | KindMother SQLite, MiyuCloud storage | `miyucloud-data`, `kindmother-db` |
| Network isolation | API interne vs web expose | Bridge `miyukini-internal` + bridge `miyukini-web` |
| Compose | Stack locale complete | Central + services + LLM Bridge + MiyuCloud |
| Image scan | CI/CD pipeline | Trivy scan avant push registry |
