# Bulk replace hardcoded blues -> shared tokens.
# Skips tokens.css (definitions) and SingleArticle.css (newspaper theme).

$skip = @('tokens.css', 'SingleArticle.css')
$replacements = @(
    @('#2D3C50', 'var(--color-brand-primary)'),
    @('#5b7dab', 'var(--color-brand-primary-hover)'),
    @('#2a4a7d', 'var(--color-brand-primary-hover)'),
    @('#0b1e35', 'var(--color-brand-primary)'),
    @('#1a365d', 'var(--color-brand-primary)'),
    @('#2c3e50', 'var(--color-brand-primary)'),
    @('#007bff', 'var(--color-brand-primary)'),
    @('#0056b3', 'var(--color-brand-primary-hover)'),
    @('#005999', 'var(--color-brand-primary-hover)'),
    @('#3b82f6', 'var(--color-brand-primary)'),
    @('#3498db', 'var(--color-brand-primary-hover)'),
    @('#38bdf8', 'var(--color-accent)'),
    @('#a1d2ff', 'var(--color-accent)'),
    @('#85c4ff', 'var(--color-accent-dark)'),
    @('#d6ebff', 'var(--color-accent-pale)'),
    @('#e6f2ff', 'var(--color-accent-border)'),
    @('#ebf2fc', 'var(--color-accent-hover-bg)'),
    @('#2d3748', 'var(--color-text)'),
    @('#f0f4f8', 'var(--color-bg-muted)'),
    @('#34495e', 'var(--color-brand-primary-hover)'),
    @('rgba(26, 54, 93, 0.2)', 'var(--color-focus-ring)')
)

$dir = Join-Path $PSScriptRoot '..\src\styles'
Get-ChildItem -Path $dir -Filter '*.css' | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $original = $content
    foreach ($pair in $replacements) {
        $pattern = [regex]::Escape($pair[0])
        $content = [regex]::Replace($content, $pattern, $pair[1], 'IgnoreCase')
    }
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($_.FullName, $content)
        Write-Host "Updated $($_.Name)"
    }
}
