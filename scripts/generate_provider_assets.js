const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateProviderScreenshots(provider) {
  const { slug, name, primaryColor, secondaryColor } = provider;
  const outDir = path.resolve(__dirname, `../assets/providers/${slug}/screenshots`);
  fs.mkdirSync(outDir, { recursive: true });

  const color1 = primaryColor || '#2563EB';

  const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#080B11"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color1}"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  <circle cx="621" cy="400" r="400" fill="${color1}" opacity="0.2" filter="blur(60px)"/>
  <text x="621" y="240" font-family="sans-serif" font-size="52" font-weight="800" fill="${color1}" text-anchor="middle">${name.toUpperCase()}</text>
  <text x="621" y="320" font-family="sans-serif" font-size="38" font-weight="600" fill="#94A3B8" text-anchor="middle">Acesse sua Conta com CPF/CNPJ</text>
  <rect x="121" y="420" width="1000" height="2050" rx="90" fill="#020617" stroke="#334155" stroke-width="8"/>
  <rect x="141" y="440" width="960" height="2010" rx="70" fill="#080B11"/>
  <rect x="471" y="470" width="300" height="55" rx="27" fill="#000000"/>
  <text x="621" y="700" font-family="sans-serif" font-size="54" font-weight="900" fill="${color1}" text-anchor="middle">${name}</text>
  <text x="621" y="750" font-family="sans-serif" font-size="28" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="4">ÁREA DO CLIENTE</text>
  <text x="621" y="900" font-family="sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" text-anchor="middle">Bem-vindo</text>
  <text x="621" y="960" font-family="sans-serif" font-size="28" fill="#94A3B8" text-anchor="middle">Informe o CPF/CNPJ do titular do contrato</text>
  <rect x="221" y="1030" width="800" height="120" rx="24" fill="#1E293B" stroke="${color1}" stroke-width="4"/>
  <text x="271" y="1105" font-family="sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">397.111.098-32</text>
  <rect x="221" y="1200" width="800" height="120" rx="28" fill="url(#btnGrad)"/>
  <text x="621" y="1272" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">Entrar no Aplicativo</text>
  <text x="621" y="2350" font-family="sans-serif" font-size="26" font-weight="600" fill="#64748B" text-anchor="middle">🛡️ Conexão Segura e Criptografada • ${name}</text>
</svg>`;

  const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#080B11"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  <circle cx="621" cy="400" r="400" fill="#10B981" opacity="0.15" filter="blur(60px)"/>
  <text x="621" y="240" font-family="sans-serif" font-size="52" font-weight="800" fill="#34D399" text-anchor="middle">FINANCEIRO E FATURAS</text>
  <text x="621" y="320" font-family="sans-serif" font-size="38" font-weight="600" fill="#94A3B8" text-anchor="middle">Copie a Chave PIX e Baixe a 2ª Via de Fatura</text>
  <rect x="121" y="420" width="1000" height="2050" rx="90" fill="#020617" stroke="#334155" stroke-width="8"/>
  <rect x="141" y="440" width="960" height="2010" rx="70" fill="#080B11"/>
  <rect x="471" y="470" width="300" height="55" rx="27" fill="#000000"/>
  <text x="221" y="650" font-family="sans-serif" font-size="44" font-weight="800" fill="#FFFFFF">Suas Faturas</text>
  <rect x="221" y="720" width="800" height="340" rx="32" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  <text x="271" y="800" font-family="sans-serif" font-size="32" font-weight="700" fill="#FFFFFF">Mensalidade Internet Fibra</text>
  <text x="271" y="860" font-family="sans-serif" font-size="28" font-weight="600" fill="#94A3B8">Vencimento: 10/10/2026</text>
  <text x="271" y="980" font-family="sans-serif" font-size="48" font-weight="900" fill="#34D399">R$ 99,90</text>
  <rect x="680" y="910" width="300" height="90" rx="20" fill="url(#btnGrad)"/>
  <text x="830" y="965" font-family="sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">Pagar PIX</text>
</svg>`;

  const svg1Path = path.join(outDir, 'temp1.svg');
  const svg2Path = path.join(outDir, 'temp2.svg');
  fs.writeFileSync(svg1Path, svg1);
  fs.writeFileSync(svg2Path, svg2);

  const png1Path = path.join(outDir, 'iphone_6.5_1.png');
  const png2Path = path.join(outDir, 'iphone_6.5_2.png');

  try {
    execSync(`qlmanage -t -s 2688 -o "${outDir}" "${svg1Path}" && mv "${path.join(outDir, 'temp1.svg.png')}" "${png1Path}"`);
    execSync(`qlmanage -t -s 2688 -o "${outDir}" "${svg2Path}" && mv "${path.join(outDir, 'temp2.svg.png')}" "${png2Path}"`);
    fs.unlinkSync(svg1Path);
    fs.unlinkSync(svg2Path);
    console.log(`✅ Screenshots gerados com sucesso para ${name} em: ${outDir}`);
  } catch (err) {
    console.log(`Erro ao converter svg para png: ${err.message}`);
  }
}

generateProviderScreenshots({ slug: 'cbrfibra', name: 'CBR FIBRA', primaryColor: '#a99b04' });
generateProviderScreenshots({ slug: 'webconnect', name: 'Web Connect Telecom', primaryColor: '#0e5ddd' });
