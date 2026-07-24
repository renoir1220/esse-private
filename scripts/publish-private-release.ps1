[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Tag,
  [Parameter(Mandatory = $true)]
  [string]$Repository,
  [string]$ReleaseRoot = "release",
  [string]$NotesFile = ".github/release-notes-prefix.md"
)

$ErrorActionPreference = "Stop"

function Invoke-GitHubCli {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$AllowFailure
  )

  $output = @(& gh @Arguments 2>&1)
  $exitCode = $LASTEXITCODE
  if (-not $AllowFailure -and $exitCode -ne 0) {
    throw "gh $($Arguments -join ' ') failed with exit code $exitCode.`n$($output -join [Environment]::NewLine)"
  }
  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = $output
  }
}

$releaseDirectory = (Resolve-Path -LiteralPath $ReleaseRoot).Path
$metadataPath = Join-Path $releaseDirectory "sidecar-latest.json"
$checksumsPath = Join-Path $releaseDirectory "checksums.txt"
if (-not (Test-Path -LiteralPath $metadataPath -PathType Leaf)) {
  throw "Missing release metadata: $metadataPath"
}
if (-not (Test-Path -LiteralPath $checksumsPath -PathType Leaf)) {
  throw "Missing release checksums: $checksumsPath"
}
if (-not (Test-Path -LiteralPath $NotesFile -PathType Leaf)) {
  throw "Missing release notes: $NotesFile"
}

$metadata = Get-Content -Raw -Encoding UTF8 -LiteralPath $metadataPath | ConvertFrom-Json
if ($metadata.tag -ne $Tag) {
  throw "Release metadata tag $($metadata.tag) does not match $Tag."
}
$assetNames = @(
  [string]$metadata.windowsX64Asset,
  [string]$metadata.macosArm64Asset,
  "sidecar-latest.json",
  "checksums.txt"
)
if (@($assetNames | Where-Object { [string]::IsNullOrWhiteSpace($_) }).Count -ne 0) {
  throw "Release metadata contains an empty asset name."
}
if (@($assetNames | Select-Object -Unique).Count -ne $assetNames.Count) {
  throw "Release metadata contains duplicate asset names."
}

$localAssets = @{}
foreach ($name in $assetNames) {
  $candidate = Join-Path $releaseDirectory $name
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
    throw "Missing release asset: $candidate"
  }
  $localAssets[$name] = [pscustomobject]@{
    Path = (Resolve-Path -LiteralPath $candidate).Path
    Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidate).Hash.ToLowerInvariant()
  }
}

$view = Invoke-GitHubCli -Arguments @(
  "release", "view", $Tag,
  "--repo", $Repository,
  "--json", "isDraft,isPrerelease,assets,url"
) -AllowFailure

$release = $null
if ($view.ExitCode -eq 0) {
  $release = ($view.Output -join [Environment]::NewLine) | ConvertFrom-Json
} else {
  $createArguments = @(
    "release", "create", $Tag,
    "--repo", $Repository,
    "--verify-tag",
    "--title", "Esse $Tag",
    "--notes-file", $NotesFile,
    "--draft"
  )
  if ($Tag -like "*-*") {
    $createArguments += "--prerelease"
  }
  $null = Invoke-GitHubCli -Arguments $createArguments
  $release = (
    Invoke-GitHubCli -Arguments @(
      "release", "view", $Tag,
      "--repo", $Repository,
      "--json", "isDraft,isPrerelease,assets,url"
    )
  ).Output -join [Environment]::NewLine | ConvertFrom-Json
}

$remoteNames = @($release.assets | ForEach-Object { [string]$_.name })
$unexpected = @($remoteNames | Where-Object { $assetNames -notcontains $_ })
if ($unexpected.Count -ne 0) {
  throw "Release $Tag contains unexpected assets and will not be modified: $($unexpected -join ', ')"
}

$downloadRoot = Join-Path ([IO.Path]::GetTempPath()) ("esse-release-verify-" + [Guid]::NewGuid().ToString("N"))
$null = New-Item -ItemType Directory -Path $downloadRoot
foreach ($name in $assetNames) {
  if ($remoteNames -contains $name) {
    $assetDownloadRoot = Join-Path $downloadRoot ([Guid]::NewGuid().ToString("N"))
    $null = New-Item -ItemType Directory -Path $assetDownloadRoot
    $null = Invoke-GitHubCli -Arguments @(
      "release", "download", $Tag,
      "--repo", $Repository,
      "--pattern", $name,
      "--dir", $assetDownloadRoot
    )
    $downloaded = Join-Path $assetDownloadRoot $name
    $remoteSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $downloaded).Hash.ToLowerInvariant()
    if ($remoteSha256 -ne $localAssets[$name].Sha256) {
      throw "Existing release asset $name does not match the immutable build artifact."
    }
  } else {
    $null = Invoke-GitHubCli -Arguments @(
      "release", "upload", $Tag,
      $localAssets[$name].Path,
      "--repo", $Repository
    )
  }
}

$verified = (
  Invoke-GitHubCli -Arguments @(
    "release", "view", $Tag,
    "--repo", $Repository,
    "--json", "isDraft,isPrerelease,assets,url"
  )
).Output -join [Environment]::NewLine | ConvertFrom-Json
$verifiedNames = @($verified.assets | ForEach-Object { [string]$_.name } | Sort-Object)
$expectedNames = @($assetNames | Sort-Object)
if (($verifiedNames -join "`n") -ne ($expectedNames -join "`n")) {
  throw "Release assets do not exactly match the expected immutable asset set."
}

if ($verified.isDraft) {
  $editArguments = @("release", "edit", $Tag, "--repo", $Repository, "--draft=false")
  if ($Tag -like "*-*") {
    $editArguments += "--prerelease"
  } else {
    $editArguments += "--prerelease=false"
  }
  $null = Invoke-GitHubCli -Arguments $editArguments
}

Write-Output "Published $Tag from immutable verified artifacts: $($verified.url)"
