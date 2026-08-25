<!-- @id mip.confidentialite
     @do dire_ce_qui_est_collecte_ou_c_est_heberge_et_comment_l_effacer
     @role rule
     @layer doc
     @human La politique de confidentialité : courte, parce qu'on collecte peu -->

# Confidentialité

*Dernière mise à jour : 21 août 2026.*

Ce document est court parce qu'on collecte peu. **Ce qu'on ne collecte pas ne
fuit pas, ne se supprime pas, et ne se déclare pas.**

Il vaut information au sens des articles 13 et 14 du RGPD.

## Qui est responsable

**NGUYEN « Miyukini » Van Jean**, personne physique, à titre non professionnel —
[miyukini@gmail.com](mailto:miyukini@gmail.com). Coordonnées complètes dans les
[mentions légales](MENTIONS-LEGALES.md).

Aucun délégué à la protection des données n'a été désigné : le traitement est
d'ampleur limitée, ne porte sur aucune donnée sensible, et ne relève d'aucun cas
de désignation obligatoire (RGPD art. 37).

## Sans compte

Vous pouvez remplir le formulaire et obtenir votre prompt **sans vous inscrire**.
Dans ce cas :

- rien n'est enregistré ;
- vos réponses vivent dans votre navigateur, et disparaissent quand vous fermez
  l'onglet ;
- aucun traceur, aucun cookie publicitaire, aucune mesure d'audience.

Une exception à connaître : si vous décrivez votre projet, le texte est envoyé au
serveur pour produire le prompt et les suggestions. Il n'est **pas conservé**.

## Avec un compte

Un compte sert à **retrouver vos cadrages**. Il n'est jamais nécessaire pour
utiliser l'outil.

### Ce qu'on garde

| Donnée | Pourquoi |
| --- | --- |
| Votre adresse électronique | vous identifier à la connexion |
| Une empreinte de votre mot de passe | vérifier le mot de passe sans le connaître |
| La date de création du compte | rien d'essentiel — elle sert au diagnostic |
| Vos cadrages | c'est ce que vous nous demandez de garder |

C'est tout. Pas de nom, pas de prénom, pas de téléphone, pas d'adresse postale,
pas d'adresse IP conservée, pas de date de dernière visite, pas de profilage.

**Le mot de passe n'est jamais stocké**, seulement une empreinte `scrypt` avec un
sel propre à votre compte. Nous ne pouvons pas le lire, ni vous le rappeler.

### Sur quelle base, et pour combien de temps

| Traitement | Finalité | Base légale | Conservation |
| --- | --- | --- | --- |
| Compte (adresse, empreinte, dates) | vous permettre de retrouver vos cadrages | **exécution du contrat** que vous formez en créant le compte (art. 6.1.b) | jusqu'à suppression par vous, ou **24 mois sans connexion** |
| Cadrages | conserver votre travail | idem | idem — supprimés avec le compte |
| Adresse IP en mémoire vive | limiter la cadence pour protéger un service partagé | **intérêt légitime** (art. 6.1.f) | la fenêtre glissante — 10 min ou 1 h, puis effacée |
| Cookie de session | vous garder connecté d'une page à l'autre | strictement nécessaire au service demandé | à la déconnexion, ou 30 jours |

Il n'y a **pas d'autre traitement**. Pas de mesure d'audience, pas de journal de
navigation conservé, pas de profilage, pas de décision automatisée au sens de
l'article 22.

**Un compte sans connexion depuis 24 mois est supprimé**, cadrages compris.
C'est le principe de limitation de conservation (RGPD art. 5.1.e) : une donnée
ne reste pas « au cas où ». Le délai est large et il court à partir de votre
**dernière connexion**, pas de la création — se connecter le remet à zéro.

Il n'y a pas de courriel d'avertissement avant : le service n'envoie aucun
courriel, et nous n'allions pas créer une liste de diffusion pour cette seule
fin. Si un cadrage compte pour vous, connectez-vous de temps en temps, ou
exportez-le — le bouton est dans votre compte.

### Vos cadrages contiennent ce que vous y mettez

Un cadrage décrit un projet — parfois avant qu'il existe publiquement. Nous le
traitons comme confidentiel :

- **personne d'autre ne peut le lire.** L'appartenance est vérifiée dans la
  requête à la base, pas dans un contrôle qu'on pourrait oublier ;
- il n'existe **aucun partage**, aucun lien public, aucune galerie ;
- nous ne les lisons pas, ne les analysons pas, et ne les utilisons pour
  entraîner aucun modèle.

## Où c'est hébergé

Sur une machine personnelle, en **France**, derrière un tunnel Cloudflare. Les
données ne sortent pas de cette machine.

Les suggestions de pré-remplissage sont produites par un **modèle local**, sur
cette même machine. Votre texte n'est envoyé à aucun service d'intelligence
artificielle tiers — ni OpenAI, ni Anthropic, ni Google.

## Vos droits

| Droit | Article | Comment |
| --- | --- | --- |
| **Accès** — savoir ce qu'on a sur vous | 15 | « emporter mes données » : la réponse contient tout, sans exception |
| **Rectification** — corriger votre adresse | 16 | « changer d'adresse » dans votre compte ; vos cadrages restent attachés |
| **Effacement** — tout supprimer | 17 | « supprimer mon compte », mot de passe redemandé |
| **Portabilité** — partir ailleurs | 20 | le même export, en JSON lisible par une machine |
| **Opposition** et **limitation** | 21, 18 | écrivez-nous ; en pratique, l'effacement va plus vite et plus loin |
| **Retirer votre consentement** | 7 | il n'y a pas de traitement fondé sur le consentement, donc rien à retirer |

Tout se fait **depuis l'interface, sans nous écrire**. Écrire reste possible :
[miyukini@gmail.com](mailto:miyukini@gmail.com), réponse sous un mois (art. 12).

**La suppression est réelle.** Elle efface le compte *et* tous les cadrages
rattachés, en base, immédiatement. Pas de corbeille, pas de marquage « effacé »,
pas de délai de rétention. Après ça, il ne reste rien — et nous ne pouvons rien
restaurer.

### Si la réponse ne vous convient pas

Vous pouvez saisir la **CNIL** — 3 place de Fontenoy, TSA 80715, 75334 Paris
Cedex 07, [cnil.fr/plaintes](https://www.cnil.fr/fr/plaintes). C'est un droit, et
le dire ici en fait partie.

## Une limite de cadence

Deux actions sont plafonnées par adresse : les suggestions de pré-remplissage
(20 par dix minutes) et la création de compte (5 par heure). L'adresse sert
uniquement à ce comptage, **en mémoire**, et disparaît dès que la fenêtre passe.
Elle n'est ni enregistrée, ni journalisée.

C'est là pour protéger un modèle local partagé d'un onglet qui recharge en
boucle — pas pour vous suivre.

## Les cookies

**Un seul, et il n'y a pas de bandeau.** Le cookie de session est *strictement
nécessaire* au service que vous demandez — sans lui, vous seriez déconnecté à
chaque page. L'article 82 de la loi Informatique et Libertés dispense ce cas de
consentement, et la CNIL le confirme pour les cookies d'authentification.

| Nom | Rôle | Durée |
| --- | --- | --- |
| session de compte | vous garder connecté | 30 jours, ou jusqu'à déconnexion |

Il est `HttpOnly` (illisible par un script), `SameSite=Lax` (non envoyé depuis un
autre site) et `Secure` en production. **Aucun cookie tiers, aucun traceur,
aucun pixel, aucune police distante.** Si un jour nous ajoutions une mesure
d'audience, il y aurait un bandeau — et cette page changerait avant.

## Les mineurs

Le service s'adresse aux personnes de **15 ans révolus**. En deçà, la création
d'un compte requiert l'accord d'un titulaire de l'autorité parentale (art. 45 de
la loi Informatique et Libertés).

Nous ne vérifions pas l'âge : le faire supposerait de collecter une pièce
d'identité, c'est-à-dire beaucoup plus de données que tout le reste réuni. Si
vous êtes ce titulaire et voulez faire supprimer un compte,
[écrivez-nous](mailto:miyukini@gmail.com).

## Transferts hors de l'Union européenne

**Il n'y en a pas.** Les données sont sur une machine en France et n'en sortent
pas. Le trafic transite par un tunnel Cloudflare, qui achemine et ne conserve ni
les comptes ni les cadrages.

## Comment c'est protégé

- Chiffrement du transport de bout en bout (HTTPS, tunnel Cloudflare).
- Mots de passe en empreinte `scrypt`, sel par compte — jamais en clair.
- L'appartenance d'un cadrage est vérifiée **dans la requête à la base**, pas
  dans un contrôle applicatif qu'on pourrait oublier d'écrire.
- Les documents publics sont servis par **liste blanche** : ce qui n'est pas
  nommé n'existe pas, et aucun chemin ne peut remonter hors du dépôt.
- Machine à accès physique restreint, sans service d'administration exposé.

### En cas de violation de données

Si une fuite susceptible d'engendrer un risque pour vos droits survenait, elle
serait notifiée à la CNIL sous 72 heures (art. 33) et, si le risque est élevé,
signalée directement aux personnes concernées (art. 34) à l'adresse de leur
compte.

## Ce qu'on ne fait pas

- Aucune revente, aucun partage avec un tiers.
- Aucune publicité, aucun traceur.
- Aucun courriel non sollicité. Nous n'avons pas de liste de diffusion.
- Aucune conservation « au cas où » après une suppression.

## Une réserve, écrite plutôt que masquée

Ce service est gratuit et tourne sur une machine personnelle. Il n'offre **aucune
garantie de disponibilité ni de sauvegarde**. Si un cadrage compte pour vous,
copiez-le — le bouton est là pour ça.

## Nous joindre

Pour toute question sur vos données :
[miyukini@gmail.com](mailto:miyukini@gmail.com)

À lire aussi : [mentions légales](MENTIONS-LEGALES.md) ·
[conditions d'utilisation](CGU.md) ·
[registre des traitements](docs/registre-traitements.md)
