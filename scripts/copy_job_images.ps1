$jobsDir = 'C:\git\ff5-api\images\jobs'
$rootDir = 'C:\git\ff5-api\images'

$map = @{
    'job_001_freelancer.png'     = 'img_job_001_freelancer.png'
    'job_008_redmage.png'        = 'img_job_008_redmage.png'
    'job_009_timemage.png'       = 'img_job_009_timemage.png'
    'job_011_berserker.png'      = 'img_job_011_berserker.png'
    'job_012_mysticknight.png'   = 'img_job_012_mysticknight.png'
    'job_014_ranger.png'         = 'img_job_014_ranger.png'
    'job_015_dragoon.png'        = 'img_job_015_dragoon.png'
    'job_016_samurai.png'        = 'img_job_016_samurai.png'
    'job_017_dancer.png'         = 'img_job_017_dancer.png'
    'job_018_bard.png'           = 'img_job_018_bard.png'
    'job_019_beastmaster.png'    = 'img_job_019_beastmaster.png'
    'job_020_chemist.png'        = 'img_job_020_chemist.png'
    'job_021_geomancer.png'      = 'img_job_021_geomancer.png'
}

foreach ($entry in $map.GetEnumerator()) {
    $src = Join-Path $jobsDir $entry.Key
    $dst = Join-Path $rootDir $entry.Value
    if (Test-Path -LiteralPath $src) {
        if (-not (Test-Path -LiteralPath $dst)) {
            Copy-Item -LiteralPath $src -Destination $dst
            Write-Host "COPIADO: $($entry.Value)"
        } else {
            Write-Host "JA EXISTE: $($entry.Value)"
        }
    } else {
        Write-Host "FONTE NAO EXISTE: $($entry.Key)"
    }
}

Write-Host ''
Write-Host '--- Imagens de jobs na raiz agora ---'
Get-ChildItem $rootDir -Filter 'img_job_*.png' | Sort-Object Name | ForEach-Object { Write-Host $_.Name }