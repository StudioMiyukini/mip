<!-- @id mip.confidentialite
     @do dire_ce_qui_est_collecte_ou_c_est_heberge_et_comment_l_effacer
     @role rule
     @layer doc
     @human La politique de confidentialité : courte, parce qu'on collecte peu -->

# Confidentialité

*Dernière mise à jour : 21 août 2026.*

Ce document est court parce qu'on collecte peu. **Ce qu'on ne collecte pas ne
fuit pas, ne se supprime pas, et ne se déclare pas.**

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

## Ce que vous pouvez faire

| Droit | Comment |
| --- | --- |
| **Emporter vos données** | un bouton dans votre compte, tout part en JSON |
| **Supprimer votre compte** | un bouton, et le mot de passe redemandé |
| **Corriger votre adresse** | supprimez le compte et recréez-en un |

**La suppression est réelle.** Elle efface le compte *et* tous les cadrages
rattachés, en base, immédiatement. Pas de corbeille, pas de marquage « effacé »,
pas de délai de rétention. Après ça, il ne reste rien — et nous ne pouvons rien
restaurer.

## Une limite de cadence

Deux actions sont plafonnées par adresse : les suggestions de pré-remplissage
(20 par dix minutes) et la création de compte (5 par heure). L'adresse sert
uniquement à ce comptage, **en mémoire**, et disparaît dès que la fenêtre passe.
Elle n'est ni enregistrée, ni journalisée.

C'est là pour protéger un modèle local partagé d'un onglet qui recharge en
boucle — pas pour vous suivre.

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

Pour toute question sur vos données : [miyukini@gmail.com](mailto:miyukini@gmail.com)
