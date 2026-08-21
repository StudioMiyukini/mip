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

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Le coût du hachage. ~100 ms : assez pour qu'un dictionnaire coûte, assez peu
 *  pour qu'une connexion reste instantanée. */
const COUT = { N: 16384, r: 8, p: 1 };

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
 * L'empreinte d'un mot de passe : `sel$empreinte`, en hexadécimal.
 *
 * **Le sel est propre à chaque compte**, et c'est le point qui compte. La porte
 * du site utilise un sel fixe, ce qui est acceptable pour un secret unique et
 * partagé ; ici, un sel fixe permettrait de casser **tous** les comptes d'un
 * coup avec une seule table précalculée. Deux personnes qui choisissent le même
 * mot de passe doivent avoir deux empreintes différentes.
 */
export function empreindre(mot: string): string {
  const sel = randomBytes(16).toString("hex");
  return `${sel}$${scryptSync(mot, sel, 32, COUT).toString("hex")}`;
}

/**
 * Le mot de passe correspond-il à l'empreinte ?
 *
 * Comparaison à durée constante, et **aucune exception qui remonte** : une
 * entrée de base tronquée doit refuser la connexion, pas faire tomber le
 * serveur. Refuser est le comportement sûr ; lever ne l'est pas.
 */
export function verifier(mot: string, empreinte: string): boolean {
  const [sel, attendu] = empreinte.split("$");
  if (!sel || !attendu) return false;
  try {
    const propose = scryptSync(mot, sel, 32, COUT);
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
