Get-ChildItem 'C:\git\ff5-api\images\jobs' -Filter '*.png' | Sort-Object Name | ForEach-Object { Write-Host $_.Name }
Write-Host '--- MONSTERS ---'
Get-ChildItem 'C:\git\ff5-api\images\monsters' -Filter '*.png' | Sort-Object Name | ForEach-Object { Write-Host $_.Name }
Write-Host '--- ROOT ---'
Get-ChildItem 'C:\git\ff5-api\images' -Filter '*.png' | Sort-Object Name | ForEach-Object { Write-Host $_.Name }