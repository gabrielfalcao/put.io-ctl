import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";
import { getAllPutIODownloads } from "putio/downloads";

class ResumeDownloadsButton extends React.Component {
  static propTypes = {
    ...actionPropTypes,
    onClick: PropTypes.func,
  };
  constructor(props) {
    super(props);
  }

  handleClick = (e) => {
    e.preventDefault();
    const { onClick, purgeData } = this.props;
    if (
      !confirm(
        "Sure to resume ALL downloads from putio ?",
        "Resume PutIO Downloads"
      )
    ) {
      return;
    }

    getAllPutIODownloads(({ all }) => {
      for (const item of all) {
        if (item.canResume) {
          console.log(`resuming download of ${item.url}`);
          chrome.downloads.resume(item.id, () => {
            console.log(`resumed download of ${item.url}`);
          });
        }
      }
      if (onClick) {
        onClick(event);
      }
    });
  };
  render() {
    const { handleClick } = this;
    const { downloads } = this.props;
    const resumable = (downloads && downloads.resumable) || [];
    return (
      <button className="ui green button" onClick={handleClick}>
        Resume all Downloads
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(ResumeDownloadsButton);
