import React from "react";
import PropTypes from "prop-types";
import { jsx, css, Global, ClassNames } from "@emotion/react";

import { connect } from "react-redux";
import { ButlerStorage } from "putio/storage";
import { actions, actionPropTypes } from "putio/reducers";
import { getAllPutIODownloads } from "putio/downloads";

import { Logo } from "putio/popup/elements";
import { UrlList } from "putio/popup/elements";
import { PurgeButton } from "putio/popup/elements";
import { DownloadButton } from "putio/popup/elements";
import { ResumeDownloadsButton } from "putio/popup/elements";
import { PauseAllDownloadsButton } from "putio/popup/elements";
import { CancelAllDownloadsButton } from "putio/popup/elements";
import { ExportJsonToClipboardButton } from "putio/popup/elements";
import { Container } from "putio/popup/elements";

class MainScreen extends React.Component {
  static propTypes = {
    ...actionPropTypes,
  };

  constructor(props) {
    super(props);
    this.storage = new ButlerStorage();
  }
  componentDidMount() {
    const { loadUrls } = this;

    chrome.runtime.onMessage.addListener(this.onMessage);
    chrome.downloads.onCreated.addListener(this.onDownloadCreated);
    chrome.downloads.onChanged.addListener(this.onDownloadChanged);
    chrome.downloads.onErased.addListener(this.onDownloadErased);
    chrome.storage.onChanged.addListener(this.onStorageChanged);
    /* console.log(
     *   "%ccomponentDidMount",
     *   "font-size:32px;color:white;background:black",
     *   loadUrls
     * ); */
    this.loadTimer = setTimeout(() => {
      loadUrls();
    }, 314);
  }
  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.onMessage);
    chrome.downloads.onCreated.removeListener(this.onDownloadCreated);
    chrome.downloads.onChanged.removeListener(this.onDownloadChanged);
    chrome.downloads.onErased.removeListener(this.onDownloadErased);
    chrome.storage.onChanged.removeListener(this.onStorageChanged);
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }
  }

  onMessage = (message = {}) => {
    const { loadUrls, loadDownloads, props } = this;
    const { type, ...meta } = message;
    const { addUrl } = props;

    switch (type) {
      case "PUT_IO_VIDEO":
      case "PUT_IO_PHOTO":
      case "PUT_IO_REFRESH":
        loadUrls();
        break;
      default:
        break;
    }
    // "must return true from event handler". See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
    return true;
  };
  onDownloadCreated = (downloadItem) => {
    /* console.log("onDownloadCreated", downloadItem); */
    this.loadDownloads(() => {});
  };
  onDownloadChanged = (downloadDelta) => {
    const { loadDownloads } = this;
    const { addDownload, deleteDownload } = this.props;
    /* console.log("onDownloadChanged", downloadDelta); */
    this.loadDownloads(() => {
      if (downloadDelta.state) {
        switch (downloadDelta.state.current) {
          case "complete":
            return chrome.downloads.erase({ id: downloadDelta.id }, () => {});
          case "interrupted":
          case "in_progress":
          default:
            break;
        }
      }
    });
  };
  onStorageChanged = (storageDelta) => {
    // reload redux with the latest urls from storage
    this.loadUrls();
  };
  onDownloadErased = (downloadId) => {
    const { deleteUrl, downloads } = this.props;
    const { by_id } = downloads || {};
    const meta =
      by_id && by_id[downloadId] ? by_id[downloadId] : { id: downloadId };
    const payload = { id: downloadId };
    /* console.log("onDownloadDeleted", payload); */
    deleteUrl(payload);
  };

  loadUrls = () => {
    const { butler, downloads } = this.props;
    const { setUrls, addError } = this.props;
    const reducedUrls = [...(butler.all || []), downloads.all || []].filter(
      (item) => item.url || item.finalUrl
    );
    const reducedUrlStrings = reducedUrls.map((item) => item.url);
    this.storage.loadUrls((urls, error) => {
      /* console.log("%cPopup.storage.loadUrls", "color: red", urls, error); */
      setUrls({ urls: [...reducedUrls, ...(urls || [])] });
    });
  };
  loadDownloads = (callback) => {
    /* const { setDownloads } = this.props;
     * getAllPutIODownloads(({ all, resumable, stale, inProgress }) => {
     *   setDownloads({ downloads: all });
     *   if (callback) {
     *     callback({ all, resumable, stale, inProgress });
     *   }
     * }); */
  };

  render() {
    const { props } = this;
    const { butler, downloads } = props;

    const urls = [...(butler.all || []), downloads.all || []].filter(
      (item) => item.url || item.finalUrl
    );

    return (
      <Container>
        <div className="column">
          <Logo showText={!urls || urls.length === 0} />
          {urls && urls.length > 0 ? (
            <div className="ui message">
              <div className="header">{urls.length} Ready for download</div>
              <UrlList urls={urls} />
            </div>
          ) : null}

          <div className="ui message">
            <center>
              <div className="ui buttons">
                <DownloadButton />
                <ResumeDownloadsButton />
              </div>
              <div className="ui divider"></div>
              <div className="ui buttons">
                <PurgeButton />
                <ExportJsonToClipboardButton />
              </div>
              <div className="ui divider"></div>

              <div className="ui buttons">
                <PauseAllDownloadsButton />
                <CancelAllDownloadsButton />
              </div>
            </center>
          </div>
        </div>
      </Container>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(MainScreen);
