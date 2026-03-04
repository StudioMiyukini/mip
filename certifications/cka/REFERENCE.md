<!-- @id cert.hugo.cka -->
<!-- @do provide_cka_reference_knowledge -->
<!-- @role container_orchestration -->
<!-- @layer reference -->
<!-- @human Referentiel CKA pour Hugo -->

# CKA — Referentiel Hugo

> **TL;DR** : Certification CNCF en administration Kubernetes, couvrant cluster, workloads, reseau, stockage et securite.
> Pour Hugo : reference pour orchestration conteneurs, deploiement et maintenance des services Miyukini.
> Impact : structure les decisions infra P0 (Temps 4/9) et verifications deploiement P4.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | CNCF (Cloud Native Computing Foundation) / Linux Foundation |
| Obligation | Standard industrie pour administration Kubernetes en production |
| Validite | 2 ans depuis passage |
| Prerequis | Aucun formel, experience pratique Kubernetes recommandee |

## Domaine d'application

Administration et maintenance de clusters Kubernetes en production : installation, configuration, gestion des workloads, reseaux, stockage, securite RBAC et procedures de mise a jour.

## Architecture cluster

| Composant | Role | Criticite |
|-----------|------|-----------|
| kube-apiserver | Point d'entree API, authentification | Critique — SPOF si non HA |
| etcd | Stockage cle-valeur distribue (etat cluster) | Critique — backup obligatoire |
| kube-scheduler | Placement pods sur noeuds | Haute |
| kube-controller-manager | Boucles de reconciliation (replicas, jobs) | Haute |
| kubelet | Agent noeud, execution pods | Critique par noeud |
| kube-proxy | Regles reseau (iptables/IPVS) | Haute |
| CoreDNS | Resolution DNS interne | Haute |
| Container Runtime | containerd / CRI-O | Critique par noeud |

## Workloads

| Ressource | Usage | Points cles |
|-----------|-------|-------------|
| Pod | Unite de base | Ephemere, 1+ containers, shared network |
| Deployment | Stateless apps | Rolling update, rollback, replicas |
| StatefulSet | Stateful apps (DB) | Identite stable, PVC par pod, ordonnancement |
| DaemonSet | Agent par noeud | Monitoring, logging, network plugins |
| Job / CronJob | Taches batch | Completion garantie, scheduling cron |
| ReplicaSet | Maintien replicas | Gere par Deployment, rarement direct |

## Services & Networking

| Type | Exposition | Usage |
|------|-----------|-------|
| ClusterIP | Interne cluster uniquement | Communication inter-services |
| NodePort | Port fixe sur chaque noeud (30000-32767) | Dev/test |
| LoadBalancer | IP externe via cloud provider | Production expose |
| Ingress | HTTP/HTTPS routing L7 | Reverse proxy, TLS termination |
| NetworkPolicy | Regles firewall pod-to-pod | Segmentation, zero-trust interne |

## Stockage

| Ressource | Role | Notes |
|-----------|------|-------|
| PersistentVolume (PV) | Stockage provisionne | Lifecycle independant du pod |
| PersistentVolumeClaim (PVC) | Requete de stockage | Lie a un PV par StorageClass |
| StorageClass | Provisionnement dynamique | SSD, HDD, parametres provider |
| ConfigMap / Secret | Configuration non-stockage | Secrets chiffres au repos dans etcd |

## Securite

| Mecanisme | Scope | Exigence |
|-----------|-------|----------|
| RBAC | Cluster/Namespace | Role, ClusterRole, Bindings |
| ServiceAccount | Pod identity | Token auto-monte, limiter permissions |
| SecurityContext | Pod/Container | runAsNonRoot, readOnlyRootFilesystem, capabilities |
| NetworkPolicy | Pod-to-pod | Default deny, whitelist explicite |
| Pod Security Standards | Namespace | Privileged, Baseline, Restricted |

## Checklist Hugo

- [ ] **P1** Cluster setup : control plane HA, etcd backup automatise
- [ ] **P1** RBAC : roles par namespace, ServiceAccounts dedies, least privilege
- [ ] **P1** Network Policies : default deny ingress/egress, whitelist explicite
- [ ] **P2** Storage : PVC par service stateful, StorageClass adaptee, backup
- [ ] **P2** Resource limits : requests/limits CPU+memory sur tous les pods
- [ ] **P2** Health probes : liveness, readiness, startup sur chaque Deployment
- [ ] **P3** Logging : stack centralisee (stdout → collecteur → stockage)
- [ ] **P3** Backup etcd : snapshots reguliers, procedure restore testee
- [ ] **P3** Upgrade : procedure kubeadm upgrade, drain/uncordon, rollback plan

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Pas de resource limits | Definir requests et limits sur chaque container |
| RBAC cluster-admin partout | Roles scopes par namespace, least privilege |
| Pas de NetworkPolicy | Default deny + whitelist par service |
| Secrets en clair dans YAML | Utiliser sealed-secrets, external-secrets ou vault |
| etcd sans backup | Snapshot cron + stockage hors-cluster |
| Pas de health probes | Liveness + readiness minimum sur chaque pod |

## Application Miyukini

| Concept CKA | Composant Miyukini | Implementation |
|-------------|-------------------|----------------|
| Deployment | Central, MiyuCloud, services | Replicas, rolling update strategy |
| StatefulSet | KindMother (SQLite) | PVC dedie, backup pre-upgrade |
| DaemonSet | Monitoring agents | Metriques par noeud |
| Ingress | MiyuCloud web (:11442) | TLS termination, rate limiting |
| NetworkPolicy | API interne (:11440) | Isoler API du trafic web |
| RBAC | Multi-service | ServiceAccount par service, roles dedies |
| Secrets | Crypto keys, passphrases | Sealed-secrets, jamais en ConfigMap |
| etcd backup | Etat cluster | Snapshot automatise, restore teste |
