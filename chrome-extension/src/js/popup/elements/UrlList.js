import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { metadataFromMediaUrl } from "putio/urls";
import { actions, actionPropTypes } from "putio/reducers";

class UrlList extends React.Component {
  constructor(props) {
    super(props);
    this.debug = this.debug.bind(this);
  }
  debug() {
    const { urls, butler, downloads } = this.props;
    console.log(
      `%cURLLIST SUCCESSFUL`,
      "color:#fff;background: #88f;font-size:20px;",
      urls
    );
  }
  render() {
    const { urls, butler, downloads } = this.props;
    const { by_id } = downloads || {};

    const usernames = Array.from(
      new Set(urls.filter((url) => url.username).map((url) => url.username))
    );
    const by_username = {};
    for (const name of usernames) {
      by_username[name] = urls.filter((url) => url.username === name);
    }

    return urls.length > 0 ? (
      <div
        className="ui relaxed divided list"
        style={{ overflowY: "auto", maxHeight: "150px" }}
      >
        {Object.entries(by_username).map(([username, urlsFromUser]) => {
          const videos = urlsFromUser.filter(
            (item) => item.mediaType && item.mediaType === "video"
          );
          const photos = urlsFromUser.filter(
            (item) => item.mediaType && item.mediaType === "photo"
          );

          return (
            <div key={username} className="item">
              <div className="content">
                <a className="header">{`${username} (${urlsFromUser.length})`}</a>
                <div className="description">
                  {` ${videos.length} videos and ${photos.length} photos = ${
                    photos.length + videos.length
                  }`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : null;
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(UrlList);
