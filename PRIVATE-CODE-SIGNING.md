# Private release signing policy

This policy applies only to proprietary Esse Agent Sidecar artifacts released from `renoir1220/esse-private`. The public Community SignPath policy does not cover unpublished or proprietary source.

Every formal private release must pass all of these gates before GitHub publishes any asset:

- the Windows application executable and Squirrel installer have valid Authenticode signatures and trusted timestamps;
- both macOS application bundles and DMGs have a Developer ID signature, pass Gatekeeper assessment, are notarized by Apple, and contain a stapled ticket;
- Windows x64, macOS arm64, and macOS x64 assets are built from the same tag contained in `main`;
- `sidecar-latest.json` and `checksums.txt` are generated from the final signed assets.

The release workflow receives signing material only through GitHub Actions Secrets:

- `WINDOWS_CERTIFICATE_PFX_BASE64`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `MACOS_CERTIFICATE_P12_BASE64`
- `MACOS_CERTIFICATE_PASSWORD`
- `MACOS_NOTARY_API_KEY_BASE64`
- `MACOS_NOTARY_API_KEY_ID`
- `MACOS_NOTARY_API_ISSUER_ID`
- `MACOS_SIGN_IDENTITY`

Signing material must never be committed, placed in an artifact, printed in logs, pasted into chat, or added to a pull request. Local developer builds may remain unsigned, but an unsigned artifact is never a formal private release.
