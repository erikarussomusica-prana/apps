// Gera as pontes instaláveis (PWA) de cada app da Prana: index.html + manifest + ícones.
// Uso: node gerar.js   (precisa do Chrome instalado para desenhar os ícones)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const RAIZ = path.resolve(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const apps = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8'));
const tmp = path.join(__dirname, '_tmp'); fs.mkdirSync(tmp, { recursive: true });

function svgIcone(a, mask) {
  // mask = ícone "maskable": o Android recorta em círculo/forma; o desenho fica no miolo (zona segura 80%).
  const tam = mask ? 230 : 280, y = mask ? 300 : 320;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:512px;height:512px;overflow:hidden;background:transparent}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><radialGradient id="g" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${a.cor1}"/><stop offset="1" stop-color="${a.cor2}"/></radialGradient></defs>
<rect width="512" height="512" rx="${mask ? 0 : 112}" fill="url(#g)"/>
<circle cx="256" cy="${mask ? 246 : 236}" r="${mask ? 150 : 178}" fill="#fff" opacity=".16"/>
<text x="256" y="${y}" text-anchor="middle" font-size="${tam}" font-family="Segoe UI Emoji">${a.emoji}</text>
</svg></body></html>`;
}

function png(html, saida, lado) {
  const f = path.join(tmp, 'i.html'); fs.writeFileSync(f, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
    '--force-device-scale-factor=' + (lado / 512), '--window-size=512,512', '--screenshot=' + saida, 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
}

function pagina(a) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${a.nome}</title>
<meta name="theme-color" content="${a.cor2}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${a.curto}">
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>
  html,body{margin:0;height:100%;background:${a.cor2}}
  iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff}
  .msg{color:#fff;font:16px system-ui,sans-serif;text-align:center;padding:30vh 24px 0;max-width:460px;margin:0 auto}
  .msg b{font-size:44px;display:block;margin-bottom:10px}
</style>
</head>
<body>
<script>
  /* Ponte da Prana: o link do app chega UMA vez depois do # (ex.: .../${a.slug}/#u=LINK) e fica guardado
     neste celular. Depois, o ícone da tela inicial abre direto. Nenhum link nem chave fica neste site. */
  var CHAVE = 'ponte_${a.slug}', MODO = '${a.modo}';
  var ok = function (u) { return typeof u === 'string' && /^https:\\/\\/script\\.google\\.com\\/macros\\/s\\/[\\w-]+\\/exec([?][\\w=&%.-]*)?$/.test(u); };
  var h = location.hash.match(/[#&]u=([^&]+)/), u = '';
  if (h) { try { u = decodeURIComponent(h[1]); } catch (e) {} }
  if (ok(u)) { try { localStorage.setItem(CHAVE, u); } catch (e) {} history.replaceState(null, '', location.pathname); }
  else { try { u = localStorage.getItem(CHAVE) || ''; } catch (e) {} }
  if (!ok(u)) {
    document.body.innerHTML = '<div class="msg"><b>${a.emoji}</b><p>Abra este app pela <strong>Central da Prana</strong>, no botão <strong>📲 Instalar no celular</strong>.</p><p>Depois, no Chrome: ⋮ → <strong>Instalar app</strong>.</p></div>';
  } else if (MODO === 'ir') {
    var instalado = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    if (instalado) { location.replace(u); }
    else {
      document.body.innerHTML = '<div class="msg"><b>${a.emoji}</b><p><strong>${a.nome}</strong> pronto para instalar.</p><p>No Chrome, toque em <strong>⋮</strong> (canto de cima) → <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p><p style="margin-top:28px"><a href="' + u.replace(/"/g, '') + '" style="display:inline-block;background:#fff;color:${a.cor2};padding:12px 22px;border-radius:10px;font-weight:700;text-decoration:none">Abrir agora sem instalar</a></p></div>';
    }
  } else {
    var f = document.createElement('iframe');
    f.src = u; f.title = '${a.nome}';
    f.allow = 'microphone; camera; clipboard-read; clipboard-write; autoplay; fullscreen; geolocation';
    document.body.appendChild(f);
  }
</script>
</body>
</html>
`;
}

const lista = [];
for (const a of apps) {
  const d = path.join(RAIZ, a.slug); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), pagina(a));
  fs.writeFileSync(path.join(d, 'manifest.json'), JSON.stringify({
    id: './', name: a.nome, short_name: a.curto, start_url: './', scope: './', display: 'standalone',
    background_color: a.cor2, theme_color: a.cor2, lang: 'pt-BR',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2));
  png(svgIcone(a, false), path.join(d, 'icon-512.png'), 512);
  png(svgIcone(a, false), path.join(d, 'icon-192.png'), 192);
  png(svgIcone(a, false), path.join(d, 'favicon.png'), 64);
  png(svgIcone(a, true), path.join(d, 'icon-maskable-512.png'), 512);
  png(svgIcone(a, true), path.join(d, 'apple-touch-icon.png'), 180);
  lista.push(a.slug);
  console.log('ok', a.slug);
}
fs.writeFileSync(path.join(RAIZ, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Prana</title><p style="font:16px system-ui;padding:24px">Prana Escola de Música.</p>\n');
fs.writeFileSync(path.join(RAIZ, '.nojekyll'), '');
fs.rmSync(tmp, { recursive: true, force: true });
