const path = require('node:path');
const serviceIds = ['chat', 'vision', 'speech'];

function createSettingsStore({ safeStorage, fs, filePath }) {
  const read = () => {
    if (!fs.existsSync(filePath)) return { secrets: {} };
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return { secrets: {} }; }
  };
  const write = data => { fs.mkdirSync?.(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(data), { mode: 0o600 }); };
  return {
    saveSecret(service, value) {
      if (!serviceIds.includes(service)) throw new Error('未知服务');
      if (!safeStorage.isEncryptionAvailable()) throw new Error('系统加密不可用，未保存 API Key');
      const data = read();
      if (value) data.secrets[service] = safeStorage.encryptString(value).toString('base64'); else delete data.secrets[service];
      write(data);
    },
    getSecret(service) {
      const encrypted = read().secrets[service];
      if (!encrypted || !safeStorage.isEncryptionAvailable()) return '';
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
    },
    secretStatus() { const secrets = read().secrets; return Object.fromEntries(serviceIds.map(id => [id, Boolean(secrets[id]) ])); },
  };
}

module.exports = { createSettingsStore };
