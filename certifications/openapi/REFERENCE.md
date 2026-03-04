<!-- @id cert.francois.openapi -->
<!-- @do provide_openapi_reference_knowledge -->
<!-- @role api_standards -->
<!-- @layer reference -->
<!-- @human Referentiel OpenAPI 3.1 pour Francois -->

# OpenAPI Specification 3.1 — Referentiel Francois

> **TL;DR** : Standard de description d'API REST (ex-Swagger). Definit la structure, les operations, les schemas et la securite des API HTTP. Reference Francois pour concevoir, documenter et valider les API axum des services Miyukini.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | OpenAPI Initiative (Linux Foundation) |
| Obligation | Volontaire (standard de facto pour les API REST) |
| Validite | Permanente (derniere version : 3.1.0, alignee JSON Schema 2020-12) |
| Prerequis | Aucun |

## Domaine d'application

Specification machine-readable (YAML/JSON) pour decrire les API HTTP. Permet la generation automatique de documentation, SDKs clients, tests et validation. Compatible avec tout langage et framework serveur.

## Structure du document OpenAPI

| Section | Requis | Description |
|---------|--------|-------------|
| `openapi` | Oui | Version de la spec (ex: "3.1.0") |
| `info` | Oui | Titre, version, description, contact, license |
| `servers` | Non | URLs des serveurs (dev, staging, prod) |
| `paths` | Oui | Endpoints et operations (GET, POST, PUT, DELETE, PATCH) |
| `components` | Non | Schemas, responses, parameters, securitySchemes reutilisables |
| `security` | Non | Schemas de securite globaux |
| `tags` | Non | Groupement logique des operations |
| `webhooks` | Non | Callbacks evenementiels (3.1+) |

## Operations et methodes HTTP

| Methode | Usage | Idempotent | Corps | Exemple Miyukini |
|---------|-------|------------|-------|-----------------|
| GET | Lire une ressource | Oui | Non | `GET /api/services` |
| POST | Creer une ressource | Non | Oui | `POST /api/miyucloud/upload` |
| PUT | Remplacer entierement | Oui | Oui | `PUT /api/services/{id}` |
| PATCH | Mise a jour partielle | Non | Oui | `PATCH /api/settings` |
| DELETE | Supprimer | Oui | Non | `DELETE /api/miyucloud/files/{id}` |

## Codes de statut HTTP

| Plage | Categorie | Codes courants |
|-------|-----------|----------------|
| 2xx | Succes | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved, 304 Not Modified |
| 4xx | Erreur client | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable |
| 5xx | Erreur serveur | 500 Internal, 502 Bad Gateway, 503 Service Unavailable |

## Schemas et validation

| Concept | Description | Exemple |
|---------|-------------|---------|
| `$ref` | Reference a un composant reutilisable | `$ref: '#/components/schemas/Service'` |
| `type` | Type JSON Schema (string, number, integer, boolean, array, object) | `type: string` |
| `format` | Sous-type (date-time, uuid, email, uri) | `format: uuid` |
| `required` | Champs obligatoires | `required: [id, name]` |
| `enum` | Valeurs autorisees | `enum: [active, inactive, error]` |
| `oneOf/anyOf/allOf` | Composition de schemas | Polymorphisme, heritage |

## Security Schemes

| Type | Description | Usage Miyukini |
|------|-------------|----------------|
| `apiKey` | Cle dans header/query/cookie | API interne services |
| `http` (bearer) | Token JWT/Bearer dans Authorization header | MiyuCloud auth |
| `http` (basic) | Basic Auth (base64 user:pass) | Non recommande |
| `oauth2` | Flows OAuth 2.0 | Non utilise (local-first) |

## Bonnes pratiques REST

| Regle | Detail |
|-------|--------|
| Nommage ressources | Pluriel, kebab-case (`/api/cloud-files`, pas `/api/getFile`) |
| Versioning | URI prefix (`/api/v1/`) ou header `Accept-Version` |
| Pagination | `?page=1&per_page=20` + headers `X-Total-Count`, `Link` |
| Filtrage | Query params (`?status=active&sort=name&order=asc`) |
| Format erreur | `{ "error": { "code": "NOT_FOUND", "message": "...", "details": [...] } }` |
| HATEOAS | Liens relationnels dans les reponses (optionnel, utile pour decouverte) |
| Content-Type | Toujours `application/json`, `Accept` header pour negociation |

## Checklist Francois

- [ ] Spec OpenAPI ecrite/generee pour chaque service API (axum)
- [ ] Schemas definis dans `components/schemas` (pas inline repetitifs)
- [ ] Nommage REST respecte : pluriel, kebab-case, verbes HTTP corrects
- [ ] Codes de statut HTTP corrects pour chaque operation (201 Create, 204 Delete, etc.)
- [ ] Format d'erreur standardise (`error.code` + `error.message`)
- [ ] Versioning API defini (`/api/v1/`)
- [ ] Pagination implementee pour les listes (query params + total)
- [ ] Security scheme declare et applique globalement
- [ ] Schema validation : `required`, `format`, `enum` utilises pour chaque champ
- [ ] Documentation auto-generee accessible (swagger-ui ou equivalent)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Verbes dans les URLs (`/api/getUsers`) | Utiliser noms de ressources + methodes HTTP |
| Pas de schema de reponse documente | Definir un schema pour chaque code de statut |
| Codes de statut generiques (tout 200 ou 500) | Utiliser les codes specifiques (201, 404, 422, etc.) |
| Pas de format d'erreur standard | Un seul format `{ error: { code, message } }` partout |
| Schemas dupliques entre endpoints | Factoriser dans `components/schemas` avec `$ref` |
| Securite non declaree | Security scheme obligatoire, meme pour API internes |

## Application Miyukini

| Concept OpenAPI | Application projet |
|----------------|-------------------|
| Spec document | `.mip/specs/` ou generee depuis les handlers axum |
| Paths + Operations | Routes axum dans chaque service (miyucloud, origin, etc.) |
| Components/Schemas | Structs serde Rust = schemas API (derive Serialize/Deserialize) |
| Security Schemes | MiyuCloud auth (passphrase + session), API keys services internes |
| Error format | Types d'erreur explicites par module (regles CLAUDE.md) |
| Versioning | `/api/v1/` pour tous les services exposes |
| Validation | serde + validator crate pour validation input |
| Documentation | utoipa ou aide (OpenAPI auto-generation depuis axum) |

---

*Sources : OpenAPI Specification 3.1.0 (openapis.org), RFC 7231 (HTTP Semantics), JSON Schema 2020-12*
