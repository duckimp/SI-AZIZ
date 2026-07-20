#!/bin/bash
export NVM_DIR="/home/andi/.nvm"
export PATH="/home/andi/.nvm/versions/node/v20.20.2/bin:$PATH"

echo "Node: $(node --version)"
echo "NPM:  $(npm --version)"
echo ""
echo "Starting SI-AZIZ dev server..."
cd /media/andi/DATA/PROJECT/SI-AZIZ
npm run dev
