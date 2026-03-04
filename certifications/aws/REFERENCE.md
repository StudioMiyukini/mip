<!-- @id cert.hugo.aws -->
<!-- @do provide_aws_reference_knowledge -->
<!-- @role cloud_infrastructure -->
<!-- @layer reference -->
<!-- @human Referentiel AWS Certifications pour Hugo -->

# AWS Certifications — Reference Hugo

**TL;DR** : 4 certifications AWS cles pour DevOps/Infra : Cloud Practitioner (fondation), Solutions Architect Associate, SysOps Administrator Associate (labs pratiques), DevOps Engineer Professional. Validite 3 ans, renouvellement par re-examen. Pearson VUE.

**Organisme** : AWS | **Examinateur** : Pearson VUE | **Validite** : 3 ans | **Obligation** : Aucune

---

## 1. Parcours certification

```
Cloud Practitioner (CLF-C02) -> Solutions Architect Associate (SAA-C03) + SysOps Admin Associate (SOA-C02) -> DevOps Engineer Professional (DOP-C02)
```

| Cert | Code | Niveau | Questions | Duree | Score min | Cout |
|------|------|--------|-----------|-------|-----------|------|
| Cloud Practitioner | CLF-C02 | Foundational | 65 | 90 min | 700/1000 | $100 |
| Solutions Architect | SAA-C03 | Associate | 65 | 130 min | 720/1000 | $150 |
| SysOps Admin | SOA-C02 | Associate | 65 | 180 min | 720/1000 | $150 |
| DevOps Engineer | DOP-C02 | Professional | 75 | 180 min | 750/1000 | $300 |

---

## 2. Cloud Practitioner (CLF-C02)

Experience recommandee : 6 mois exposition AWS.

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| Cloud Concepts | 24% | Value proposition, pay-as-you-go, Well-Architected (6 piliers), IaaS/PaaS/SaaS |
| Security & Compliance | 30% | Shared Responsibility Model, IAM, MFA, Organizations/SCPs, Shield/WAF/GuardDuty, KMS, CloudTrail |
| Cloud Technology & Services | 34% | EC2/Lambda/ECS/EKS, S3/EBS/EFS, RDS/Aurora/DynamoDB, VPC/Route53/CloudFront, CloudWatch/CloudFormation |
| Billing & Support | 12% | On-Demand/Reserved/Spot/Savings Plans, Cost Explorer/Budgets, plans Support |

---

## 3. Solutions Architect Associate (SAA-C03)

Experience recommandee : 1+ an conception solutions AWS.

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| Secure Architectures | 30% | IAM avance (SAML/OIDC/SSO), VPC security (SG/NACL/endpoints), chiffrement (KMS/CloudHSM), Cognito, WAF |
| Resilient Architectures | 26% | Multi-tier, decouplage (SQS/SNS/EventBridge), HA Multi-AZ, Auto Scaling, RDS Multi-AZ/Replicas/Aurora Global, DR strategies |
| High-Performing | 24% | EC2 types/placement, Lambda, ECS/EKS, stockage (EBS gp3/io2, EFS), caching (ElastiCache/DAX/CloudFront), analytics (Athena/Kinesis) |
| Cost-Optimized | 20% | EC2 purchasing, right-sizing, S3 classes (7), lifecycle, serverless cost, Cost Explorer |

---

## 4. SysOps Administrator Associate (SOA-C02)

Experience recommandee : 1+ an operations AWS. **Inclut exam labs** (console AWS reelle).

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| Monitoring & Remediation | 20% | CloudWatch (custom metrics, alarms, Logs Insights, Synthetics), CloudTrail, VPC Flow Logs, Config, EventBridge |
| Reliability & BC | 16% | AWS Backup, AMI cross-Region, RDS/DynamoDB backups, S3 versioning/replication, EBS snapshots/DLM, Route 53 failover, DR (RTO/RPO) |
| Deployment & Automation | 18% | CloudFormation (stacks, StackSets, drift, cfn-init), Elastic Beanstalk, SSM (Run Command, Patch Manager, Automation, Parameter Store), EC2 Image Builder |
| Security & Compliance | 16% | IAM (permission boundaries, SCPs), Organizations, Control Tower, KMS, Secrets Manager, S3 policies/Block Public Access, Config, Inspector |
| Networking & CDN | 18% | VPC (subnets, IGW, NAT GW), peering/Transit Gateway, endpoints, SG vs NACLs, ELB (ALB/NLB), CloudFront (OAI/OAC), Route 53, Direct Connect |
| Cost & Performance | 12% | Cost Explorer/Budgets, Compute Optimizer, Trusted Advisor, S3 class analysis, right-sizing, caching |

---

## 5. DevOps Engineer Professional (DOP-C02)

Experience recommandee : 2+ ans CI/CD et automatisation AWS. Recommande : SAA et/ou SOA.

| Domaine | Poids | Sujets cles |
|---------|-------|-------------|
| SDLC Automation | 22% | CodeCommit/Build/Deploy/Pipeline/Artifact, buildspec/appspec, blue-green (EC2/ECS/Lambda), canary/rolling/immutable, feature flags, GitOps |
| Config & IaC | 17% | CloudFormation avance (custom resources, macros, StackSets, CDK L1/L2/L3), SSM complet, OpsWorks, EC2 Image Builder, Service Catalog, Config packs |
| Resilient Solutions | 15% | HA Multi-AZ/Region, Auto Scaling (predictive, hooks), Aurora/DynamoDB global, SQS DLQ, DR (pilot light->multi-site), Fault Injection Simulator |
| Monitoring & Logging | 15% | CloudWatch avance (1s metrics, Agent, anomaly, Synthetics, Container Insights), X-Ray, logging centralise (Kinesis->S3/OpenSearch) |
| Incident & Event Response | 14% | EventBridge, SNS fan-out, Lambda event-driven, SSM Incident Manager, remediation auto (CW->SNS->Lambda, Config->SSM, GuardDuty->EventBridge) |
| Security & Compliance | 17% | IAM avance (boundaries, federation, service-linked), Organizations/SCPs, Control Tower, Secrets Manager rotation, KMS, container security (ECR/ECS/EKS), WAF, Security Hub |

---

## 6. Services AWS — Reference rapide

| Categorie | Services cles |
|-----------|---------------|
| **Compute** | EC2, Lambda, ECS, EKS, Fargate, Elastic Beanstalk, Auto Scaling |
| **Storage** | S3 (7 classes), EBS (gp3/io2), EFS, Glacier (Instant/Flexible/Deep) |
| **Database** | RDS, Aurora, DynamoDB, ElastiCache (Redis/Memcached), Redshift |
| **Network** | VPC, ELB (ALB/NLB), Route 53, CloudFront, API Gateway, Direct Connect, Transit Gateway |
| **Security** | IAM, KMS, Secrets Manager, WAF, Shield, GuardDuty, Inspector, Security Hub, Cognito, ACM |
| **Management** | CloudFormation/CDK, CloudWatch, CloudTrail, Config, Systems Manager, EventBridge |
| **CI/CD** | CodeCommit, CodeBuild, CodeDeploy, CodePipeline, CodeArtifact |
| **Analytics** | Kinesis, Athena, OpenSearch, Glue, X-Ray |
| **DR** | AWS Backup, Fault Injection Simulator |

---

## 7. Renouvellement

- Expiration 3 ans apres passage
- Repasser meme examen OU passer niveau superieur (Professional renouvelle Associate)
- Voucher -50% apres chaque examen reussi

**Ordre recommande** : CLF-C02 (2-4 sem) -> SAA-C03 (concevoir) -> SOA-C02 (operer) -> DOP-C02 (tout combiner)

---

## 8. Checklist Hugo

**CLF** : [ ] Shared Responsibility Model [ ] 6 piliers Well-Architected [ ] Services base par categorie [ ] Modeles pricing
**SAA** : [ ] Architectures HA/resilientes (Multi-AZ/Region) [ ] Chiffrement (KMS, SSE, ACM) [ ] Choix DB par use case [ ] Optimisation couts [ ] Decouplage (SQS/SNS/EventBridge)
**SOA** : [ ] CloudWatch (metriques, alarms, logs) [ ] CloudFormation (stacks, StackSets, drift) [ ] SSM (patches, config) [ ] Backup/DR (AWS Backup, AMI, snapshots) [ ] Reseau (VPC, ELB, Route 53)
**DOP** : [ ] Pipeline CI/CD (CodePipeline+Build+Deploy) [ ] Strategies deploiement (blue-green, canary) [ ] Remediation auto (EventBridge->Lambda, Config->SSM) [ ] Monitoring avance (CloudWatch, X-Ray) [ ] Securite (IAM, KMS, Secrets Manager) [ ] CloudFormation avance (CDK, StackSets)

---

## 9. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Deploiement | EC2/ECS pour MiyuCloud, S3 assets statiques, Route 53 DNS |
| CI/CD | CodePipeline+Build ou GitHub Actions (deja utilise) |
| Monitoring | CloudWatch metriques, X-Ray tracing API |
| Securite | IAM acces, KMS chiffrement MiyuCloud, GuardDuty detection |
| IaC | CloudFormation/CDK pour infra en code |
| Cout | Spot/Savings Plans dev, On-Demand prod, S3 Intelligent-Tiering |
| Portabilite | LOI-1 — AWS = hebergeur, pas dependance. Architecture portable |
| DR | AWS Backup + cross-Region replication pour MiyuCloud |
| Hugo | Supervise infra AWS, pipelines CI/CD, monitoring, securite cloud |

---

*Sources : AWS CLF-C02/SAA-C03/SOA-C02/DOP-C02 Exam Guides (2026), AWS Well-Architected Framework, AWS Documentation*
