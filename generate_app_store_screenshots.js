const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Read the WebConnect logo base64 if available
let logoBase64 = '';
try {
  logoBase64 = fs.readFileSync('assets/images/login_logo_base64.txt', 'utf8').trim();
  if (!logoBase64.startsWith('data:image')) {
    logoBase64 = `data:image/png;base64,${logoBase64}`;
  }
} catch (e) {}

// SVG template for iPhone 6.5" (1242 x 2688)
const iphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
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
  
  <!-- Background -->
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  
  <!-- Glow Orbs -->
  <circle cx="621" cy="400" r="400" fill="#2563EB" opacity="0.15" filter="blur(60px)"/>
  <circle cx="621" cy="1800" r="500" fill="#4F46E5" opacity="0.1" filter="blur(80px)"/>
  
  <!-- Header Text -->
  <text x="621" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#60A5FA" text-anchor="middle">WEBCONNECT TELECOM</text>
  <text x="621" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="600" fill="#94A3B8" text-anchor="middle">Sua Central de Atendimento na Palma da Mão</text>
  
  <!-- Device Frame Outer Mockup -->
  <rect x="121" y="420" width="1000" height="2050" rx="90" fill="#020617" stroke="#334155" stroke-width="8"/>
  <rect x="141" y="440" width="960" height="2010" rx="70" fill="#080B11"/>
  
  <!-- Dynamic Island Notch -->
  <rect x="471" y="470" width="300" height="55" rx="27" fill="#000000"/>
  
  <!-- App Screen Content -->
  <!-- Logo Section -->
  <g transform="translate(221, 620)">
    <text x="400" y="80" font-family="sans-serif" font-size="48" font-weight="900" fill="#2563EB" text-anchor="middle">WebConnect</text>
    <text x="400" y="130" font-family="sans-serif" font-size="24" font-weight="700" fill="#60A5FA" text-anchor="middle" letter-spacing="4">TELECOMUNICACÕES</text>
  </g>
  
  <!-- Welcome Title -->
  <text x="621" y="870" font-family="sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" text-anchor="middle">Área do Cliente</text>
  <text x="621" y="930" font-family="sans-serif" font-size="28" fill="#94A3B8" text-anchor="middle">Digite seu CPF/CNPJ para acessar faturas e suporte</text>
  
  <!-- Form Input Card -->
  <rect x="221" y="990" width="800" height="120" rx="24" fill="#1E293B" stroke="#3B82F6" stroke-width="4"/>
  <text x="271" y="1065" font-family="sans-serif" font-size="32" fill="#94A3B8">CPF ou CNPJ (apenas números)</text>
  
  <!-- Remember me -->
  <rect x="221" y="1160" width="36" height="36" rx="8" fill="#2563EB"/>
  <text x="276" y="1187" font-family="sans-serif" font-size="28" fill="#E2E8F0">Manter-me conectado</text>
  
  <!-- Login Button -->
  <rect x="221" y="1240" width="800" height="120" rx="28" fill="url(#btnGrad)"/>
  <text x="621" y="1312" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">Entrar com CPF/CNPJ</text>
  
  <!-- Features Cards Grid -->
  <!-- Card 1: Faturas & PIX -->
  <rect x="221" y="1420" width="380" height="300" rx="32" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <circle cx="301" cy="1500" r="40" fill="#2563EB" opacity="0.2"/>
  <text x="301" y="1515" font-family="sans-serif" font-size="40" fill="#60A5FA" text-anchor="middle">💳</text>
  <text x="261" y="1590" font-family="sans-serif" font-size="32" font-weight="800" fill="#FFFFFF">Segunda Via PIX</text>
  <text x="261" y="1635" font-family="sans-serif" font-size="24" fill="#94A3B8">Pague com facilidade pelo QR Code</text>
  
  <!-- Card 2: Desbloqueio Confiança -->
  <rect x="641" y="1420" width="380" height="300" rx="32" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <circle cx="721" cy="1500" r="40" fill="#10B981" opacity="0.2"/>
  <text x="721" y="1515" font-family="sans-serif" font-size="40" fill="#34D399" text-anchor="middle">⚡</text>
  <text x="681" y="1590" font-family="sans-serif" font-size="32" font-weight="800" fill="#FFFFFF">Desbloqueio Auto</text>
  <text x="681" y="1635" font-family="sans-serif" font-size="24" fill="#94A3B8">Liberte sua conexão instantaneamente</text>
  
  <!-- Card 3: Suporte 24h -->
  <rect x="221" y="1750" width="800" height="240" rx="32" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <circle cx="301" cy="1830" r="40" fill="#F59E0B" opacity="0.2"/>
  <text x="301" y="1845" font-family="sans-serif" font-size="40" fill="#FBBF24" text-anchor="middle">💬</text>
  <text x="371" y="1825" font-family="sans-serif" font-size="32" font-weight="800" fill="#FFFFFF">Atendimento via WhatsApp</text>
  <text x="371" y="1870" font-family="sans-serif" font-size="24" fill="#94A3B8">Fale diretamente com nossa equipe técnica de suporte</text>
  
  <!-- Footer Security Badge -->
  <text x="621" y="2350" font-family="sans-serif" font-size="26" font-weight="600" fill="#64748B" text-anchor="middle">🛡️ Conexão Segura e Criptografada • WebConnect Telecom</text>
</svg>`;

// SVG template for iPad 13" (2048 x 2732)
const ipadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2732" viewBox="0 0 2048 2732">
  <defs>
    <linearGradient id="bgGradPad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#080B11"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="cardGradPad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="btnGradPad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="2048" height="2732" fill="url(#bgGradPad)"/>
  
  <!-- Glow Orbs -->
  <circle cx="1024" cy="500" r="600" fill="#2563EB" opacity="0.15" filter="blur(80px)"/>
  <circle cx="1024" cy="2000" r="700" fill="#4F46E5" opacity="0.1" filter="blur(100px)"/>
  
  <!-- Header Title -->
  <text x="1024" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#60A5FA" text-anchor="middle">WEBCONNECT TELECOM</text>
  <text x="1024" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="600" fill="#94A3B8" text-anchor="middle">Aplicativo de Autoatendimento do Cliente</text>
  
  <!-- Device Outer Mockup -->
  <rect x="224" y="440" width="1600" height="2100" rx="60" fill="#020617" stroke="#334155" stroke-width="10"/>
  <rect x="254" y="470" width="1540" height="2040" rx="45" fill="#080B11"/>
  
  <!-- Screen Layout (Tablet Optimized) -->
  <!-- Logo Section -->
  <g transform="translate(624, 580)">
    <text x="400" y="90" font-family="sans-serif" font-size="64" font-weight="900" fill="#2563EB" text-anchor="middle">WebConnect</text>
    <text x="400" y="150" font-family="sans-serif" font-size="32" font-weight="700" fill="#60A5FA" text-anchor="middle" letter-spacing="6">TELECOMUNICACÕES</text>
  </g>
  
  <!-- Main Login Box -->
  <rect x="524" y="820" width="1000" height="600" rx="36" fill="url(#cardGradPad)" stroke="#334155" stroke-width="3"/>
  <text x="1024" y="920" font-family="sans-serif" font-size="48" font-weight="800" fill="#FFFFFF" text-anchor="middle">Área do Cliente</text>
  <text x="1024" y="975" font-family="sans-serif" font-size="28" fill="#94A3B8" text-anchor="middle">Digite seu CPF/CNPJ para acessar sua conta</text>
  
  <!-- Input -->
  <rect x="604" y="1030" width="840" height="110" rx="20" fill="#0F172A" stroke="#3B82F6" stroke-width="3"/>
  <text x="654" y="1100" font-family="sans-serif" font-size="32" fill="#94A3B8">CPF ou CNPJ</text>
  
  <!-- Submit button -->
  <rect x="604" y="1180" width="840" height="110" rx="24" fill="url(#btnGradPad)"/>
  <text x="1024" y="1250" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">Entrar</text>
  
  <!-- Bottom Grid Features -->
  <!-- Feature 1 -->
  <rect x="304" y="1500" width="440" height="340" rx="36" fill="url(#cardGradPad)" stroke="#334155" stroke-width="3"/>
  <text x="524" y="1590" font-family="sans-serif" font-size="54" text-anchor="middle">📄</text>
  <text x="524" y="1670" font-family="sans-serif" font-size="34" font-weight="800" fill="#FFFFFF" text-anchor="middle">Segunda Via PIX</text>
  <text x="524" y="1720" font-family="sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">Cópia rápida de chave PIX e boletos</text>

  <!-- Feature 2 -->
  <rect x="804" y="1500" width="440" height="340" rx="36" fill="url(#cardGradPad)" stroke="#334155" stroke-width="3"/>
  <text x="1024" y="1590" font-family="sans-serif" font-size="54" text-anchor="middle">⚡</text>
  <text x="1024" y="1670" font-family="sans-serif" font-size="34" font-weight="800" fill="#FFFFFF" text-anchor="middle">Desbloqueio Auto</text>
  <text x="1024" y="1720" font-family="sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">Desbloqueio por confiança em 1 clique</text>

  <!-- Feature 3 -->
  <rect x="1304" y="1500" width="440" height="340" rx="36" fill="url(#cardGradPad)" stroke="#334155" stroke-width="3"/>
  <text x="1524" y="1590" font-family="sans-serif" font-size="54" text-anchor="middle">💬</text>
  <text x="1524" y="1670" font-family="sans-serif" font-size="34" font-weight="800" fill="#FFFFFF" text-anchor="middle">Suporte 24h</text>
  <text x="1524" y="1720" font-family="sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">Atendimento direto via WhatsApp</text>
  
  <!-- Footer -->
  <text x="1024" y="2400" font-family="sans-serif" font-size="28" font-weight="600" fill="#64748B" text-anchor="middle">🛡️ Conexão Segura e Criptografada • WebConnect Telecom</text>
</svg>`;

fs.writeFileSync('iphone_6.5.svg', iphoneSvg);
fs.writeFileSync('ipad_13.svg', ipadSvg);

console.log('Arquivos SVG gerados com sucesso!');

try {
  // Convert SVG to PNG using sips & qlmanage
  execSync('qlmanage -t -s 2688 -o . iphone_6.5.svg', { stdio: 'inherit' });
  execSync('sips -z 2688 1242 iphone_6.5.svg.png --out iphone_6.5_screenshot.png', { stdio: 'inherit' });
  
  execSync('qlmanage -t -s 2732 -o . ipad_13.svg', { stdio: 'inherit' });
  execSync('sips -z 2732 2048 ipad_13.svg.png --out ipad_13_screenshot.png', { stdio: 'inherit' });

  // Cleanup temporary files
  try { fs.unlinkSync('iphone_6.5.svg'); } catch(e){}
  try { fs.unlinkSync('iphone_6.5.svg.png'); } catch(e){}
  try { fs.unlinkSync('ipad_13.svg'); } catch(e){}
  try { fs.unlinkSync('ipad_13.svg.png'); } catch(e){}

  console.log('✅ CAPTURAS DE TELA GERADAS COM SUCESSO:');
  console.log('- iphone_6.5_screenshot.png (1242x2688)');
  console.log('- ipad_13_screenshot.png (2048x2732)');
} catch (err) {
  console.error('Erro ao converter SVG para PNG:', err.message);
}
