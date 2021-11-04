import React from "react";
import icon from "img/icon-128.png";

export const Logo = ({ showText }) => (
  <div className="ui container" style={{ margin: "20px 0px" }}>
    <h2 className="ui header">
      <img
        className="ui avatar image"
        height={showText ? "64" : "32"}
        width={showText ? "64" : "32"}
        src={icon}
        style={{ margin: "0px 0px 8px 0px" }}
      />
      <div className="content">put.io extension</div>
      {showText ? (
        <div className="sub header">
          Go to an put.io profile page and click on photos and/or videos to
          add them here.
        </div>
      ) : null}
    </h2>
  </div>
);
export default Logo;
