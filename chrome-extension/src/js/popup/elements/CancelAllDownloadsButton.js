import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";

import { getAllPutIODownloads } from "putio/downloads";

class CancelAllDownloadsButton extends React.Component {
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
    const query = { urlRegex: ".*putio.*" };
    if (
      !confirm(
        "Sure to cancel ALL downloads from putio ?",
        "Cancel PutIO Downloads"
      )
    ) {
      return;
    }
    getAllPutIODownloads(({ all }) => {
      for (const item of all) {
        chrome.downloads.cancel(item.id, () => {
          console.log(`canceling download ${item.url}`);
        });
      }
    });
  };
  render() {
    const { handleClick } = this;
    const { downloads } = this.props;
    const resumable = (downloads && downloads.resumable) || [];
    return (
      <button className="ui red button" onClick={handleClick}>
        Cancel all downloads
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(CancelAllDownloadsButton);
