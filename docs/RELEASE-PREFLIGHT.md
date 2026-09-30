# First release preflight

This is a runbook for a future stable release, not a record of publication. The [distribution snapshot](DISTRIBUTION.md) records the checked package, registry, GitHub and hosted-preview state. Recheck those external surfaces at release time. A development preview and workshop are hosted at [othmaneblial.github.io/Regex-For-Humans](https://othmaneblial.github.io/Regex-For-Humans/). That preview is separate from publishing a stable release.

GitHub Actions is disabled for this repository. Quality checks and release candidate verification run locally. The manual release workflow files are inactive templates; do not enable them as part of routine verification.

## Gates before a version bump

1. Complete the open human reviews in [USABILITY-STUDY.md](USABILITY-STUDY.md): explanation accuracy, three first-use sessions, a real screen reader session, a novice README review, and an external contribution review. Record observed problems and fixes; keep the corresponding [roadmap](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/ROADMAP.md) tasks open until verified.
2. Capture final desktop and mobile screenshots from the tested build after UX changes are settled. Verify their visible examples against the compiler and inspect the rendered README.
3. The CI rejection gate was verified on 19 September 2026: disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) failed `npm run check` in all four core jobs of run `35444252927`, then was closed without merging and its temporary branch was removed. This is historical evidence; the current repository uses local checks instead.
4. Decide whether the observed users need standalone executables. Record the evidence in [DISTRIBUTION.md](DISTRIBUTION.md). The default remains npm/Node plus the browser workshop unless the sessions show a concrete need.
5. Recheck npm name availability and account access at release time. A `404` from `npm view regex-for-humans` on 19 September 2026 was only a point-in-time absence of a public version; it did not reserve the name.

## Prepare one immutable version

1. Choose a stable semantic version. Update `package.json` and `package-lock.json` together, replace development-status copy in `README.md`, and move verified items from `Unreleased` into a dated `CHANGELOG.md` version section. State that no standalone binary is provided if that decision holds. Add the eventual public workshop URL only when its planned path is known, then verify it after deployment.
2. Run `npm ci` and `npm run verify` locally. Inspect `npm pack --dry-run` for unwanted files.
3. Run `PACK_OUTPUT_DIR=artifacts npm run test:package` to retain the exact locally tested tarball, record its SHA-256, then push the validated version commit to `main`. The retained tarball is the candidate for registry publication; passing local checks is not itself an npm release.
4. Create `v<package-version>` at the validated commit and push it only after the version and publication actions have been authorized. The tag must not point to a later documentation edit.

## Publish and verify the external surfaces

These are ordered checks for an authorized release. Stop if a gate fails; do not claim completion from an upload or workflow start.

1. Publish the **tested tarball** to npm with the intended account. Verify the registry's exact version, then install it from the public registry in a fresh directory and run the documented CLI and library examples. If the name has become unavailable, choose a new package name, update all docs and package metadata, and repeat the candidate checks before publication.
   The repository retains an inactive manual `.github/workflows/publish-npm.yml` template. GitHub Actions must be explicitly re-enabled before it can run; the default route is publication of the locally verified tarball. It checks out an existing stable tag, refuses a `-dev` version or tag mismatch, requires the literal `PUBLISH` input, tests one package tarball in a clean consumer, records its SHA-256, then publishes that same tarball with npm provenance. Configure the npm trusted publisher and the `npm-release` environment before using it. A completed workflow still requires the registry and clean-consumer checks below.
2. If a later authorized release explicitly chooses to re-enable GitHub Actions for deployment, configure this repository's Pages source for its custom GitHub Actions workflow. The inactive `.github/workflows/deploy-pages.yml` template is manual only. The current development site is deployed from locally built `site/` files into the owner’s Pages repository. It checks out the requested stable tag, refuses a tag/version mismatch, reruns quality, Node, tarball and browser gates, then deploys its tested `dist` artifact. The current development preview on the owner's Pages site does not validate this release workflow. Run it with `gh workflow run deploy-pages.yml -f release_tag=v<version>` only after release publication is authorized. The workflow file alone does not create a public site. The `configure-pages` action uses this repository's existing Pages settings; it cannot enable Pages with the workflow's `GITHUB_TOKEN`.
3. Verify the selected deployment route has completed. Open the final URL on desktop and mobile, replay all product fixtures, inspect the browser console and network, confirm the visible version and local syntax guide, and check for missing assets or 404s. Do not assume the site is live from an artifact upload.
4. Create and publish a GitHub Release for the same tag with precise notes, compatibility, limits, the decision about standalone binaries, and a link to the tested tarball if useful. Download each attached asset and compare its SHA-256 with the candidate. Verify tag, commit, npm version, workshop version and Release agree.
5. Set the repository homepage to the verified project site, inspect the rendered README and all public links, and check the release notes for claims beyond the tests. Record the exact URLs, run IDs, artifact hash and date in a release evidence note.

If the registry or hosted site needs correction after publication, prepare a new version and redeploy from a new tag. Do not silently move the existing tag. npm unpublication has restrictions; use a clear deprecation or patch release when appropriate.

The final demonstration video begins only after this entire preflight and all roadmap phases 0–5 are verified.

**Local path preflight (19 September 2026):** the development `dist` build was copied beneath `/Regex-For-Humans/` on a temporary HTTP server. Chrome loaded the recipe, `/^ABC\d{3}$/u`, all four sample results and the local syntax guide. Every requested asset returned 200 or 304; the browser error log was empty. This checks relative paths only and does not prove a public Pages deployment.
