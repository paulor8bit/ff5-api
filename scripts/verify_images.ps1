Add-Type -AssemblyName System.Drawing
$files = @('img_char_001_bartz.png','img_char_002_lenna.png','img_char_003_galuf.png','img_char_004_faris.png','img_char_005_krile.png','img_npc_overworld.png','img_bosses_sheet.png','img_enemies_sheet.png','img_boss_018_exdeath.png','img_spell_s014_bahamut.png','img_job_002_knight.png','img_job_003_monk.png','img_job_004_thief.png')
$dir = 'C:\git\ff5-api\images\'
$badFiles = @()
foreach ($f in $files) {
    $p = $dir + $f
    if (Test-Path -LiteralPath $p) {
        try {
            $img = [System.Drawing.Image]::FromFile($p)
            Write-Host ($f + ' => ' + $img.Width + 'x' + $img.Height + ' VALIDO')
            $img.Dispose()
        } catch {
            Write-Host ($f + ' => INVALIDO')
            $badFiles += $f
        }
    } else {
        Write-Host ($f + ' NAO EXISTE')
    }
}
Write-Host ''
Write-Host 'Total de arquivos invalidos: ' $badFiles.Count