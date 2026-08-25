// @id mip.comptes
// @role securite
// @layer core
// @human Les comptes : s'identifier, et ne voir que ses propres cadrages
// @do identifier_un_utilisateur_et_borner_l_acces_a_ses_cadrages

/**
 * Les comptes.
 *
 * **Un compte sert à sauvegarder, pas à entrer.** Le formulaire fonctionne sans
 * inscription — c'est le critère de sortie du produit : un néophyte arrive et
 * repart en dix minutes avec un prompt. Lui demander une adresse avant de
 * commencer le ferait partir, et on aurait échangé la seule chose qui compte
 * contre une ligne dans une table.
 *
 * Ce que le compte apporte : retrouver ses cadrages, les rouvrir, les effacer.
 *
 * **Le minimum de données possible.** Une adresse et une empreinte de mot de
 * passe. Pas de nom, pas de prénom, pas de téléphone, pas de traceur. Ce qu'on
 * ne collecte pas ne fuit pas, ne se supprime pas, et ne se déclare pas.
 */

import { scryptSync, timingSafeEqual } from "node:crypto";

import { Algorithm, hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

/**
 * Le paramétrage Argon2id.
 *
 * **Argon2id, pas scrypt.** L'audit du 2026-08-25 l'a classé en défense en
 * profondeur : scrypt était correct — sel par compte, comparaison à durée
 * constante — mais Argon2id résiste mieux à une attaque par matériel dédié,
 * parce qu'il coûte de la *mémoire* et pas seulement du temps. C'est le choix
 * recommandé aujourd'hui.
 *
 * Les valeurs sont celles que l'OWASP recommande : 19 Mio de mémoire, deux
 * passes. Argon2 gère son propre sel — inutile d'en tirer un à la main, il est
 * inclus dans l'empreinte encodée.
 */
const ARGON = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

/** L'ancien coût scrypt. Gardé pour **vérifier** les comptes créés avant la
 *  migration ; plus jamais pour en écrire. Voir [`verifier`]. */
const COUT_SCRYPT = { N: 16384, r: 8, p: 1 };

/**
 * La longueur minimale d'un mot de passe. **Une longueur, pas une composition.**
 *
 * Les règles de composition — une majuscule, un chiffre, un caractère spécial —
 * produisent `Password1!` et rien de mieux : elles réduisent l'espace de
 * recherche au lieu de l'agrandir, parce que tout le monde applique la règle de
 * la même façon. La longueur est la seule exigence qui augmente vraiment le
 * coût d'une attaque.
 */
const LONGUEUR_MINIMALE = 8;

// ── l'adresse ─────────────────────────────────────────────────────────────

/**
 * L'adresse, sous sa forme comparable.
 *
 * Sans normalisation, « Jean@Exemple.FR » et « jean@exemple.fr » créent deux
 * comptes, et le second échoue en disant que l'adresse est déjà prise — un
 * message que personne ne comprend.
 */
export function normaliserAdresse(adresse: string): string {
  return adresse.trim().toLowerCase();
}

/**
 * L'adresse est-elle plausible ?
 *
 * On ne cherche pas la conformité à la RFC : elle autorise des formes que
 * personne n'écrit et qu'aucun serveur n'accepte. On vérifie qu'il y a un avant,
 * un arobase, un domaine et une extension — ce qui écarte les fautes de frappe
 * sans écarter d'adresses réelles.
 */
export function adresseValide(adresse: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normaliserAdresse(adresse));
}

export function motDePasseAcceptable(mot: string): boolean {
  return mot.length >= LONGUEUR_MINIMALE;
}

// ── le mot de passe ───────────────────────────────────────────────────────

/**
 * L'empreinte Argon2id d'un mot de passe.
 *
 * La chaîne rendue porte tout ce qu'il faut pour la revérifier — algorithme,
 * paramètres et **sel** — au format standard `$argon2id$v=19$m=…$sel$empreinte`.
 * Le sel est propre à chaque compte : deux personnes qui choisissent le même
 * mot de passe obtiennent deux empreintes différentes, et une table précalculée
 * ne casse pas tous les comptes d'un coup.
 */
export function empreindre(mot: string): Promise<string> {
  return argonHash(mot, ARGON);
}

/**
 * Une empreinte relève-t-elle de l'ancien format scrypt ?
 *
 * Sert à **re-hacher à la volée** : quand un compte d'avant la migration se
 * connecte, on vérifie avec scrypt puis on réécrit son empreinte en Argon2id.
 * Une empreinte Argon2 commence par `$argon2` ; l'ancienne était `sel$empreinte`
 * en hexadécimal, sans le `$` de tête.
 */
export function doitRehacher(empreinte: string): boolean {
  return !empreinte.startsWith("$argon2");
}

/**
 * Le mot de passe correspond-il à l'empreinte ?
 *
 * **Deux formats, une seule porte.** Argon2id pour les empreintes récentes,
 * scrypt pour celles d'avant la migration — la connexion doit continuer de
 * marcher pour les comptes existants, sans quoi la migration les enfermerait
 * dehors. Le format se lit sur l'empreinte, jamais sur une colonne à part.
 *
 * **Aucune exception qui remonte** : une entrée de base tronquée doit refuser
 * la connexion, pas faire tomber le serveur. Refuser est le comportement sûr.
 */
export async function verifier(mot: string, empreinte: string): Promise<boolean> {
  try {
    if (empreinte.startsWith("$argon2")) return await argonVerify(empreinte, mot);

    // Ancien format scrypt : `sel$empreinte`, en hexadécimal.
    const [sel, attendu] = empreinte.split("$");
    if (!sel || !attendu) return false;
    const propose = scryptSync(mot, sel, 32, COUT_SCRYPT);
    const reference = Buffer.from(attendu, "hex");
    return propose.length === reference.length && timingSafeEqual(propose, reference);
  } catch {
    return false;
  }
}

// ── l'appartenance ────────────────────────────────────────────────────────

/** Ce dont on a besoin d'un cadrage pour décider qui y touche. */
export interface Possede {
  utilisateur: string | null;
}

/**
 * Peut-on lire ce cadrage ?
 *
 * **Un cadrage décrit un projet, parfois avant qu'il existe publiquement.** Il
 * n'y a donc pas de « lecture publique par défaut » : on lit le sien, un point.
 *
 * Un cadrage sans propriétaire — ceux enregistrés avant les comptes — n'est pas
 * « à tout le monde », il est **à personne**. Le traiter comme public serait
 * offrir d'un coup les cadrages écrits quand l'application n'avait qu'une porte
 * partagée.
 */
export function peutLire(cadrage: Possede, utilisateur: string | null): boolean {
  if (!utilisateur || !cadrage.utilisateur) return false;
  return cadrage.utilisateur === utilisateur;
}

/** Peut-on modifier ou supprimer ce cadrage ? Mêmes règles que la lecture :
 *  il n'existe pas de cadrage qu'on lirait sans pouvoir l'amender. */
export function peutEcrire(cadrage: Possede, utilisateur: string | null): boolean {
  return peutLire(cadrage, utilisateur);
}
