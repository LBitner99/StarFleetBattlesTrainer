# Builds sfb-duel.html from the files in src\ (the order is in src\manifest.txt).
# Edit the files in src\, never sfb-duel.html itself: it is regenerated every time.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Src([string]$rel) {
    $path = Join-Path $root ('src\' + $rel.Replace('/', '\'))
    $t = [System.IO.File]::ReadAllText($path, $utf8)
    return $t.Replace("`r`n", "`n")
}

$js = New-Object System.Text.StringBuilder
foreach ($line in (Read-Src 'manifest.txt').Split("`n")) {
    $name = $line.Trim()
    if ($name -eq '' -or $name.StartsWith('#')) { continue }
    [void]$js.Append((Read-Src $name))
}

$html = (Read-Src 'template.html').Replace('@@CSS@@', (Read-Src 'style.css')).Replace('@@JS@@', $js.ToString())

# Safety check: stop before anything is pushed if the result looks wrong.
if ($html.Length -lt 1000000 -or -not $html.TrimEnd().EndsWith('</html>') -or $html.Contains('@@JS@@') -or $html.Contains('@@CSS@@')) {
    throw "Build failed: sfb-duel.html looks incomplete ($($html.Length) characters)."
}

[System.IO.File]::WriteAllText((Join-Path $root 'sfb-duel.html'), $html, $utf8)
Write-Host ("Built sfb-duel.html (" + $html.Length + " characters).")
