import { ensureType } from "putio/kernel";

const MAIN_URLS_KEY = "putio_butler_urls";

export class ButlerStorage {
  constructor() {}
  setJsonKey = (key, value, callback) => {
    ensureType(key, String);
    ensureType(callback, Function);
    const { getJsonKey } = this;
    const data = {};
    data[key] = value;
    /* console.log(`%cButlerStorage.setJsonKey`, "color: #666", key, value, data); */
    chrome.storage.local.set(data, () => {
      /* console.log(`chrome.storage.local.set(data) where data =>`, data);
       * console.log(`setJsonKey "${key}"`, data); */
      callback();
    });
  };
  getJsonKey = (key, callback) => {
    ensureType(callback, Function);
    chrome.storage.local.get(key, function (result) {
      const existing = result[key];
      if (!existing) {
        callback(null, new Error(`No key "${key}" in local storage`));

        return;
      }
      callback(result[key], null);
    });
  };

  loadUrls = (callback) => {
    ensureType(callback, Function);
    const { getJsonKey } = this;
    getJsonKey([MAIN_URLS_KEY], (loaded, error) => {
      if (error) {
        callback(null, error);
        return;
      }
      const urls = loaded || [];
      callback(urls, null);
      return;
    });
  };
  setUrls = (urls, callback) => {
    ensureType(urls, Array);
    ensureType(callback, Function);
    //    const { loadUrls } = this;
    /* console.log("%cButlerStorage.setUrls", "color: blue;font-size: 20px", urls); */
    this.setJsonKey(MAIN_URLS_KEY, urls, callback);
  };

  addUrls = (newUrls, callback) => {
    ensureType(newUrls, Array);
    ensureType(callback, Function);
    const { setUrls, loadUrls } = this;
    /* console.log("%cButlerStorage.addUrls", "color: blue", newUrls); */
    const allUrls = [];

    const containsItem = ({ url }) =>
      allUrls.map((item) => item.url).indexOf(url) !== -1;
    for (const item of newUrls) {
      if (!containsItem(item)) {
        allUrls.push(item);
      }
    }
    loadUrls((urls, error) => {
      const currentUrls = urls || [];
      for (const item of currentUrls) {
        if (!containsItem(item)) {
          allUrls.push(item);
        }
      }
      setUrls(allUrls, () => {
        callback(allUrls);
      });
    });
  };

  purgeUrls = (callback) => {
    ensureType(callback, Function);
    chrome.storage.local.remove(MAIN_URLS_KEY, () => {
      console.log(`chrome.storage.local.remove("${MAIN_URLS_KEY}")`);

      callback();
    });
  };

  getDownloadStatusForUrl = (pathname, callback) => {
    ensureType(pathname, String);
    ensureType(callback, Function);
    const { getJsonKey } = this;
    getJsonKey(`media-pathname:${pathname}`, (value, error) => {
      return callback(value, error);
    });
  };
  setDownloadStatusForUrl = (pathname, status, callback) => {
    ensureType(pathname, String);
    ensureType(status, String);
    ensureType(callback, Function);
    const { setJsonKey } = this;
    setJsonKey(`media-pathname:${pathname}`, status, callback);
  };

  downloadUrlMatchesStatus = (pathname, status, callback) => {
    ensureType(pathname, String);
    ensureType(status, String);
    ensureType(callback, Function);

    const { getDownloadStatusForUrl } = this;
    getDownloadStatusForUrl(pathname, (value, error) => {
      if (value === status) {
        return callback(true, error, value);
      }
    });
  };

  isDownloadInProgress = (pathname, callback) => {
    this.downloadUrlMatchesStatus(pathname, "in_progress", callback);
  };
  setDownloadInProgress = (pathname, callback) => {
    this.setDownloadStatusForUrl(pathname, "in_progress", callback);
  };

  isDownloadCompleted = (pathname, callback) => {
    this.downloadUrlMatchesStatus(pathname, "completed", callback);
  };
  setDownloadCompleted = (pathname, callback) => {
    this.setDownloadStatusForUrl(pathname, "completed", callback);
  };
}
export default ButlerStorage;
