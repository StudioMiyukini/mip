# AWS Certifications — Reference Hugo

> Certifications Amazon Web Services pour l'ingenierie DevOps et infrastructure cloud

**Organisme** : Amazon Web Services (AWS)
**Examinateur** : Pearson VUE (centre d'examen ou surveillance en ligne)
**Obligation legale** : Aucune (mais forte demande marche, appels d'offres, credibilite)
**Validite** : 3 ans (renouvellement par re-examen ou examen de niveau superieur)
**Prerequis** : Aucun formel (experience recommandee par niveau)

---

## 1. Parcours de certification DevOps/Infrastructure

```
Cloud Practitioner (Foundational)
        |
        v
Solutions Architect Associate  +  SysOps Administrator Associate
        |                                    |
        +------------------------------------+
        |
        v
DevOps Engineer Professional
```

### Vue d'ensemble

| Certification | Code | Niveau | Questions | Duree | Score min | Cout |
|--------------|------|--------|-----------|-------|-----------|------|
| **Cloud Practitioner** | CLF-C02 | Foundational | 65 | 90 min | 700/1000 | $100 |
| **Solutions Architect Associate** | SAA-C03 | Associate | 65 | 130 min | 720/1000 | $150 |
| **SysOps Administrator Associate** | SOA-C02 | Associate | 65 | 180 min | 720/1000 | $150 |
| **DevOps Engineer Professional** | DOP-C02 | Professional | 75 | 180 min | 750/1000 | $300 |

---

## 2. AWS Certified Cloud Practitioner (CLF-C02)

### Informations

| Champ | Detail |
|-------|--------|
| **Niveau** | Foundational |
| **Experience recommandee** | 6 mois d'exposition a AWS (technique ou business) |
| **Format** | QCM + reponses multiples, pas supervise, livre ouvert |

### Domaines et ponderation

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| **Cloud Concepts** | 24% | Value proposition AWS, economics (pay-as-you-go), Well-Architected Framework (6 piliers), modeles cloud (IaaS/PaaS/SaaS), modeles deploiement (public/prive/hybride) |
| **Security and Compliance** | 30% | Shared Responsibility Model, IAM (users/groups/roles/policies), MFA, AWS Organizations, SCPs, Shield/WAF/GuardDuty/Inspector/Macie, KMS, CloudTrail, Config, Artifact |
| **Cloud Technology and Services** | 34% | EC2/Lambda/ECS/EKS/Fargate, S3/EBS/EFS/Glacier, RDS/Aurora/DynamoDB/ElastiCache, VPC/Route53/CloudFront, CloudWatch/CloudFormation, Migration Hub/Snow Family, Regions/AZ/Edge |
| **Billing, Pricing, and Support** | 12% | On-Demand/Reserved/Savings Plans/Spot, Free Tier, Cost Explorer/Budgets, plans Support (Basic→Enterprise), tags allocation |

### Services cles a connaitre

EC2, S3, IAM, VPC, RDS, Lambda, CloudWatch, CloudFormation, CloudTrail, Route 53, CloudFront, SNS, SQS, DynamoDB, EBS, EFS, Auto Scaling, ELB, AWS Organizations, KMS, Shield, WAF, Trusted Advisor, Cost Explorer, Budgets

---

## 3. AWS Certified Solutions Architect Associate (SAA-C03)

### Informations

| Champ | Detail |
|-------|--------|
| **Niveau** | Associate |
| **Experience recommandee** | 1+ an de conception de solutions sur AWS |
| **Format** | QCM + reponses multiples |

### Domaines et ponderation

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| **Design Secure Architectures** | 30% | IAM avance (federation SAML/OIDC, SSO), VPC security (SG/NACL/endpoints/PrivateLink), chiffrement (KMS CMK/CloudHSM/SSE), Secrets Manager, Cognito, WAF/Shield/GuardDuty |
| **Design Resilient Architectures** | 26% | Multi-tier, decouplage (SQS/SNS/EventBridge/Step Functions), HA (Multi-AZ, cross-Region), Auto Scaling, ELB (ALB/NLB), RDS Multi-AZ/Read Replicas/Aurora Global, DR strategies (Backup&Restore → Multi-Site), Route 53 routing |
| **Design High-Performing Architectures** | 24% | EC2 instance types/placement groups, Lambda optimization, ECS vs EKS, stockage (EBS types gp3/io2, EFS, instance store), S3 Transfer Acceleration, selection DB (RDS vs DynamoDB vs ElastiCache vs Redshift), caching (ElastiCache/DAX/CloudFront), analytics (Athena/Kinesis/Glue) |
| **Design Cost-Optimized Architectures** | 20% | EC2 purchasing (On-Demand/Reserved/Savings Plans/Spot/Dedicated), right-sizing (Compute Optimizer), S3 storage classes (7 classes), lifecycle rules, serverless cost model, Cost Explorer/Budgets |

### Services cles

EC2, EBS, EFS, S3, RDS, Aurora, DynamoDB, ElastiCache, Redshift, VPC, ELB (ALB/NLB), Auto Scaling, Route 53, CloudFront, API Gateway, Lambda, ECS, EKS, Fargate, SQS, SNS, EventBridge, Step Functions, Kinesis, Athena, CloudFormation, IAM, KMS, Cognito, WAF, Shield, GuardDuty, Secrets Manager, Systems Manager, Direct Connect, Transit Gateway, Global Accelerator, Glue, EMR

---

## 4. AWS Certified SysOps Administrator Associate (SOA-C02)

### Informations

| Champ | Detail |
|-------|--------|
| **Niveau** | Associate |
| **Experience recommandee** | 1+ an d'operations/administration systeme sur AWS |
| **Particularite** | Inclut des **exam labs** (taches pratiques dans une console AWS reelle) |
| **Difficulte** | Considere comme l'examen Associate le plus difficile (labs pratiques) |

### Domaines et ponderation

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| **Monitoring, Logging, and Remediation** | 20% | CloudWatch (metriques custom, alarms, Logs Insights, Synthetics), CloudTrail, VPC Flow Logs, Config rules/remediation, EventBridge, SSM OpsCenter/Incident Manager |
| **Reliability and Business Continuity** | 16% | AWS Backup, AMI cross-Region, RDS backups/PITR, DynamoDB backups, S3 versioning/replication, EBS snapshots/DLM, Route 53 failover, Auto Scaling health checks, DR (RTO/RPO) |
| **Deployment, Provisioning, and Automation** | 18% | CloudFormation (stacks, StackSets, drift, helpers cfn-init/signal/hup), Elastic Beanstalk (deployment policies), SSM (Run Command, Patch Manager, State Manager, Automation, Session Manager, Parameter Store), EC2 Image Builder, Service Catalog |
| **Security and Compliance** | 16% | IAM avance (permission boundaries, SCPs), Organizations, Control Tower, KMS (rotation, key policies), Secrets Manager, S3 policies/Block Public Access/Object Lock, ACM, Config, Inspector, GuardDuty, IAM Identity Center |
| **Networking and Content Delivery** | 18% | VPC (subnets pub/priv, route tables, IGW, NAT GW), VPC peering/Transit Gateway, endpoints, SG vs NACLs, ELB (ALB routing, NLB static IP), CloudFront (OAI/OAC, signed URLs), Route 53, Direct Connect, VPN |
| **Cost and Performance Optimization** | 12% | Cost Explorer/Budgets, Compute Optimizer, Trusted Advisor, S3 storage class analysis, EC2 right-sizing, EBS optimization, caching (ElastiCache, CloudFront) |

### Services cles

EC2, EBS, S3, RDS, DynamoDB, VPC, ELB, Auto Scaling, CloudFormation, CloudWatch (Metrics/Logs/Alarms), CloudTrail, Config, Systems Manager (tous les sous-services), Route 53, CloudFront, IAM, KMS, Secrets Manager, Organizations, Control Tower, Elastic Beanstalk, AWS Backup, EventBridge, SNS, Lambda, Inspector, GuardDuty, Trusted Advisor, Cost Explorer, Direct Connect, VPN, Transit Gateway, ACM

---

## 5. AWS Certified DevOps Engineer Professional (DOP-C02)

### Informations

| Champ | Detail |
|-------|--------|
| **Niveau** | Professional |
| **Experience recommandee** | 2+ ans de provisionnement, operation et gestion d'environnements AWS avec focus CI/CD et automatisation |
| **Prerequis recommande** | Solutions Architect Associate et/ou SysOps Administrator Associate |
| **Difficulte** | Avance — questions scenarios longs et complexes |

### Domaines et ponderation

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| **SDLC Automation** | 22% | CodeCommit/CodeBuild/CodeDeploy/CodePipeline/CodeArtifact, buildspec.yml, appspec.yml, deploiement blue-green (EC2/ECS/Lambda), strategies (in-place/rolling/canary/linear/immutable), feature flags, Lambda versions/aliases/traffic shifting, API Gateway canary, GitOps |
| **Configuration Management and IaC** | 17% | CloudFormation avance (custom resources, macros, StackSets, drift, deletion policies, nested stacks), CDK (constructs L1/L2/L3), SSM (State Manager, Automation, Patch Manager, Parameter Store, Inventory, Run Command), OpsWorks, EC2 Image Builder, Service Catalog, Config conformance packs |
| **Resilient Cloud Solutions** | 15% | HA Multi-AZ/Multi-Region, Auto Scaling (predictive, lifecycle hooks, instance refresh), ELB health checks, RDS/Aurora failover/Global DB, DynamoDB global tables, SQS DLQ, DR (RPO/RTO, pilot light → multi-site), Fault Injection Simulator, design stateless/immuable |
| **Monitoring and Logging** | 15% | CloudWatch avance (custom metrics 1s, Agent, Metric Math, anomaly detection, Synthetics, Container Insights, Embedded Metric Format, cross-account dashboards), X-Ray (tracing, service map, sampling), logging centralise (Kinesis Firehose → S3/OpenSearch), Config aggregators |
| **Incident and Event Response** | 14% | EventBridge (rules, patterns, event buses custom/cross-account), SNS fan-out/filtering, Lambda event-driven, SSM Incident Manager/OpsCenter, remediation automatisee (CloudWatch → SNS → Lambda, Config → SSM Automation, GuardDuty → EventBridge → Lambda), Health API, runbooks/playbooks |
| **Security and Compliance** | 17% | IAM avance (permission boundaries, federation SAML, service-linked roles), Organizations (SCPs, tag policies), Control Tower guardrails, Secrets Manager (rotation Lambda), KMS (key policies, grants, envelope encryption), ACM, security automation (Config + GuardDuty + Security Hub + Inspector + Macie), container security (ECR scan, ECS task roles, EKS IRSA), WAF rules |

### Services cles

**CI/CD** : CodeCommit, CodeBuild, CodeDeploy, CodePipeline, CodeArtifact
**Compute** : EC2, Lambda, ECS, EKS, Fargate, Elastic Beanstalk, Auto Scaling
**IaC** : CloudFormation, CDK, Service Catalog
**Management** : Systems Manager (tous), OpsWorks, EC2 Image Builder
**Monitoring** : CloudWatch, X-Ray, CloudTrail, VPC Flow Logs
**Event-Driven** : EventBridge, SNS, SQS, Step Functions, Lambda
**Storage/DB** : S3, EBS, RDS, Aurora, DynamoDB, ElastiCache
**Networking** : VPC, ELB, Route 53, CloudFront, API Gateway, Direct Connect, Transit Gateway
**Security** : IAM, KMS, Secrets Manager, ACM, WAF, Shield, GuardDuty, Inspector, Macie, Security Hub, Cognito, Organizations, Control Tower
**Analytics** : Kinesis, Athena, OpenSearch, Glue
**DR** : AWS Backup, Fault Injection Simulator

---

## 6. Services AWS par categorie (reference rapide)

### Compute

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **EC2** | Serveurs virtuels, instance types, Auto Scaling, placement groups | Tous |
| **Lambda** | Serverless, event-driven, max 15 min, versions/aliases | Tous |
| **ECS** | Conteneurs geres, task definitions, services, Fargate | SAA, SOA, DOP |
| **EKS** | Kubernetes gere, IRSA, Fargate profiles | SAA, DOP |
| **Elastic Beanstalk** | PaaS, deployment policies, .ebextensions | SOA, DOP |
| **Fargate** | Serverless containers, pas de gestion EC2 | SAA, DOP |

### Storage

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **S3** | Stockage objets, 7 classes, lifecycle, replication, versioning | Tous |
| **EBS** | Stockage bloc, gp3/io2/st1/sc1, snapshots | Tous |
| **EFS** | Systeme fichiers NFS, elastic, Multi-AZ | SAA, SOA |
| **S3 Glacier** | Archivage long terme (Instant/Flexible/Deep Archive) | SAA, SOA |

### Database

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **RDS** | DB relationnelle geree, Multi-AZ, Read Replicas, PITR | Tous |
| **Aurora** | MySQL/PostgreSQL compatible, Global DB, Serverless v2 | SAA, DOP |
| **DynamoDB** | NoSQL, global tables, DAX, on-demand/provisioned | Tous |
| **ElastiCache** | Cache in-memory (Redis/Memcached) | SAA, DOP |
| **Redshift** | Data warehouse, Spectrum, RA3 nodes | SAA |

### Networking

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **VPC** | Reseau virtuel, subnets, route tables, SG, NACLs | Tous |
| **ELB** | Load balancing (ALB Layer 7, NLB Layer 4) | Tous |
| **Route 53** | DNS, routing policies, health checks, failover | Tous |
| **CloudFront** | CDN, edge caching, OAC, signed URLs | SAA, SOA, DOP |
| **API Gateway** | API REST/HTTP/WebSocket, stages, canary | SAA, DOP |
| **Direct Connect** | Connexion reseau dediee vers AWS | SAA, SOA |
| **Transit Gateway** | Hub de connectivite reseau multi-VPC | SAA, SOA, DOP |

### Security

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **IAM** | Identity, policies, roles, federation, permission boundaries | Tous |
| **KMS** | Gestion des cles de chiffrement, CMK, rotation | Tous |
| **Secrets Manager** | Secrets avec rotation automatique (Lambda) | SAA, SOA, DOP |
| **WAF** | Pare-feu applicatif web, regles, rate limiting | SAA, DOP |
| **Shield** | Protection DDoS (Standard gratuit, Advanced) | SAA, DOP |
| **GuardDuty** | Detection de menaces, ML-based | SAA, SOA, DOP |
| **Inspector** | Scan vulnerabilites (EC2, ECR, Lambda) | SOA, DOP |
| **Security Hub** | Agregation des findings securite | DOP |
| **Cognito** | Authentication users (User Pools + Identity Pools) | SAA, DOP |

### Management et DevOps

| Service | Usage | Niveau exam |
|---------|-------|-------------|
| **CloudFormation** | IaC declaratif, stacks, StackSets, CDK | Tous sauf CLF |
| **CloudWatch** | Metriques, logs, alarms, dashboards, Synthetics | Tous |
| **CloudTrail** | Audit trail API, organization trails | Tous |
| **Config** | Compliance, rules, conformance packs, remediation | SOA, DOP |
| **Systems Manager** | Run Command, Patch Mgr, State Mgr, Parameter Store, Automation | SOA, DOP |
| **CodePipeline** | Orchestration CI/CD, stages, manual approvals | DOP |
| **CodeBuild** | Build service, buildspec.yml, environments | DOP |
| **CodeDeploy** | Deployment service, appspec.yml, blue-green | DOP |
| **EventBridge** | Event bus, rules, patterns, cross-account | SOA, DOP |
| **X-Ray** | Tracing distribue, service map, segments | DOP |

---

## 7. Renouvellement et bonnes pratiques

### Renouvellement

- Toutes les certifications expirent **3 ans** apres la date de passage
- Options de renouvellement :
  1. **Repasser le meme examen** avant expiration
  2. **Passer un examen de niveau superieur** (Professional renouvelle les Associate)
- Apres chaque examen reussi : **voucher -50%** pour le prochain examen

### Ordre de preparation recommande

1. **Cloud Practitioner** (CLF-C02) — 2-4 semaines de preparation, vocabulaire et concepts
2. **Solutions Architect Associate** (SAA-C03) — Le plus populaire, enseigne le "comment concevoir"
3. **SysOps Administrator Associate** (SOA-C02) — Enseigne le "comment operer", labs pratiques
4. **DevOps Engineer Professional** (DOP-C02) — Combine tout : CI/CD + operations + securite

### Ressources recommandees

- AWS Skill Builder (formation officielle gratuite et payante)
- Practice Exams officiels AWS
- Tutorials Dojo / Stephane Maarek (Udemy)
- AWS Well-Architected Framework (whitepaper)
- DevOps on AWS (whitepaper)
- AWS Free Tier pour labs pratiques

---

## 8. Checklist Hugo — Audit AWS

### Cloud Practitioner
- [ ] Comprendre le Shared Responsibility Model
- [ ] Connaitre les 6 piliers du Well-Architected Framework
- [ ] Identifier les services de base par categorie (compute, storage, DB, network)
- [ ] Comprendre les modeles de pricing (On-Demand, Reserved, Spot, Savings Plans)

### Solutions Architect Associate
- [ ] Concevoir des architectures HA et resilientes (Multi-AZ, multi-Region)
- [ ] Maitriser le chiffrement (KMS, SSE, ACM)
- [ ] Choisir la bonne base de donnees par use case
- [ ] Optimiser les couts (right-sizing, storage classes, serverless)
- [ ] Concevoir des architectures decouplees (SQS, SNS, EventBridge)

### SysOps Administrator Associate
- [ ] Configurer CloudWatch (metriques, alarms, logs, dashboards)
- [ ] Maitriser CloudFormation (stacks, StackSets, drift detection)
- [ ] Gerer les patches et la configuration (Systems Manager)
- [ ] Implementer le backup et DR (AWS Backup, AMI, snapshots)
- [ ] Configurer le reseau (VPC, ELB, Route 53, CloudFront)

### DevOps Engineer Professional
- [ ] Concevoir et implementer un pipeline CI/CD complet (CodePipeline + CodeBuild + CodeDeploy)
- [ ] Maitriser les strategies de deploiement (blue-green, canary, rolling)
- [ ] Automatiser la remediation (EventBridge → Lambda, Config → SSM)
- [ ] Implementer le monitoring avance (CloudWatch, X-Ray, logging centralise)
- [ ] Gerer la securite (IAM avance, KMS, Secrets Manager, GuardDuty)
- [ ] Maitriser CloudFormation avance (custom resources, StackSets, CDK)

---

## 9. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **Deploiement** | Si deploiement sur AWS : EC2/ECS pour MiyuCloud server, S3 pour assets statiques, Route 53 pour DNS |
| **CI/CD AWS** | CodePipeline + CodeBuild pour le build Rust workspace, CodeDeploy pour le deploiement |
| **Alternative** | GitHub Actions (deja utilise) peut remplacer le CodeSuite AWS |
| **Monitoring** | CloudWatch pour les metriques MiyuCloud, X-Ray pour le tracing des requetes API |
| **Securite** | IAM pour les acces, KMS pour le chiffrement des donnees MiyuCloud, GuardDuty pour la detection |
| **Infrastructure** | CloudFormation ou CDK pour definir l'infrastructure en code |
| **Cout** | EC2 Spot/Savings Plans pour les serveurs de dev, On-Demand pour la prod, S3 Intelligent-Tiering pour le stockage |
| **Auto-hebergement** | LOI-1 (pas de dependance externe) — AWS est un hebergeur, pas une dependance. L'architecture doit rester portable |
| **DR** | AWS Backup + cross-Region replication pour la resilience des donnees MiyuCloud |
| **Hugo** | Hugo supervise l'infrastructure AWS, configure les pipelines CI/CD, gere le monitoring et la securite cloud |

---

*Sources : AWS Certification Official Pages (2026), AWS CLF-C02/SAA-C03/SOA-C02/DOP-C02 Exam Guides, AWS Well-Architected Framework, AWS Documentation*
