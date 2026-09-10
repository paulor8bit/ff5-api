# ============================================
# Script de Download de Sprites - Final Fantasy V
# Fonte: The Spriters Resource (https://www.spriters-resource.com/snes/ff5/)
# ============================================

$baseUrl = "https://www.spriters-resource.com/media/assets"
$outputDir = "C:\git\ff5-api\images"

# Headers para simular um navegador real
$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    "Accept" = "image/png,image/*,*/*"
    "Referer" = "https://www.spriters-resource.com/snes/ff5/"
}

# ============================================
# 1. PERSONAGENS PLAYABLE (sprite sheets)
# ============================================
Write-Host "=== Baixando sprites de Personagens ===" -ForegroundColor Cyan

$characters = @(
    @{ id = "31541"; name = "img_char_001_bartz.png"; section = "root" },
    @{ id = "31545"; name = "img_char_002_lenna.png"; section = "root" },
    @{ id = "31544"; name = "img_char_003_galuf.png"; section = "root" },
    @{ id = "31543"; name = "img_char_004_faris.png"; section = "root" },
    @{ id = "31542"; name = "img_char_005_krile.png"; section = "root" }
)

foreach ($char in $characters) {
    $url = "$baseUrl/29/$($char.id).png?updated=1755472662"
    $output = "$outputDir\$($char.name)"
    
    if (Test-Path $output) {
        Write-Host "  [SKIP] $($char.name) ja existe" -ForegroundColor Yellow
    } else {
        try {
            Write-Host "  [DL] $($char.name)..." -ForegroundColor Green
            Invoke-WebRequest -Uri $url -OutFile $output -Headers $headers -ErrorAction Stop
            $size = (Get-Item $output).Length
            Write-Host "  [OK] $($char.name) ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERRO] Falha ao baixar $($char.name): $_" -ForegroundColor Red
        }
    }
}

# ============================================
# 2. NPCs
# ============================================
Write-Host "`n=== Baixando sprites de NPCs ===" -ForegroundColor Cyan

$npcs = @(
    @{ id = "31546"; name = "img_npc_overworld.png"; section = "root" },
    @{ id = "5182"; name = "img_npc_summons.png"; section = "root" }
)

foreach ($npc in $npcs) {
    $categoryId = if ($npc.id -ge "31546") { "29" } else { "5" }
    $url = "$baseUrl/$categoryId/$($npc.id).png?updated=1755472662"
    $output = "$outputDir\$($npc.name)"
    
    if (Test-Path $output) {
        Write-Host "  [SKIP] $($npc.name) ja existe" -ForegroundColor Yellow
    } else {
        try {
            Write-Host "  [DL] $($npc.name)..." -ForegroundColor Green
            Invoke-WebRequest -Uri $url -OutFile $output -Headers $headers -ErrorAction Stop
            $size = (Get-Item $output).Length
            Write-Host "  [OK] $($npc.name) ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERRO] Falha ao baixar $($npc.name): $_" -ForegroundColor Red
        }
    }
}

# ============================================
# 3. BOSSES
# ============================================
Write-Host "`n=== Baixando sprites de Bosses ===" -ForegroundColor Cyan

$bosses = @(
    @{ id = "5181"; name = "img_bosses_sheet.png"; section = "root" }
)

foreach ($boss in $bosses) {
    $url = "$baseUrl/5/$($boss.id).png?updated=1786453844"
    $output = "$outputDir\$($boss.name)"
    
    if (Test-Path $output) {
        Write-Host "  [SKIP] $($boss.name) ja existe" -ForegroundColor Yellow
    } else {
        try {
            Write-Host "  [DL] $($boss.name)..." -ForegroundColor Green
            Invoke-WebRequest -Uri $url -OutFile $output -Headers $headers -ErrorAction Stop
            $size = (Get-Item $output).Length
            Write-Host "  [OK] $($boss.name) ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERRO] Falha ao baixar $($boss.name): $_" -ForegroundColor Red
        }
    }
}

# ============================================
# 4. INIMIGOS
# ============================================
Write-Host "`n=== Baixando sprites de Inimigos ===" -ForegroundColor Cyan

$enemies = @(
    @{ id = "56180"; name = "img_enemies_sheet.png"; section = "root" }
)

foreach ($enemy in $enemies) {
    $url = "$baseUrl/53/$($enemy.id).png?updated=1755473170"
    $output = "$outputDir\$($enemy.name)"
    
    if (Test-Path $output) {
        Write-Host "  [SKIP] $($enemy.name) ja existe" -ForegroundColor Yellow
    } else {
        try {
            Write-Host "  [DL] $($enemy.name)..." -ForegroundColor Green
            Invoke-WebRequest -Uri $url -OutFile $output -Headers $headers -ErrorAction Stop
            $size = (Get-Item $output).Length
            Write-Host "  [OK] $($enemy.name) ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERRO] Falha ao baixar $($enemy.name): $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Download concluido! ===" -ForegroundColor Cyan
Write-Host "Verifique a pasta: $outputDir" -ForegroundColor White
