import { getMessage } from "@extend-chrome/messages";
export const [sendUrl, urlStream, waitForUrl] = getMessage(
  // String to be used as a greeting
  "URL"
);
