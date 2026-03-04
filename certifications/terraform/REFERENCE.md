<!-- @id cert.hugo.terraform -->
<!-- @do provide_terraform_reference_knowledge -->
<!-- @role infrastructure_as_code -->
<!-- @layer reference -->
<!-- @human Referentiel Terraform Associate pour Hugo -->

# Terraform Associate — Referentiel Hugo

> **TL;DR** : Certification HashiCorp en Infrastructure as Code, couvrant workflow, HCL, state et modules.
> Pour Hugo : reference pour provisionner et gerer l'infra Miyukini de maniere reproductible et versionee.
> Impact : elimine drift, garantit reproductibilite, structure l'infra comme du code auditable.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | HashiCorp |
| Obligation | Standard industrie pour IaC, recommande pour DevOps/SRE |
| Validite | 2 ans (recertification requise) |
| Prerequis | Aucun formel, experience Terraform CLI recommandee |

## Domaine d'application

Provisionnement et gestion d'infrastructure via code declaratif (HCL). Couvre cloud, on-premise et hybride. Gestion d'etat, modules reutilisables, collaboration equipe via remote state.

## Workflow Terraform

| Etape | Commande | Action |
|-------|----------|--------|
| 1. Init | `terraform init` | Telecharge providers, initialise backend |
| 2. Validate | `terraform validate` | Verifie syntaxe HCL sans appel API |
| 3. Plan | `terraform plan` | Preview des changements (diff) |
| 4. Apply | `terraform apply` | Applique les changements |
| 5. Destroy | `terraform destroy` | Supprime toute l'infra geree |
| — | `terraform import` | Importe ressource existante dans le state |
| — | `terraform state` | Manipulation directe du state (avance) |

## Concepts HCL

| Concept | Description | Exemple |
|---------|-------------|---------|
| Resource | Infrastructure a creer/gerer | `resource "aws_instance" "web" {}` |
| Data Source | Lecture d'infra existante (read-only) | `data "aws_ami" "latest" {}` |
| Variable | Parametres d'entree | `variable "region" { type = string }` |
| Output | Valeurs exposees apres apply | `output "ip" { value = aws_instance.web.public_ip }` |
| Local | Valeurs calculees internes | `locals { name = "${var.project}-${var.env}" }` |
| Provider | Plugin API (AWS, GCP, Azure, etc.) | `provider "aws" { region = var.region }` |
| Module | Bloc reutilisable de ressources | `module "vpc" { source = "./modules/vpc" }` |

## State Management

| Aspect | Bonne pratique | Risque si ignore |
|--------|---------------|-----------------|
| Remote backend | S3 + DynamoDB, GCS, Terraform Cloud | State perdu, conflits equipe |
| State locking | Activer verrouillage (DynamoDB, consul) | Corruptions concurrentes |
| State encryption | Chiffrement at-rest du backend | Secrets exposes dans le state |
| Sensitive outputs | `sensitive = true` sur les outputs | Secrets affiches en clair dans les logs |
| State isolation | Un state par environnement (dev/staging/prod) | Blast radius maximal |

## Structure modules

| Fichier | Contenu |
|---------|---------|
| `main.tf` | Ressources principales |
| `variables.tf` | Declarations variables (type, default, validation) |
| `outputs.tf` | Valeurs exposees |
| `versions.tf` | Contraintes provider et Terraform |
| `terraform.tfvars` | Valeurs par defaut (NE PAS committer les secrets) |
| `README.md` | Documentation module |

## Checklist Hugo

- [ ] **P1** Configurer remote state backend (S3+lock ou Terraform Cloud)
- [ ] **P1** Structure modules : separer par composant (network, compute, data)
- [ ] **P1** Variable validation : `validation {}` blocks sur inputs critiques
- [ ] **P2** Documenter outputs : description sur chaque output
- [ ] **P2** Provider version pinning : `required_providers` avec contraintes `~>`
- [ ] **P2** State locking : verifier activation sur le backend
- [ ] **P3** Drift detection : `terraform plan` en CI (schedule ou pre-merge)
- [ ] **P3** Plan review : obligation review humain avant `apply` en prod

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| State local en equipe | Remote backend avec locking |
| Pas de plan avant apply | Toujours `plan` puis review avant `apply` |
| Secrets dans tfvars commites | Utiliser variables d'env, vault, ou secrets manager |
| Modules monolithiques | Decomposer par responsabilite (network, compute, IAM) |
| Provider sans version pin | `required_providers` avec contrainte de version |
| Provisioners partout | Eviter, preferer cloud-init, user_data, ou config mgmt |
| Un seul state pour tout | Isoler par environnement et par composant |
| Import sans refactor | Apres import, aligner le code HCL sur l'etat reel |

## Application Miyukini

| Concept Terraform | Composant Miyukini | Implementation |
|-------------------|-------------------|----------------|
| Remote state | Infra Miyukini | Backend S3/GCS pour etat partage equipe |
| Modules | Services (Central, MiyuCloud, LLM Bridge) | Module par service : compute + network + storage |
| Variables | Config par env | dev/staging/prod tfvars separes |
| Outputs | Endpoints services | IPs, URLs, ports exposes documentes |
| State isolation | Environnements | State par env (dev, staging, prod) |
| Drift detection | CI/CD pipeline | `terraform plan` automatise pre-merge |
| Import | Infra existante | Import serveurs/DNS existants dans le state |
