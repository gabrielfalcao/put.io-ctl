import "../img/icon-128.png";
import "../img/icon-34.png";
import { metadataFromMediaUrl, extractUsername } from "putio/urls";
import { ButlerStorage } from "putio/storage";
import {
  getDownloadById,
  pickAndResumeLargestDownload,
  getAllPutIODownloads,
} from "putio/downloads";
import { sendUrl, urlStream, waitForUrl } from "./messages";

const database = new ButlerStorage();
export const tabInfo = { url: null };
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // onUpdated should fire when the selected tab is changed or a link is clicked
  chrome.tabs.getSelected(null, function (tab) {
    tabInfo.url = tab.url;
  });
});

urlStream.subscribe(([url, sender]) => {
  console.log(
    `%c${url}`,
    "color:#222;background: #cfc;font-size:18px;font-family:Monaco"
  );

  database.addUrls([url], () => {
    console.warn(`${url}`);
  });
});

const eraseStaledDownloads = (stale) => {
  for (const item of stale) {
    const { id } = item;
    chrome.downloads.erase({ id }, () => {
      console.log(`erased download ${id}`, item);
    });
  }
};
const monitorDownloadsOnce = (currentDownloadInProgress, sourceName) => {
  const { id, state } = currentDownloadInProgress;
  if (state && state.current) {
    database.setDownloadStatusForUrl(id, state.current, () => {
      console.log(
        `%c${sourceName} %cset download status %c${state.current}`,
        "color:#222;background: #cfc;font-size:10px;font-family:Monaco",
        "color:#222;background: #ccf;font-size:10px;font-family:Monaco",
        "color:#222;background: #fcc;font-size:10px;font-family:Monaco"
      );
    });
  }
  getAllPutIODownloads(({ all, resumable, stale, inProgress }) => {
    // resume largest download
    const largest = pickAndResumeLargestDownload(resumable);
    if (largest) {
      /* console.log(
       *   "%c LARGEST DOWNLOAD",
       *   "color: blue;font-size:20px;",
       *   JSON.stringify(largest, null, 2)
       * ); */
    }
    eraseStaledDownloads(stale);
  });
};

const onDownloadCreated = (downloadDelta) => {
  monitorDownloadsOnce(downloadDelta, "onDownloadCreated");
};
const onDownloadChanged = (downloadDelta) => {
  const { paused, state, id } = downloadDelta;
  getDownloadById(id, (meta) => {
    const { filename, url } = meta || {};
    const title = (filename && filename.length > 0 && filename) || url || id;

    monitorDownloadsOnce({ ...meta, ...downloadDelta }, `onDownloadChanged`);
    if (id && state && state.current === "complete") {
      console.log(
        `%c Download Complete %c${title}`,
        "color: white;background-color:#373;font-size:12px;font-family:Monaco",
        "color: white;background-color:#337;font-size:12px;font-family:Monaco"
      );
      database.setDownloadCompleted(meta.url, () => {
        chrome.downloads.erase({ id }, () => {
          /* console.log(
           *   `%c Download Erased %c${title}`,
           *   "color: white;background-color:#733;font-size:12px;font-family:Monaco",
           *   "color: white;background-color:#333;font-size:12px;font-family:Monaco"
           * ); */
        });
      });
    }
  });
  return true;
};
const onDownloadErased = (downloadDelta) => {
  monitorDownloadsOnce(downloadDelta, "onDownloadErased");
};

chrome.downloads.onCreated.addListener(onDownloadCreated);
chrome.downloads.onChanged.addListener(onDownloadChanged);
chrome.downloads.onErased.addListener(onDownloadErased);
//chrome.downloads.onDeterminingFilename.addListener((download, suggest) => {
//  database.loadUrls((urls) => {
//    if (!urls || !urls.length) {
//      return;
//    }
//    for (const item of urls) {
//      const { url, username, filename } = item;
//      if (url === download.url || url === download.finalUrl) {
//        try {
//          suggest({
//            filename,
//            conflictAction: "overwrite",
//          });
//          console.log(
//            `%cadding ${username} to filename %c${filename}`,
//            "color: #333;background-color:#fc0;font-size:12px;font-family:Monaco",
//            "color: white;background-color:#337;font-size:12px;font-family:Monaco",
//            item,
//            download
//          );
//          return;
//        } catch (error) {
//          console.error(
//            `%cadding ${username} to filename %c${filename}`,
//            "color: #333;background-color:#fcc;font-size:12px;font-family:Monaco",
//            "color: white;background-color:#222;font-size:12px;font-family:Monaco",
//            error,
//            item
//          );
//          return;
//        }
//      }
//    }
//  });
//});
//
