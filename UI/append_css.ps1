$htmlFile = "d:\NEW 4\Ref\UI\event-details.html"
$cssFile = "d:\NEW 4\UI\src\styles\user.css"

$content = Get-Content $htmlFile -Raw
if ($content -match '(?s)<style>(.*?)</style>') {
    $cssBlock = $matches[1]
    Add-Content -Path $cssFile -Value "`n`n/* EVENT OVERHAUL AUTOMATICALLY APPENDED */`n"
    Add-Content -Path $cssFile -Value $cssBlock
    Write-Output "CSS appended successfully!"
} else {
    Write-Output "Style block not found!"
}
