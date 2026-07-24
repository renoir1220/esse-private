[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$packageJson = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $repositoryRoot "sidecars\agent\package.json"
) | ConvertFrom-Json
$product = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $repositoryRoot "sidecars\agent\product.json"
) | ConvertFrom-Json
$tag = "v$($packageJson.version)"
$testRoot = Join-Path ([IO.Path]::GetTempPath()) (
  "esse-private-publish-test-" + [Guid]::NewGuid().ToString("N")
)
$releaseRoot = Join-Path $testRoot "release"
$remoteRoot = Join-Path $testRoot "remote"
$notesFile = Join-Path $testRoot "notes.md"
$publisher = Join-Path $repositoryRoot "scripts\publish-private-release.ps1"

$global:EssePublishTestExists = $false
$global:EssePublishTestDraft = $false
$global:EssePublishTestPrerelease = $false
$global:EssePublishTestDownloadCount = 0
$global:EssePublishTestRemoteRoot = $remoteRoot

function global:gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  if ($Arguments.Count -lt 2 -or $Arguments[0] -ne "release") {
    throw "Unexpected mock gh invocation: $($Arguments -join ' ')"
  }

  switch ($Arguments[1]) {
    "view" {
      if (-not $global:EssePublishTestExists) {
        $global:LASTEXITCODE = 1
        return
      }
      $assets = @(
        Get-ChildItem -LiteralPath $global:EssePublishTestRemoteRoot -File |
          Sort-Object Name |
          ForEach-Object { [pscustomobject]@{ name = $_.Name } }
      )
      [pscustomobject]@{
        isDraft = $global:EssePublishTestDraft
        isPrerelease = $global:EssePublishTestPrerelease
        assets = $assets
        url = "https://example.invalid/releases/$tag"
      } | ConvertTo-Json -Compress -Depth 4
      $global:LASTEXITCODE = 0
    }
    "create" {
      $global:EssePublishTestExists = $true
      $global:EssePublishTestDraft = $true
      $global:EssePublishTestPrerelease = $Arguments -contains "--prerelease"
      $global:LASTEXITCODE = 0
    }
    "upload" {
      $source = $Arguments[3]
      Copy-Item -LiteralPath $source -Destination (
        Join-Path $global:EssePublishTestRemoteRoot ([IO.Path]::GetFileName($source))
      )
      $global:LASTEXITCODE = 0
    }
    "download" {
      $patternIndex = [Array]::IndexOf($Arguments, "--pattern")
      $directoryIndex = [Array]::IndexOf($Arguments, "--dir")
      if ($patternIndex -lt 0 -or $directoryIndex -lt 0) {
        throw "Mock release download is missing --pattern or --dir."
      }
      $name = $Arguments[$patternIndex + 1]
      $destination = $Arguments[$directoryIndex + 1]
      Copy-Item -LiteralPath (
        Join-Path $global:EssePublishTestRemoteRoot $name
      ) -Destination (Join-Path $destination $name)
      $global:EssePublishTestDownloadCount++
      $global:LASTEXITCODE = 0
    }
    "edit" {
      $global:EssePublishTestDraft = $false
      $global:EssePublishTestPrerelease = $Arguments -contains "--prerelease"
      $global:LASTEXITCODE = 0
    }
    default {
      throw "Unexpected mock gh release command: $($Arguments -join ' ')"
    }
  }
}

try {
  $null = New-Item -ItemType Directory -Path $releaseRoot
  $null = New-Item -ItemType Directory -Path $remoteRoot
  Set-Content -LiteralPath $notesFile -Encoding UTF8 -Value "# Fake release notes"

  $windowsAsset = "$($product.releasePrefix)-windows-x64-v$($packageJson.version).exe"
  $macosAsset = "$($product.releasePrefix)-macos-arm64-v$($packageJson.version).dmg"
  Set-Content -LiteralPath (Join-Path $releaseRoot $windowsAsset) -Encoding UTF8 -Value "fake-windows"
  Set-Content -LiteralPath (Join-Path $releaseRoot $macosAsset) -Encoding UTF8 -Value "fake-macos"

  & node (
    Join-Path $repositoryRoot "scripts\create-private-release-metadata.mjs"
  ) $tag $releaseRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Fake release metadata generation failed."
  }

  & $publisher `
    -Tag $tag `
    -Repository "renoir1220/esse-private" `
    -ReleaseRoot $releaseRoot `
    -NotesFile $notesFile

  if (-not $global:EssePublishTestExists -or $global:EssePublishTestDraft) {
    throw "The fake release was not finalized."
  }
  $expectedNames = @(
    $windowsAsset,
    $macosAsset,
    "sidecar-latest.json",
    "checksums.txt"
  ) | Sort-Object
  $actualNames = @(
    Get-ChildItem -LiteralPath $remoteRoot -File | ForEach-Object Name
  ) | Sort-Object
  if (($actualNames -join "`n") -ne ($expectedNames -join "`n")) {
    throw "The fake release did not publish the exact expected asset set."
  }

  & $publisher `
    -Tag $tag `
    -Repository "renoir1220/esse-private" `
    -ReleaseRoot $releaseRoot `
    -NotesFile $notesFile
  if ($global:EssePublishTestDownloadCount -ne $expectedNames.Count) {
    throw "A resumed publish did not verify every existing remote asset."
  }

  Set-Content -LiteralPath (
    Join-Path $remoteRoot $windowsAsset
  ) -Encoding UTF8 -Value "tampered-windows"
  $immutableGuardTriggered = $false
  try {
    & $publisher `
      -Tag $tag `
      -Repository "renoir1220/esse-private" `
      -ReleaseRoot $releaseRoot `
      -NotesFile $notesFile
  } catch {
    $immutableGuardTriggered = $_.Exception.Message -like "*does not match the immutable build artifact*"
  }
  if (-not $immutableGuardTriggered) {
    throw "The publisher accepted a mismatched existing release asset."
  }

  Write-Output (
    @{
      status = "ok"
      tag = $tag
      assets = $expectedNames.Count
      resumedPublishVerified = $true
      immutableMismatchRejected = $true
    } | ConvertTo-Json -Compress
  )
} finally {
  Remove-Item -LiteralPath "Function:\gh" -ErrorAction SilentlyContinue
  $resolvedTestRoot = if (Test-Path -LiteralPath $testRoot) {
    (Resolve-Path -LiteralPath $testRoot).Path
  }
  $resolvedTempRoot = (Resolve-Path -LiteralPath ([IO.Path]::GetTempPath())).Path
  if (
    $resolvedTestRoot -and
    $resolvedTestRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
    ([IO.Path]::GetFileName($resolvedTestRoot) -like "esse-private-publish-test-*")
  ) {
    Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
  }
  Remove-Variable -Name EssePublishTestExists -Scope Global -ErrorAction SilentlyContinue
  Remove-Variable -Name EssePublishTestDraft -Scope Global -ErrorAction SilentlyContinue
  Remove-Variable -Name EssePublishTestPrerelease -Scope Global -ErrorAction SilentlyContinue
  Remove-Variable -Name EssePublishTestDownloadCount -Scope Global -ErrorAction SilentlyContinue
  Remove-Variable -Name EssePublishTestRemoteRoot -Scope Global -ErrorAction SilentlyContinue
}
