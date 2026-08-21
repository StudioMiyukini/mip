<#
    ATTENTION : CE FICHIER EST ENCODE EN UTF-8 AVEC BOM, ET IL DOIT LE RESTER.

    Windows PowerShell 5.1 lit un .ps1 sans BOM comme de l'ANSI (cp1252). Le
    tiret cadratin de la ligne « on l'arrete » y devenait trois caracteres, dont
    un guillemet fermant typographique — que PowerShell accepte comme
    delimiteur de chaine. La chaine se fermait donc trop tot, l'apostrophe
    suivante en ouvrait une autre, et le fichier entier devenait insyntaxique
    quarante lignes plus bas. Le message d'erreur pointait la mauvaise ligne.

    @id mip.pm2.pose
    @do poser_mip_sous_pm2_depuis_un_terminal_eleve
    @role config
    @layer infra
    @human Le script qui met MIP Studio sous PM2 — a lancer en administrateur

    POURQUOI CE SCRIPT PLUTOT QU'UNE LIGNE DE COMMANDE

    Sur cette machine, PM2 tourne en service Windows sous LocalSystem. Le tube
    nomme du demon appartient donc a SYSTEM, et un terminal non eleve se voit
    refuser la connexion avec EPERM — meme celui d'un administrateur, dont le
    groupe est alors marque « utilise pour les refus uniquement ». PM2 croit
    alors devoir demarrer un second demon, echoue de nouveau, et laisse un
    processus mort derriere lui. Dix ont ete engendres ainsi.

    Le script verifie donc l'elevation AVANT de toucher a quoi que ce soit, et
    refuse de continuer sinon. Il libere ensuite le port 8976, que le serveur
    lance a la main pendant le developpement occupe — sans cela `pm2 start`
    poserait une application qui redemarre en boucle sur EADDRINUSE.

    Usage, dans un PowerShell lance en administrateur :
        powershell -ExecutionPolicy Bypass -File D:\APP\mip-studio\scripts\pm2-mip.ps1
#>

$ErrorActionPreference = 'Stop'

$RACINE = Split-Path -Parent $PSScriptRoot
$CONFIG = Join-Path $RACINE 'ecosystem.config.cjs'
$PORT   = 8976

# ── l'elevation, avant tout le reste ─────────────────────────────────────────
$moi = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $moi.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host ""
    Write-Host "  Ce terminal n'est pas eleve." -ForegroundColor Red
    Write-Host "  Le demon PM2 tourne sous LocalSystem : sans elevation, la"
    Write-Host "  connexion echoue avec EPERM et PM2 engendre un demon fantome."
    Write-Host ""
    Write-Host "  Rouvrez PowerShell par un clic droit > Executer en tant"
    Write-Host "  qu'administrateur, puis relancez ce script."
    Write-Host ""
    exit 1
}

if (-not (Test-Path $CONFIG)) { throw "declaration PM2 introuvable : $CONFIG" }

# ── le port, qu'un serveur de developpement peut tenir ───────────────────────
$occupant = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($occupant) {
    foreach ($c in $occupant) {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "  port $PORT tenu par $($p.ProcessName) ($($p.Id)) — on l'arrete"
            Stop-Process -Id $p.Id -Force
        }
    }
    Start-Sleep -Seconds 2
}

# ── PM2 ──────────────────────────────────────────────────────────────────────
Write-Host "  pm2 start $CONFIG"
& pm2 start $CONFIG
if ($LASTEXITCODE -ne 0) { throw "pm2 start a echoue (code $LASTEXITCODE)" }

Write-Host "  pm2 save"
& pm2 save
if ($LASTEXITCODE -ne 0) { throw "pm2 save a echoue (code $LASTEXITCODE)" }

# ── la verification, qui est le seul verdict qui compte ──────────────────────
Start-Sleep -Seconds 6
& pm2 list

Write-Host ""
foreach ($cible in @("http://127.0.0.1:$PORT/api/sante", 'https://mip.miyukini.org/')) {
    try {
        $r = Invoke-WebRequest -Uri $cible -UseBasicParsing -TimeoutSec 20
        Write-Host ("  {0,-45} {1}" -f $cible, $r.StatusCode) -ForegroundColor Green
    } catch {
        Write-Host ("  {0,-45} ECHEC — {1}" -f $cible, $_.Exception.Message) -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "  Termine. `pm2 save` a ecrit le dump : les deux processus"
Write-Host "  reviendront au prochain demarrage de la machine."
