@echo off
set PATH=C:\Users\Admin\AppData\Local\ms-playwright-go\1.57.0;%PATH%
node node_modules\prisma\build\index.js generate --schema=packages\db\schema.prisma
