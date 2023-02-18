import { fileURLToPath } from 'url';

const pkgFromUserAgent = (userAgent) => {
    if (!userAgent) return {}
    const pkgSpec = userAgent.split(' ')[0]
    const pkgSpecArr = pkgSpec.split('/')
    return {
        name: pkgSpecArr[0],
        version: pkgSpecArr[1],
    }
}

export const pkgManager = pkgFromUserAgent(process.env.npm_config_user_agent).name || 'npm';

export function getPath(path) {
	return fileURLToPath(new URL(`../${path}`, import.meta.url).href);
}

const titles = {
    rn: 'react native',
};

export const getTitle = (str) => {
    (titles[str] || str).split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
