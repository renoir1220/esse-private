# Private release signing policy

This policy applies only to proprietary Esse Agent Sidecar artifacts released from `renoir1220/esse-private`. The public Community SignPath policy does not cover unpublished or proprietary source.

Code signing is temporarily optional while trusted signing credentials are unavailable. The release workflow uses an all-or-none policy independently for each platform:

- when every Windows credential is configured, the application executable and Squirrel installer must have valid Authenticode signatures and trusted timestamps;
- when every macOS credential is configured, both architecture builds must use Developer ID signing and pass Gatekeeper, Apple notarization, and stapled-ticket verification;
- when none of a platform's credentials are configured, the workflow may publish unsigned artifacts after all non-signing package, architecture, icon, and packaged-app smoke checks pass;
- when only part of a platform's credential set is configured, the workflow fails instead of silently publishing a partially configured release.

Every release, signed or unsigned, must also satisfy these gates:

- Windows x64, macOS arm64, and macOS x64 assets are built from the same tag contained in `main`;
- `sidecar-latest.json` and `checksums.txt` are generated from the final assets;
- release notes clearly disclose any unsigned or unnotarized platform artifacts.

The release workflow receives signing material only through GitHub Actions Secrets:

- `WINDOWS_CERTIFICATE_PFX_BASE64`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `MACOS_CERTIFICATE_P12_BASE64`
- `MACOS_CERTIFICATE_PASSWORD`
- `MACOS_NOTARY_API_KEY_BASE64`
- `MACOS_NOTARY_API_KEY_ID`
- `MACOS_NOTARY_API_ISSUER_ID`
- `MACOS_SIGN_IDENTITY`

Signing material must never be committed, placed in an artifact, printed in logs, pasted into chat, or added to a pull request. When trusted credentials become available, configure the complete platform credential set in GitHub Actions Secrets; strict signature and notarization gates then turn on automatically.
