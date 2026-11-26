# Render deployment — approval required

## Status

**Prepared, not deployed to Render.** This repository now contains `render.yaml` for a free, disposable shared demonstration. There is no configured Render API credential or supported Render connector in this Arena session. A permanent hosting URL cannot honestly be claimed until the repository owner approves deployment and Render reports success.

Render is listed on [free-for.dev](https://free-for.dev/#/). This choice supports the actual Node/Express API and built frontend together, not merely a static copy of the UI. The requested service name is `pafupi-clazzo265-preview`; Render assigns the final `*.onrender.com` address and may require a different name if unavailable. No custom domain has been registered or reserved.

## One-click setup

[Review and approve this branch’s Render Blueprint](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FClazzo265%2FPafupi%2Ftree%2Farena%2Fc01f6663-pafupi)

1. Open the link and sign in directly to your own Render account. Authorize repository access in Render/GitHub if prompted. Do not send passwords, tokens or authentication codes in chat.
2. Inspect the Blueprint. It creates **one Free web service**, no paid disk or database. Do not approve a paid upgrade unless you explicitly want one. Set spend limits / review billing in the provider dashboard.
3. Approve deployment. The build runs `npm ci --include=dev && npm run build`; startup serves the built frontend and `/api` from the same origin. Node 22.16.0 is pinned for the built-in SQLite API. Render supplies `PORT`.
4. Wait until the service is **Live**, open the actual URL shown in its dashboard, and check `/api/health` returns `{"status":"ok","version":"0.2.0"}`.
5. Use only synthetic information. Confirm task creation, sample-provider offers, quote acceptance, messaging and payment blocking. Test once after a service restart as well.

The button explicitly targets this working branch, where the Blueprint lives. `autoDeployTrigger: off` prevents later commits from unexpectedly redeploying your instance. You can manually deploy a reviewed commit in Render.

## Important limitations

- **Shared public demonstration, not customer accounts.** All visitors can choose the same sample identities. The UI and task/request dialogs display this warning. Do not enter real addresses, phone numbers, identity material or confidential conversations.
- `PUBLIC_DEMO=true` requires sample auth and forces an **in-memory database**, regardless of any supplied database path. No real data should be retained; all sample interactions reset on process restart. Public demo task/message/session counts are bounded.
- The Blueprint deliberately uses `NODE_ENV=development`: it deploys the existing pre-launch sample application, **not an approved production marketplace**. The production startup guard and unavailable-payment adapter are not bypassed or removed.
- The published [Render Free documentation](https://render.com/docs/free) says free web services spin down after 15 idle minutes, may take about a minute to wake, have ephemeral filesystems, cannot attach persistent disks and can be suspended on usage limits. Included hours are shared across a workspace. Review current billing, bandwidth/build usage and spend controls before approval.
- No artificial keep-alive job is configured to evade free-tier sleeping. No external monitoring or authentication service is silently activated.
- Browser service-worker installation depends on HTTPS, browser support and successful initial online loading. Private/API responses are never cached and writes are never replayed.
- Public launch still requires real auth setup, hosted transactional data/backups, provider verification, payments, privacy/account controls and operational safety/support readiness. Do not remove the safeguards simply to label the demo production-ready.

Official deployment-button reference: [Deploy to Render](https://render.com/docs/deploy-to-render). No successful provider deployment, health check or domain reservation is implied by adding a Blueprint or opening a deploy link.
