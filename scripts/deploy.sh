#!/usr/bin/env bash
# Build the static site, inject the Google tag (kept out of git), and sync to the server.
# Local-only settings live in .deploy.env (gitignored), e.g.:
#   GA_ID=G-XXXXXXXXXX
#   DEPLOY_HOST=circuitpaint        # ssh host alias from ~/.ssh/config
#   DEPLOY_PATH=www/public/
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .deploy.env ] && source .deploy.env
: "${DEPLOY_HOST:?set DEPLOY_HOST in .deploy.env}" "${DEPLOY_PATH:?set DEPLOY_PATH in .deploy.env}"

npm run build
if [ -n "${GA_ID:-}" ]; then
  GA_ID="$GA_ID" python3 - <<'PY'
import glob, os
i = os.environ['GA_ID']
tag = (f'<script async src="https://www.googletagmanager.com/gtag/js?id={i}"></script>'
       f'<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}'
       f"gtag('js',new Date());gtag('config','{i}');</script>")
for f in glob.glob('out/*.html'):
    s = open(f).read()
    open(f, 'w').write(s.replace('</head>', tag + '</head>', 1))
PY
fi
rsync -az --delete --exclude favicon.png out/ "$DEPLOY_HOST:$DEPLOY_PATH"
