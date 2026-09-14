const fs = require('fs');
const { execSync } = require('child_process');

// 1. SCREENSHOT 1: LOGIN
const iphoneSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#080B11"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  <circle cx="621" cy="400" r="400" fill="#2563EB" opacity="0.15" filter="blur(60px)"/>
  <text x="621" y="240" font-family="sans-serif" font-size="52" font-weight="800" fill="#60A5FA" text-anchor="middle">WEBCONNECT TELECOM</text>
  <text x="621" y="320" font-family="sans-serif" font-size="38" font-weight="600" fill="#94A3B8" text-anchor="middle">Acesse sua Conta com CPF/CNPJ</text>
  <rect x="121" y="420" width="1000" height="2050" rx="90" fill="#020617" stroke="#334155" stroke-width="8"/>
  <rect x="141" y="440" width="960" height="2010" rx="70" fill="#080B11"/>
  <rect x="471" y="470" width="300" height="55" rx="27" fill="#000000"/>
  <text x="621" y="700" font-family="sans-serif" font-size="54" font-weight="900" fill="#2563EB" text-anchor="middle">WebConnect</text>
  <text x="621" y="750" font-family="sans-serif" font-size="28" font-weight="700" fill="#60A5FA" text-anchor="middle" letter-spacing="4">TELECOMUNICAÇÕES</text>
  <text x="621" y="900" font-family="sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" text-anchor="middle">Área do Cliente</text>
  <text x="621" y="960" font-family="sans-serif" font-size="28" fill="#94A3B8" text-anchor="middle">Informe o CPF/CNPJ do titular do contrato</text>
  <rect x="221" y="1030" width="800" height="120" rx="24" fill="#1E293B" stroke="#3B82F6" stroke-width="4"/>
  <text x="271" y="1105" font-family="sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">397.111.098-32</text>
  <rect x="221" y="1200" width="800" height="120" rx="28" fill="url(#btnGrad)"/>
  <text x="621" y="1272" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">Entrar no Aplicativo</text>
  <text x="621" y="2350" font-family="sans-serif" font-size="26" font-weight="600" fill="#64748B" text-anchor="middle">🛡️ Conexão Segura e Criptografada • WebConnect</text>
</svg>`;

// 2. SCREENSHOT 2: DASHBOARD & FINANCES
const iphoneSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#080B11"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  <circle cx="621" cy="400" r="400" fill="#10B981" opacity="0.15" filter="blur(60px)"/>
  <text x="621" y="240" font-family="sans-serif" font-size="52" font-weight="800" fill="#34D399" text-anchor="middle">FINANCEIRO E PAGAMENTOS</text>
  <text x="621" y="320" font-family="sans-serif" font-size="38" font-weight="600" fill="#94A3B8" text-anchor="middle">Copie a Chave PIX e Baixe a 2ª Via de Fatura</text>
  <rect x="121" y="420" width="1000" height="2050" rx="90" fill="#020617" stroke="#334155" stroke-width="8"/>
  <rect x="141" y="440" width="960" height="2010" rx="70" fill="#080B11"/>
  <rect x="471" y="470" width="300" height="55" rx="27" fill="#000000"/>
  
  <!-- Header Bar -->
  <text x="221" y="600" font-family="sans-serif" font-size="40" font-weight="800" fill="#FFFFFF">Olá, Guilherme!</text>
  <text x="221" y="645" font-family="sans-serif" font-size="26" fill="#94A3B8">Contrato: #1667 • Plano 400 Mega Fibra</text>
  <rect x="841" y="570" width="160" height="60" rx="20" fill="#10B98120"/>
  <text x="921" y="610" font-family="sans-serif" font-size="26" font-weight="800" fill="#10B981" text-anchor="middle">ATIVO</text>
  
  <!-- Invoice Main Card -->
  <rect x="221" y="720" width="800" height="500" rx="36" fill="url(#cardGrad)" stroke="#2563EB" stroke-width="3"/>
  <text x="271" y="790" font-family="sans-serif" font-size="30" font-weight="700" fill="#94A3B8">FATURA ATUAL</text>
  <text x="271" y="870" font-family="sans-serif" font-size="64" font-weight="900" fill="#FFFFFF">R$ 99,90</text>
  <text x="271" y="930" font-family="sans-serif" font-size="28" font-weight="600" fill="#10B981">Vencimento: 10/09/2026</text>
  
  <rect x="271" y="990" width="700" height="100" rx="24" fill="url(#btnGrad)"/>
  <text x="621" y="1052" font-family="sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle"> Copiar Código PIX</text>
  
  <!-- Secondary Action Cards -->
  <rect x="221" y="1260" width="380" height="240" rx="32" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <text x="411" y="1340" font-family="sans-serif" font-size="44" text-anchor="middle">📄</text>
  <text x="411" y="1410" font-family="sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">Baixar PDF Boleto</text>
  
  <rect x="641" y="1260" width="380" height="240" rx="32" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <text x="831" y="1340" font-family="sans-serif" font-size="44" text-anchor="middle">⚡</text>
  <text x="831" y="1410" font-family="sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">Desbloqueio Auto</text>
</svg>`;

fs.writeFileSync('iphone_1.svg', iphoneSvg1);
fs.writeFileSync('iphone_2.svg', iphoneSvg2);

try {
  execSync('qlmanage -t -s 2688 -o . iphone_1.svg', { stdio: 'inherit' });
  execSync('sips -z 2688 1242 iphone_1.svg.png --out iphone_6.5_screenshot_1.png', { stdio: 'inherit' });
  
  execSync('qlmanage -t -s 2688 -o . iphone_2.svg', { stdio: 'inherit' });
  execSync('sips -z 2688 1242 iphone_2.svg.png --out iphone_6.5_screenshot_2.png', { stdio: 'inherit' });

  // Cleanup
  try { fs.unlinkSync('iphone_1.svg'); } catch(e){}
  try { fs.unlinkSync('iphone_1.svg.png'); } catch(e){}
  try { fs.unlinkSync('iphone_2.svg'); } catch(e){}
  try { fs.unlinkSync('iphone_2.svg.png'); } catch(e){}

  console.log('✅ Novas capturas de tela do aplicativo em uso geradas com sucesso!');
} catch (err) {
  console.error('Erro ao gerar capturas:', err.message);
}
