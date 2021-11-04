import React from "react";

import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";
import { getAllPutIODownloads, getDownloadById } from "putio/downloads";
import { ButlerStorage } from "putio/storage";

export const MAX_CONCURRENT_DOWNLOADS = 20;

const database = new ButlerStorage();
class DownloadButton extends React.Component {
  static propTypes = {
    ...actionPropTypes,
  };
  constructor(props) {
    super(props);
  }

  handleClick = (e) => {
    const { butler } = this.props;
    const urls = butler.all || [];
    if (!confirm(`Confirm download of ${urls.length} urls ?`)) {
      return;
    }

    const enqueued = [];
    for (const meta of urls) {
      const { url, username, filename, mediaType, params, pathname } = meta;
      const urlPathParts = url.split("/");
      /* if (enqueued.indexOf(url) !== -1) {
       *   continue;
       * }
       * if (enqueued.length >= MAX_CONCURRENT_DOWNLOADS) {
       *   continue;
       * }
       * enqueued.push(url); */
      getAllPutIODownloads(({ all, resumable, stale, inProgress }) => {
        const pendingUrls = inProgress.map((item) => item.url);
        const alreadyInProgress = pendingUrls.indexOf(url) !== -1;
        if (alreadyInProgress) {
          console.log(
            `%calready downloading %c${username} %c${pathname}`,
            "color:#222;background: #cfc;font-size:10px;font-family:Monaco",
            "color:#222;background: #ccf;font-size:10px;font-family:Monaco",
            "color:#222;background: #fcc;font-size:10px;font-family:Monaco"
          );
          return;
        }

        /* console.log(
         *   `%c:DOWNLOAD ${mediaType} ${filename}`,
         *   "color:#009900;background: #ffff99;font-size:20px;",
         *   { url, username, filename, mediaType },
         *   params
         * );
         */
        const options = {
          url: url,
          filename: filename,
          method: "GET",
          saveAs: false,
          conflictAction: "uniquify",
        };
        chrome.downloads.search({ url }, (found) => {
          // don't start download that already has an equivalent one in_progress for the same url
          if (found.length > 0) {
            return;
          }

          database.getDownloadStatusForUrl(pathname, (status, error) => {
            // having any status means it's already been enqueued
            if (status) {
              console.log(
                `%calready downloading %c${username} %c${pathname}`,
                "color:#222;background: #fc0;font-size:10px;font-family:Monaco",
                "color:#222;background: #ff0;font-size:10px;font-family:Monaco",
                "color:#222;background: #99f;font-size:10px;font-family:Monaco"
              );
              return;
            }
            chrome.downloads.download(options, (downloadId) => {
              getDownloadById(downloadId, (download) => {
                const { id, state, url } = download || { id: downloadId };
                if (state === "in_progress") {
                  chrome.downloads.pause(id, () => {
                    database.setDownloadInProgress(pathname, () => {
                      console.log(
                        `%c:PAUSED ${username} ${id} ${pathname}`,
                        "color:#ff9;background: #333;font-size:10px;font-family:Monaco"
                      );
                    });
                  });
                } else {
                  database.setDownloadStatusForUrl(pathname, state, () => {
                    console.log(
                      `%cdownload state set ${pathname}: ${pathname}`,
                      "color:#fd6;background: #333;font-size:10px;font-family:Monaco"
                    );
                  });
                }
              });
            });
          });
        });
      });
    }
  };
  render() {
    const { handleClick } = this;
    const { butler, downloads } = this.props;
    const urls = butler.all || [];
    return (
      <button
        className="ui primary button"
        onClick={handleClick}
        disabled={urls.length === 0}
      >
        Download {urls.length} files
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(DownloadButton);
