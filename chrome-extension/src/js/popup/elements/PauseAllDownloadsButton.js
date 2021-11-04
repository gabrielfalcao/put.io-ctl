import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";

import { getAllPutIODownloads } from "putio/downloads";

class PauseAllDownloadsButton extends React.Component {
  static propTypes = {
    downloads: PropTypes.shape({
      all: PropTypes.array,
      by_id: PropTypes.object,
    }),
  };
  constructor(props) {
    super(props);
  }

  handleClick = (e) => {
    e.preventDefault();
    if (
      !confirm(
        "Sure to pause ALL downloads from putio ?",
        "Pause PutIO Downloads"
      )
    ) {
      return;
    }

    const query = { urlRegex: ".*putio.*" };
    getAllPutIODownloads(({ all }) => {
      for (const item of all) {
        console.log(`pausing download ${item.url}`);
        chrome.downloads.pause(item.id, () => {
          console.log(`paused download ${item.url}`);
        });
      }
    });
  };
  render() {
    const { handleClick } = this;
    const { downloads } = this.props;
    const resumable = (downloads && downloads.resumable) || [];
    return (
      <button className="ui teal button" onClick={handleClick}>
        Pause all downloads
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(PauseAllDownloadsButton);
