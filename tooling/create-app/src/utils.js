function pkgFromUserAgent(userAgent) {
    if (!userAgent) return {};
    const [pkgSpec] = userAgent.split(' ');
    const [name, version] = pkgSpec.split('/');
    return { name, version };
}

export const pkgManager = pkgFromUserAgent(process.env.npm_config_user_agent).name || 'npm';
