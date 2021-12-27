const getCookie = (key) => {
    const entries = document.cookie.split(';').map(e => e.trim())
    const keyEntries = entries.filter(entry => entry.split('=')[0] === key);
    if (keyEntries.length === 0)
        return undefined;
    else
        return decodeURIComponent(keyEntries[0].split('=')[1]);
}

const setCookie = (key, val) => {
    document.cookie = `${key}=${encodeURIComponent(val)};SameSite=None;`
}

export {
    getCookie,
    setCookie
}
