# First release preflight

This is a runbook for a future stable release, not a record of publication. The [distribution snapshot](DISTRIBUTION.md) records the checked package, registry, GitHub and hosted-preview state. Recheck those external surfaces at release time. A development preview and workshop are hosted at [othmaneblial.github.io/Regex-For-Humans](https://othmaneblial.github.io/Regex-For-Humans/). That preview is separate from publishing a stable release.

GitHub Actions is disabled for this repository. Quality checks and release candidate verification run locally. The manual release workflow files remain inactive templates. The release route below uses locally verified artifacts and the existing owner Pages repository; publishing a release does not authorize enabling this project's CI.

## Development preview publication

The maintainer authorized the first npm preview on 1 October 2026. Keep `0.1.0-dev` on the explicit `preview` distribution tag and keep the human review tasks open. The stable-release gates below still apply before a stable version bump.

Run the local checks and retain the exact clean-consumer-tested candidate:

```sh
PACK_OUTPUT_DIR=artifacts npm run test:package
npm publish ./artifacts/regex-for-humans-0.1.0-dev.tgz --tag preview --access public --registry https://registry.npmjs.org/
```

Push the candidate's source commit to `main` before publication and record its tarball SHA-256. Confirm the npm account and name availability immediately before publishing. After publication, compare the public registry tarball with the retained candidate, install `regex-for-humans@preview` in a fresh directory and run the README CLI and library examples. Record actual registry and hosted-site results in [DISTRIBUTION.md](DISTRIBUTION.md); a prepared candidate is not a published version.

## Gates before a version bump

1. Complete the open human reviews in [USABILITY-STUDY.md](USABILITY-STUDY.md): explanation accuracy, three first-use sessions, a real screen reader session, a novice README review, and an external contribution review. Record observed problems and fixes; keep the corresponding [roadmap](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/ROADMAP.md) tasks open until verified.
2. Capture final desktop and mobile screenshots from the tested build after UX changes are settled. Verify their visible examples against the compiler and inspect the rendered README.
3. The CI rejection gate was verified on 19 September 2026: disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) failed `npm run check` in all four core jobs of run `35444252927`, then was closed without merging and its temporary branch was removed. This is historical evidence; the current repository uses local checks instead.
4. Decide whether the observed users need standalone executables. Record the evidence in [DISTRIBUTION.md](DISTRIBUTION.md). The default remains npm/Node plus the browser workshop unless the sessions show a concrete need.
5. Recheck npm name availability and account access at release time. A `404` from `npm view regex-for-humans` on 19 September 2026 was only a point-in-time absence of a public version; it did not reserve the name.

## Prepare one immutable version

1. Choose a stable semantic version. Update `package.json` and `package-lock.json` together, replace development-status copy in `README.md`, and move verified items from `Unreleased` into a dated `CHANGELOG.md` version section. State that no standalone binary is provided if that decision holds. Keep the existing public workshop URL and verify its stable version after deployment.
2. Run `npm ci` and `npm run verify` locally. Inspect `npm pack --dry-run` for unwanted files.
3. Run `PACK_OUTPUT_DIR=artifacts npm run test:package` to retain the exact locally tested tarball, record its SHA-256, then push the validated version commit to `main`. The retained tarball is the candidate for registry publication; passing local checks is not itself an npm release.
4. Create `v<package-version>` at the validated commit and push it only after the version and publication actions have been authorized. The tag must not point to a later documentation edit.

## Publish and verify the external surfaces

These are ordered checks for an authorized release. Stop if a gate fails; do not claim completion from an upload or workflow start.

1. Publish the **tested tarball** to npm with the intended account. Verify the registry's exact version, then install it from the public registry in a fresh directory and run the documented CLI and library examples. If the name has become unavailable, choose a new package name, update all docs and package metadata, and repeat the candidate checks before publication.
   Use the retained local candidate rather than repacking from a later checkout. Confirm its SHA-256 immediately before publication and record the registry version and downloaded package hash. The inactive npm workflow template is not part of this route.
2. Build the stable site locally from an isolated checkout of the validated tag. Confirm that `HEAD` is the tag's commit and that the tag matches `package.json`; `RELEASE_TAG="v<version>" node scripts/verify-release-tag.js` checks the version string, not the commit identity. Run `npm ci` and `npm run verify` in that checkout. The verified `site/` output includes the homepage and nested workshop; `dist/` contains only the workshop.
   Copy that exact `site/` output into the existing `Regex-For-Humans/` folder of `OthmaneBlial/OthmaneBlial.github.io`. Review the owner repository diff and preserve every other project, then commit and push the site update. Keep the owner repository's Pages deployment enabled and this source repository's Actions disabled. Record the source tag/commit and owner-site commit together; a Pages build starting is not proof of a completed deployment. The inactive source-repository deployment template is not part of this route.
3. Verify that the owner repository's Pages build for the recorded site commit has completed without an error. Open the final URL on desktop and mobile, replay all product fixtures, inspect the browser console and network, confirm the visible version and local syntax guide, and check for missing assets or 404s. Do not assume the site is live from an artifact upload.
4. Create and publish a GitHub Release for the same tag with precise notes, compatibility, limits, the decision about standalone binaries, and a link to the tested tarball if useful. Download each attached asset and compare its SHA-256 with the candidate. Verify tag, commit, npm version, workshop version and Release agree.
5. Set the repository homepage to the verified project site, inspect the rendered README and all public links, and check the release notes for claims beyond the tests. Record the exact URLs, source tag/commit, local Node and OS versions, commands and results, owner-site commit/build, artifact hash and date in a release evidence note.

If the registry or hosted site needs correction after publication, prepare a new version and redeploy from a new tag. Do not silently move the existing tag. npm unpublication has restrictions; use a clear deprecation or patch release when appropriate.

The final demonstration video begins only after this entire preflight and all roadmap phases 0–5 are verified.

**Local path preflight (19 September 2026):** the development `dist` build was copied beneath `/Regex-For-Humans/` on a temporary HTTP server. Chrome loaded the recipe, `/^ABC\d{3}$/u`, all four sample results and the local syntax guide. Every requested asset returned 200 or 304; the browser error log was empty. This checks relative paths only and does not prove a public Pages deployment.
