# First release preflight

This is a runbook for a future release, not a record of publication. As of 19 September 2026, `package.json` is `0.1.0-dev`, the package is not published on npm, GitHub Pages is not configured, and no GitHub Release or tag exists. The repository owner must authorize npm publication, Pages creation/deployment, and a GitHub Release before those actions.

## Gates before a version bump

1. Complete the open human reviews in [USABILITY-STUDY.md](USABILITY-STUDY.md): explanation accuracy, three first-use sessions, a real screen reader session, a novice README review, and an external contribution review. Record observed problems and fixes; keep the corresponding [roadmap](../ROADMAP.md) tasks open until verified.
2. Capture final desktop and mobile screenshots from the tested build after UX changes are settled. Verify their visible examples against the compiler and inspect the rendered README.
3. The CI rejection gate was verified on 19 September 2026: disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) failed `npm run check` in all four core jobs of run `35444252927`, then was closed without merging and its temporary branch was removed. Recheck the gate if the CI workflow changes materially.
4. Decide whether the observed users need standalone executables. Record the evidence in [DISTRIBUTION.md](DISTRIBUTION.md). The default remains npm/Node plus the browser workshop unless the sessions show a concrete need.
5. Recheck npm name availability and account access at release time. A `404` from `npm view regex-for-humans` on 19 September 2026 was only a point-in-time absence of a public version; it did not reserve the name.

## Prepare one immutable version

1. Choose a stable semantic version. Update `package.json` and `package-lock.json` together, replace development-status copy in `README.md`, and move verified items from `Unreleased` into a dated `CHANGELOG.md` version section. State that no standalone binary is provided if that decision holds. Add the eventual public workshop URL only when its planned path is known, then verify it after deployment.
2. Run `npm ci`, `npm run check`, `npm test`, `npm run test:browser`, and `npm run test:package` locally. Inspect `npm pack --dry-run` for unwanted files and recheck `npm audit`.
3. Push the version commit to `main` and wait for every job in its exact CI run to pass. Download that run's `npm-package-tested` artifact, record the tarball SHA-256, and install that tarball in a clean consumer. The artifact is the candidate for registry publication; a green workflow is not itself an npm release.
4. Create `v<package-version>` at the validated commit and push it only after the version and publication actions have been authorized. The tag must not point to a later documentation edit.

## Publish and verify the external surfaces

These are ordered checks for an authorized release. Stop if a gate fails; do not claim completion from an upload or workflow start.

1. Publish the **tested tarball** to npm with the intended account. Verify the registry's exact version, then install it from the public registry in a fresh directory and run the documented CLI and library examples. If the name has become unavailable, choose a new package name, update all docs and package metadata, and repeat the candidate checks before publication.
2. Configure this repository's Pages source for a custom GitHub Actions workflow. `.github/workflows/deploy-pages.yml` is manual only. It checks out the requested stable tag, refuses a tag/version mismatch, reruns quality, Node, tarball and browser gates, then deploys its tested `dist` artifact. Run it with `gh workflow run deploy-pages.yml -f release_tag=v<version>` only after Pages publication is authorized. The workflow file alone does not create a public site. The `configure-pages` action uses the repository's existing Pages settings; it cannot enable Pages with the workflow's `GITHUB_TOKEN`.
3. Poll the exact deployment job to success. Open the final URL on desktop and mobile, replay all three product fixtures, inspect the browser console and network, confirm the visible version and local syntax guide, and check for missing assets or 404s. Do not assume the site is live from an artifact upload.
4. Create and publish a GitHub Release for the same tag with precise notes, compatibility, limits, the decision about standalone binaries, and a link to the tested tarball if useful. Download each attached asset and compare its SHA-256 with the candidate. Verify tag, commit, npm version, workshop version and Release agree.
5. Set the repository homepage to the verified workshop URL, inspect the rendered README and all public links, and check the release notes for claims beyond the tests. Record the exact URLs, run IDs, artifact hash and date in a release evidence note.

If the registry or hosted site needs correction after publication, prepare a new version and redeploy from a new tag. Do not silently move the existing tag. npm unpublication has restrictions; use a clear deprecation or patch release when appropriate.

The final demonstration video begins only after this entire preflight and all roadmap phases 0–5 are verified.
