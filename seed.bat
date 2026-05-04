@echo off
set PATH=C:\Users\Admin\AppData\Local\ms-playwright-go\1.57.0;%PATH%
node node_modules\tsx\dist\cli.mjs packages\db\check-seed.ts
