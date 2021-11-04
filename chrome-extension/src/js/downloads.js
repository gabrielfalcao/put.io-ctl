export const sortDownloadsByMostBytesDownloadedAndLeastBytesTotal = (
  downloadItems
) => {
  const sortedBySize = [...downloadItems];
  sortedBySize.sort((a, b) => {
    if (a.totalBytes < b.totalBytes) {
      return 1;
    } else if (a.totalBytes > b.totalBytes) {
      return -1;
    }
    if (a.bytesReceived > b.bytesReceived) {
      return 1;
    } else if (a.bytesReceived < b.bytesReceived) {
      return -1;
    }
    return 1;
  });
  return sortedBySize;
};

export const pickLargestResumableDownloadWithMostDownloadedBytes = (
  downloadItems
) => {
  const paused = downloadItems.filter(
    (item) => item.state === "interrupted" && item.canResume
  );
  const sortedBySize = sortDownloadsByMostBytesDownloadedAndLeastBytesTotal(
    downloadItems
  );
  return sortedBySize[sortedBySize.length - 1];
};
// known properties from a downloadItem

// error: "USER_CANCELED"
// state: "interrupted"
// state: "complete"
// state: "in_progress"
export const pickAndResumeLargestDownload = (downloadItems) => {
  const largest = pickLargestResumableDownloadWithMostDownloadedBytes(
    downloadItems
  );
  if (!largest) {
    /* console.log(
     *   `%cFound no Largest Download`,
     *   "color: #666;background-color:#fff;font-size:12px"
     * ); */
    return;
  }
  const { filename, url } = largest;
  const title = (filename && filename.length > 0 && filename) || url;
  chrome.downloads.resume(largest.id, () => {
    console.log(
      `%cAuto-resuming download %c${title}`,
      "color: #333;background-color:#9d9;font-size:12px;font-family:Monaco",
      "color: #FFF;background-color:#999;font-size:12px;font-family:Monaco",
      largest
    );
  });
  return largest;
};
export const breakdownDownloadList = (all) => {
  const resumable = sortDownloadsByMostBytesDownloadedAndLeastBytesTotal(
    all.filter((item) => item.state === "interrupted" && item.canResume)
  );
  const stale = sortDownloadsByMostBytesDownloadedAndLeastBytesTotal(
    all.filter(
      (item) => item.state === "interrupted" && item.error && !item.canResume
    )
  );
  const inProgress = sortDownloadsByMostBytesDownloadedAndLeastBytesTotal(
    all.filter((item) => item.state === "in_progress")
  );

  return { all, resumable, stale, inProgress };
};

export const getAllPutIODownloads = (callback) => {
  chrome.downloads.search({ urlRegex: ".*putio.*" }, (downloadItems) => {
    const all = sortDownloadsByMostBytesDownloadedAndLeastBytesTotal(
      downloadItems
    );
    const { resumable, stale, inProgress } = breakdownDownloadList(all);

    callback({ all, resumable, stale, inProgress });
  });
};

export const getDownloadById = (id, callback) => {
  chrome.downloads.search({ id }, (downloadItems) => {
    callback((downloadItems.length > 0 && downloadItems[0]) || {});
  });
};
