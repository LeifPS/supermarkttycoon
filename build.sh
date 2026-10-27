#!/bin/bash
# Baut public/index.html aus den Quelldateien in src/
cd "$(dirname "$0")/src"
mkdir -p ../public
{
  echo '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
  echo "<style>"; cat fonts.css; echo "</style>"
  cat h_head.html
  echo "<script>"
  cat a_util.js b_data.js c_state.js d_audio.js e_draw.js e_items.js e_scene.js f_ui.js f2_pages.js g_game.js
  echo "</script>"
} > ../public/index.html
node -e "const s=require('fs').readFileSync('../public/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/)[1];try{new Function(m);console.log('syntax ok')}catch(e){console.log('ERR',e.message)}"
