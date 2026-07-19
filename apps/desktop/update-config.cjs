function updateSourceFromEnvironment(env = process.env, metadata = {}) {
  if (env.COMPANION_UPDATE_PROVIDER === 'generic') return { provider: 'generic', url: env.COMPANION_UPDATE_URL };
  if (env.COMPANION_UPDATE_PROVIDER === 'github') return { provider: 'github', owner: env.COMPANION_UPDATE_GITHUB_OWNER, repo: env.COMPANION_UPDATE_GITHUB_REPO };
  return metadata.companionUpdateSource;
}

module.exports = { updateSourceFromEnvironment };
