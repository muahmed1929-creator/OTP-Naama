@echo off
set PATH=C:\Users\Admin\AppData\Local\ms-playwright-go\1.57.0;%PATH%
node node_modules\tsx\dist\cli.mjs --watch --tsconfig tsconfig.json apps/api/src/index.ts
