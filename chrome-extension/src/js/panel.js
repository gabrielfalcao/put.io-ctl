chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (request.request && request.request.url) {
    if (/api2/.test(`${request.request.url}`)) {
      request.getContent((body) => {
        chrome.runtime.sendMessage({
          type: "PUT_IO_API_REQUEST",
          response: body,
          request,
        });
      });
    }
  }
});
