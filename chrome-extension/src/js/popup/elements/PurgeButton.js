import React from "react";
import PropTypes from "prop-types";
import { ButlerStorage } from "putio/storage";

import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";

class PurgeButton extends React.Component {
  static propTypes = {
    ...actionPropTypes,
    onClick: PropTypes.func,
  };
  constructor(props) {
    super(props);
    this.storage = new ButlerStorage();
  }
  handleClick = (event) => {
    const { onClick, purgeData } = this.props;
    console.log(
      `%c:PURGED CLICKED`,
      "color:#fff;background: #666;font-size:10px;"
    );
    purgeData();
    this.storage.purgeUrls(() => {
      console.log(
        `%c:PURGE SUCCESSFUL`,
        "color:#fff;background: #444;font-size:10px;"
      );

      if (onClick) {
        onClick(event);
      } else {
        event.preventDefault();
      }
    });
  };
  render() {
    const { handleClick } = this;
    return (
      <button className="ui pink button" onClick={handleClick}>
        Purge Local Storage
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(PurgeButton);
