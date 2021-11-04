import MainScreen from "putio/popup/screens/main";
import { Provider } from "react-redux";

import React from "react";
import { render } from "react-dom";
import { createStore } from "redux";
import rootReducer from "putio/reducers";

const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <MainScreen />
  </Provider>,
  window.document.getElementById("app-container")
);
