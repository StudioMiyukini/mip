<!-- @id cert.victor.ceh -->
<!-- @do provide_ceh_reference_knowledge -->
<!-- @role ethical_hacking -->
<!-- @layer reference -->
<!-- @human Referentiel CEH pour Victor -->

# CEH — Referentiel Victor

> **TL;DR** : Certification EC-Council en hacking ethique, couvrant 5 phases d'attaque et toutes surfaces.
> Pour Victor : methodologie offensive pour tester la resistance des services Miyukini.
> Impact : structure les pentests P4, spot-checks P3, et validation des reponses aux menaces.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | EC-Council (International Council of E-Commerce Consultants) |
| Obligation | Recommande pour roles pentest et audit securite offensif |
| Validite | 3 ans, renouvellement par ECE (120 credits sur 3 ans) |
| Prerequis | 2 ans experience securite IT ou formation officielle EC-Council |

## Domaine d'application

Methodologie de test d'intrusion ethique : reconnaissance, scanning, exploitation, maintien d'acces et analyse post-intrusion. Couvre web, reseau, systeme, mobile, IoT et cloud.

## 5 Phases de pentest

| Phase | Objectif | Outils cles |
|-------|----------|-------------|
| 1. Reconnaissance | Cartographier la cible (passive/active) | OSINT, whois, Shodan, theHarvester, Google dorks |
| 2. Scanning | Identifier ports, services, vulnerabilites | nmap, Nessus, OpenVAS, Nikto |
| 3. Gaining Access | Exploiter vulnerabilites identifiees | Metasploit, SQLmap, Burp Suite, Hydra |
| 4. Maintaining Access | Persister dans le systeme compromis | Backdoors, rootkits, tunnels, C2 frameworks |
| 5. Covering Tracks | Effacer traces (perspective attaquant) | Log tampering, timestomping, steganographie |

## Taxonomie d'attaques

| Surface | Attaques principales | Ref OWASP |
|---------|---------------------|-----------|
| Web App | SQLi, XSS, CSRF, SSRF, IDOR, RCE | A03, A07, A01, A10 |
| Reseau | Sniffing, MITM, ARP poisoning, DNS spoofing | — |
| Systeme | Privilege escalation, buffer overflow, pass-the-hash | — |
| Social Engineering | Phishing, pretexting, baiting, tailgating | — |
| Wireless | Evil twin, deauth, WPA cracking | — |
| Mobile | Insecure storage, cert pinning bypass, reverse eng. | M1-M10 |
| IoT | Default creds, firmware extraction, MQTT abuse | — |
| Cloud | Misconfig S3/IAM, SSRF metadata, token theft | — |

## Mapping OWASP Top 10 (2021)

| Ref | Risque | Test Victor |
|-----|--------|-------------|
| A01 | Broken Access Control | IDOR, privilege escalation, force browse |
| A02 | Cryptographic Failures | Protocoles faibles, stockage clair, cles exposees |
| A03 | Injection | SQLi, XSS, command injection, template injection |
| A04 | Insecure Design | Threat modeling, abuse cases, business logic flaws |
| A05 | Security Misconfiguration | Headers, CORS, directory listing, defaults |
| A06 | Vulnerable Components | Dependency audit, CVE check, version pinning |
| A07 | Auth Failures | Brute force, session fixation, credential stuffing |
| A08 | Software & Data Integrity | CI/CD poisoning, deserialization, unsigned updates |
| A09 | Logging & Monitoring Failures | Absence de logs, alertes manquantes |
| A10 | SSRF | Internal service access, metadata endpoint |

## Checklist Victor

- [ ] **P1** Definir scope du pentest (services cibles, limites, autorisations)
- [ ] **P1** Reconnaissance passive (ports exposes, endpoints publics, deps)
- [ ] **P2** Scanner vulnerabilites (nmap services, dependency audit, OWASP ZAP)
- [ ] **P2** Tester exploitation (injection, auth bypass, privilege escalation)
- [ ] **P2** Tester escalade de privileges (horizontal et vertical)
- [ ] **P3** Verifier persistance (sessions, tokens, cles en memoire)
- [ ] **P3** Produire rapport avec severite, preuve, remediation
- [ ] **P3** Valider corrections et re-tester

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Pentest sans scope defini | Toujours documenter perimetre et regles d'engagement |
| Scanner sans analyser | Triager manuellement les resultats, eliminer faux positifs |
| Tester uniquement le happy path | Inclure abus cases, inputs malformes, limites |
| Ignorer social engineering | Evaluer facteur humain (phishing simulation) |
| Rapport sans remediation | Chaque finding = severite + preuve + correction |
| Outils sans comprehension | Comprendre l'attaque, pas seulement executer l'outil |

## Niveaux de severite (reporting)

| Niveau | Critere | Action requise |
|--------|---------|---------------|
| Critique | Acces complet, exfiltration donnees | Correction immediate, bloquant |
| Haute | Privilege escalation, auth bypass | Correction avant release |
| Moyenne | Information disclosure, XSS stocke | Correction planifiee |
| Basse | Informations debug, headers verbeux | Recommandation |
| Info | Observation sans impact direct | Documentation |

## Application Miyukini

| Phase CEH | Composant Miyukini | Test concret |
|-----------|-------------------|--------------|
| Recon | Services exposes (MiyuCloud web :11442) | Scan ports, enumeration endpoints |
| Scanning | API REST (axum) | nmap, OWASP ZAP sur endpoints |
| Gaining Access | Auth (Argon2id, sessions) | Brute force, timing attack F-02 |
| Maintaining Access | Tokens, cles memoire | Session hijack, key extraction |
| Covering Tracks | Logs applicatifs | Verification completude logging |
| OWASP A01 | RBAC services | Force browse, IDOR sur ressources |
| OWASP A02 | MiyuCloud crypto | Verification ChaCha20, canary, HKDF |
| OWASP A03 | Inputs utilisateur | XSS templates web (defaut F-03 connu) |
| OWASP A06 | Cargo.lock | `cargo audit`, deps vulnerables |
