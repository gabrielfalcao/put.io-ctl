import { isOfType } from "putio/kernel";
import { Logger } from "putio/logging";

const logger = new Logger("models", {
  level: "TRACE",
});

/** Represents the information of a user page (i.e.: with video and/or photos). */
export class Page {
  /**
   * Create a page object
   * @param {string} url - The url of a page.
   */
  constructor({ url }) {
    this.url = url;
    this.location = new URL(`${url}`);
  }
  /**
   * Get the y value.
   * @returns {string | null} The y value.
   */
  get username() {
    const pathParts = this.location.pathname.split("/");
    return pathParts[1] || null;
  }
}
/** Represents the metadata of a RemoteMedia . */
export class RemoteMediaMeta {
  /**
   * Create a RemoteMediaMeta
   * @param {string | null} username - The username
   * @param {string | null} filename - The filename
   */
  constructor({ username, filename }) {
    this.username = username;
    this.filename = filename;
  }
  setUsernameFromPage(page, force = false) {
    this.setUsername(page.username);
  }
  setUsername(username, force = false) {
    if (this.username && !force) {
      logger.info(
        `Page.setUsername NO-OP because a username is already set and force=false`
      );
      return;
    }
    this.username = page.username;
  }
}

export class RemoteMedia {
  constructor({ url, username, filename, ...kwargs }) {
    this.url = url;
    this.meta = { username, filename, ...kwargs };
  }
  get username() {
    const { meta } = this;

    if (Object.prototype.toString.call(meta.username) === "[object String]") {
      return meta.username;
    }
    const pathParts = this.location.pathname.split("/");
    this.meta.username = pathParts[1];
    return meta.username;
  }
}
