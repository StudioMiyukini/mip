#!/usr/bin/env bash
# @id mip.mscm.partout
# @do generer_l_index_mscm_dans_chaque_projet_de_APP
# Génère un mscm_index/ dans chaque projet de D:\APP, plus un index racine qui
# ne couvre que les fichiers épars (les projets sont ignorés pour ne pas
# recompter, ni faire collisionner les identifiants des dépôts recopiés).
#
# N'indexe que ce qui est annoté : un projet sans @id produit 0 bloc — c'est
# attendu, pas une erreur. Chaque projet reçoit tout de même son dossier, prêt
# pour `mscm --verifier` en intégration continue.

set -u
CLI="/d/APP/mip-studio/mscm/src/mscm.ts"
RACINE="/d/APP"
cd "$RACINE" || exit 1

# Les projets à indexer un par un. mip-studio a déjà son index versionné.
PROJETS=(
  Allumina CATAKANA CV_gen MiyukiniChat POWER TAMR TSSR alicia aliso apps arpg
  catakana_orga festosh festosh_repo miyukini-cms miyukini-cog
  "miyukini-home - Copie" miyukini-home miyukini-ui miyukini miyukini_com
  monitoring-server pm2-admin templates
)

printf "%-24s %8s  %s\n" "PROJET" "BLOCS" "INTÉGRITÉ"
printf -- "%.0s-" {1..64}; echo

for p in "${PROJETS[@]}"; do
  [ -d "$RACINE/$p" ] || { printf "%-24s %8s  (dossier absent)\n" "$p" "—"; continue; }
  sortie="$RACINE/$p/mscm_index"
  out=$(timeout 150 npx tsx "$CLI" --racine "$RACINE/$p" --sortie "$sortie" --projet "$p" 2>&1)
  code=$?
  if [ $code -eq 124 ]; then
    printf "%-24s %8s  (délai dépassé)\n" "$p" "—"; continue
  fi
  blocs=$(printf '%s' "$out" | grep -oE 'MSCM — [0-9]+ blocs' | grep -oE '[0-9]+' | head -1)
  integ=$(printf '%s' "$out" | grep -iE 'intégrité' | head -1 | sed 's/^ *//')
  [ -z "$blocs" ] && blocs="0"
  # Un index vide (0 bloc) n'apporte rien : on retire le dossier plutôt que de
  # semer des coquilles dans dix-huit dépôts.
  if [ "$blocs" = "0" ]; then
    rm -rf "$sortie"
    printf "%-24s %8s  (aucune annotation — index non écrit)\n" "$p" "0"
  else
    printf "%-24s %8s  %s\n" "$p" "$blocs" "$integ"
  fi
done

echo
echo "=== index racine D:/APP (fichiers épars, projets ignorés) ==="
timeout 150 npx tsx "$CLI" --racine "$RACINE" --sortie "$RACINE/mscm_index" --projet APP \
  --ignorer "$(IFS=,; echo "${PROJETS[*]}"),mip-studio,docs" 2>&1 | tail -3
