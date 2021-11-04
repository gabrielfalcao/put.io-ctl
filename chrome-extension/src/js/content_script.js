/* import React from "react";
 * import { render } from "react-dom"; */
import { ButlerStorage } from "putio/storage";
import { metadataFromMediaUrl } from "putio/urls";
import { ensureType } from "putio/kernel";
import { sendUrl, urlStream, waitForUrl } from "./messages";

const KNOWN_URLS = [];

const database = new ButlerStorage();
function main(url) {
  sendUrl({ url });
  console.log(
    `%c${href}`,
    "color:#222;background: #cfc;font-size:18px;font-family:Monaco"
  );
}
document.addEventListener("DOMNodeInserted", (event) => {
  const { target } = event;
  const { className, id } = target;
  const tag = `${target.nodeName}`;

  const href = target.getAttribute("href");
  switch (tag) {
    case "a":
      console.log(target);
      main(href);
      break;
    default:
      break;
  }
});
document
  .querySelectorAll(".download-link")
  .forEach((node) => main(node.getAttribute("href")));
