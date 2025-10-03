This repository contains a Vite React frontend in `responsive-web-app`.

GitHub Pages deploy

- The GitHub Actions workflow at `.github/workflows/deploy-gh-pages.yml` builds the frontend and publishes the `responsive-web-app/dist` directory to GitHub Pages on pushes to `main`.

How it works

1. The workflow checks out the repo, installs Node.js, runs `npm ci` in `responsive-web-app`, builds the app (`npm run build`) and publishes `responsive-web-app/dist` using the official Pages actions.

If you need a custom domain, add a `CNAME` file to `responsive-web-app/dist` during build (or add it to the repo root and copy in a build step).

Smoke test

The workflow includes a smoke-test step that pings the published Pages URL after deployment and fails the workflow if the site doesn't respond with an HTTP 200 within ~2 minutes. You can also run the workflow manually via the Actions tab.