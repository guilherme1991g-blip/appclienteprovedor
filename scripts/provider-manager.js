// scripts/provider-manager.js
// Utilitário para gerenciar provedores, builds e updates na arquitetura White-Label

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const configPath = path.resolve(__dirname, '../providers.config.js');
const providers = require(configPath);

const command = process.argv[2];
const targetProvider = process.argv[3];
const extraArg = process.argv.slice(4).join(' ');

function saveConfig(data) {
  const content = `// providers.config.js\n// Cadastro centralizado de configurações por provedor para a arquitetura White-Label\n\nmodule.exports = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(configPath, content, 'utf8');
}

switch (command) {
  case 'list':
    console.log('\n📱 Provedores Cadastrados no White-Label:\n');
    Object.entries(providers).forEach(([key, p]) => {
      console.log(`-----------------------------------------------`);
      console.log(`🔹 [${key}] - ${p.name}`);
      console.log(`   Bundle ID:   ${p.bundleIdentifier}`);
      console.log(`   EAS Project: ${p.projectId || 'Não vinculado'}`);
      console.log(`   Slug:        ${p.slug}`);
      console.log(`   Versão:      ${p.version} (Build ${p.buildNumber})`);
    });
    console.log(`-----------------------------------------------\n`);
    break;

  case 'update':
    if (!targetProvider || !providers[targetProvider]) {
      console.error(`❌ Provedor inválido! Use: node scripts/provider-manager.js update <provedor> "Mensagem"`);
      console.log(`Provedores disponíveis: ${Object.keys(providers).join(', ')}`);
      process.exit(1);
    }
    const message = extraArg || `Atualização para ${providers[targetProvider].name}`;
    console.log(`\n🚀 Enviando OTA Update para o provedor: ${providers[targetProvider].name} (${targetProvider})...`);
    console.log(`💬 Mensagem: "${message}"`);
    console.log(`🆔 EAS Project ID: ${providers[targetProvider].projectId}\n`);
    
    try {
      execSync(`APP_PROVIDER=${targetProvider} npx eas-cli update --channel production --environment production --message "${message}" --non-interactive`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log(`\n✅ Update publicado com sucesso para ${providers[targetProvider].name}!`);
    } catch (err) {
      console.error(`\n❌ Falha ao publicar update:`, err.message);
      process.exit(1);
    }
    break;

  case 'build':
    if (!targetProvider || !providers[targetProvider]) {
      console.error(`❌ Provedor inválido! Use: node scripts/provider-manager.js build <provedor> [ios|android]`);
      process.exit(1);
    }
    const platform = extraArg || 'ios';
    console.log(`\n🔨 Iniciando EAS Build para ${providers[targetProvider].name} (${platform})...`);
    try {
      execSync(`APP_PROVIDER=${targetProvider} npx eas-cli build --platform ${platform} --profile production`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
    } catch (err) {
      console.error(`\n❌ Falha ao iniciar build:`, err.message);
      process.exit(1);
    }
    break;

  default:
    console.log(`
Uso do Gerenciador de Provedores White-Label:
  node scripts/provider-manager.js list
  node scripts/provider-manager.js update <provedor> "Sua mensagem"
  node scripts/provider-manager.js build <provedor> [ios|android]
    `);
}
