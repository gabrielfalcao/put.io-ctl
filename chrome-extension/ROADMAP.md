# ROADMAP

- Forbid calling storage from popup or content-script, move storage to background.js via message passing
  - Implement in-memory queue and persist every time the queue size % 5 === 0 or queue size < 5

Popup:

- Show total bytes remaining to download

- Remove urls from storage after they have been downloaded.


# Things that did not work


- Capture requests to API instead of requiring manual navigation
  - Examples:
    - https://app.put.io/api2/v2/users/4942921/posts/videos?limit=10&order=publish_date_desc&skip_users=all&skip_users_dups=1&beforePublishTime=1579279763.000000&app-token=33d57ade8c02dbc5a333db99ff9ae26a
    - https://app.put.io/api2/v2/users/5275277/posts/photos?limit=10&order=publish_date_desc&skip_users=all&skip_users_dups=1&beforePublishTime=1594913887.000000&app-token=33d57ade8c02dbc5a333db99ff9ae26a
