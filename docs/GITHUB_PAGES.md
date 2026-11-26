# GitHub-only, read-only concept demo

## What is deployed

GitHub Pages serves a separate static entry point (`src/pages/PagesDemo.tsx`), not the full API-backed marketplace. It displays a permanent read-only warning, fictional service examples, category filters and expandable explanatory text. No provider availability, ratings, transactions or verification are claimed. There are no account, booking, messaging or payment forms and no API calls. No external hosting or database is used.

The existing full application and Node API remain in this repository for future development. They are **not deployed** by the Pages workflow. Production startup/payment safeguards remain intact. The earlier Render Blueprint is optional and is not activated by this workflow.

## Enable hosting (repository owner)

The expected project URL is **https://clazzo265.github.io/Pafupi/**, but that is not a verified live deployment until the GitHub Actions deployment succeeds.

1. Open [repository Pages settings](https://github.com/Clazzo265/Pafupi/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**. This requires repository administration access. No custom domain, DNS change or paid hosting is required.
3. Open [the Pages workflow](https://github.com/Clazzo265/Pafupi/actions/workflows/pages.yml). If the initial run failed because Pages was disabled, rerun all jobs. It builds and tests the current working branch, uploads `dist`, then deploys it to the `github-pages` environment. Approve an environment deployment if GitHub requests it.
4. Open the actual URL in the successful deployment output; verify the read-only banner, category filters, example details, mobile layout and absence of `/api` requests. Refresh with a hash section selected.

During setup, the session's GitHub integration received HTTP **403 Resource not accessible by integration** when trying to create the Pages site through `POST /repos/Clazzo265/Pafupi/pages`. Repository push access does not imply Pages administration permission. This setting must be approved by an authorized owner; no successful deployment is implied by committing this file.

## Build and checks

```sh
npm ci
npm run build:pages
npm run test:pages
BASE_PATH=/Pafupi/ npx vite preview --host 0.0.0.0 --port 5175
```

Open `/Pafupi/`, not the server root. The build pins `BASE_PATH=/Pafupi/` and `VITE_GITHUB_PAGES=true`. The default `npm run build` still builds the original full frontend. The Pages build tree-shakes out the original application, has no service-worker registration, and removes the full-app manifest link so it cannot install an incorrectly scoped application. All fonts and icons used by the demo are bundled locally. Browser tests cover subpath assets, no API requests, no service-worker registration, category/detail controls, hash refresh, mobile overflow and serious/critical Axe findings.

`.github/workflows/pages.yml` automatically deploys only the current Arena working branch, `arena/c01f6663-pafupi`. It does not merge or change the repository's default branch. If the canonical deployment branch changes later, update this trigger through a reviewed change. The workflow checks lint, formatting, types, backend tests, dependency audit and static demo browser tests before deployment. GitHub's existing quality workflow separately tests the full application.

## Boundaries

- GitHub Pages is static hosting, not a Node runtime or transactional database.
- No real sign-in, task publication, persistent requests, messages or payments are available.
- No credentials or private records are included in the build. Example interaction state is in memory only, and is reset on reload.
- This is not production launch approval. The roadmap, security and operational requirements for the full marketplace remain outstanding.
