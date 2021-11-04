import React from "react";
import { connect } from "react-redux";
import { actions, actionPropTypes } from "putio/reducers";
import { clipboard } from "@extend-chrome/clipboard";

const DEFAULT_LABEL = "Export JSON to Clipboard";
const COPYING_LABEL = "Copying ...";

class ExportJsonToClipboardButton extends React.Component {
  static propTypes = {
    ...actionPropTypes,
  };
  constructor(props) {
    super(props);
    this.state = {
      label: DEFAULT_LABEL,
    };
  }

  handleClick = (e) => {
    const { butler, downloads } = this.props;
    const data = { butler, downloads };
    const jsonString = JSON.stringify(data, null, 2);
    // Write text to the clipboard, or "copy"

    clipboard.writeText(jsonString).then((text) => {
      alert("Redux state exported to clipboard as JSON ✅");
      console.log(
        `%cRedux state %cCopied to clipboard`,
        "color: white;background-color:#373;font-size:12px;font-family:Monaco",
        "color: white;background-color:#337;font-size:12px;font-family:Monaco",
        data
      );
    });
  };
  render() {
    const { handleClick } = this;
    return (
      <button className="ui inverted violet button" onClick={handleClick}>
        {DEFAULT_LABEL}
      </button>
    );
  }
}

export default connect((state) => {
  return { ...state };
}, actions)(ExportJsonToClipboardButton);
