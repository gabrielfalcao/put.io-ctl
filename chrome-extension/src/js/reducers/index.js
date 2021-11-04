import PropTypes from "prop-types";
import { combineReducers } from "redux";
import { compose } from "redux";
/* import { connectRouter } from "connected-react-router";
 *  */
import { butler } from "putio/reducers/butler-urls";
import { downloads } from "putio/reducers/downloads";

const DEFAULT_STATE = {};

export const mainReducer = (state = DEFAULT_STATE, action = {}) => {
  switch (action.type) {
    case "ADD_ERROR":
      console.log(`ADD_ERROR ${action.error}`, action);
      return { ...state, errors: JSON.stringify(action.error) };
    default:
      return { ...state };
  }
};
export const actionPropTypes = {
  butler: PropTypes.shape({
    all: PropTypes.array,
    by_url: PropTypes.object,
  }),
  downloads: PropTypes.shape({
    all: PropTypes.array,
    by_url: PropTypes.object,
    by_id: PropTypes.object,
  }),
  addUrl: PropTypes.func,
  setUrls: PropTypes.func,
  deleteUrl: PropTypes.func,
  setDownloads: PropTypes.func,
  addDownload: PropTypes.func,
  deleteDownload: PropTypes.func,
  addError: PropTypes.func,
};
export const actions = {
  addUrl: ({ ...url }) => {
    return {
      type: "ADD_URL",
      ...url,
    };
  },

  setUrls: ({ urls }) => {
    return {
      type: "SET_URLS",
      urls,
    };
  },
  setDownloads: ({ ...downloads }) => {
    return {
      type: "SET_DOWNLOADS",
      ...downloads,
    };
  },
  addDownload: ({ ...download }) => {
    return {
      type: "ADD_DOWNLOAD",
      ...download,
    };
  },
  deleteDownload: ({ ...download }) => {
    return {
      type: "DELETE_DOWNLOAD",
      ...download,
    };
  },
  deleteUrl: ({ ...url }) => {
    return {
      type: "DELETE_URL",
      ...url,
    };
  },
  addError: (error) => {
    console.log(
      `%cReducer captured an error: %c${error}`,
      "color: red",
      "color:blue",
      error
    );

    return {
      type: "ADD_ERROR",
      error,
    };
  },
  purgeData: () => {
    return {
      type: "PURGE_DATA",
    };
  },
};

export default compose(
  mainReducer,
  combineReducers({
    butler,
    downloads,
    /* router: connectRouter(history), */
  })
);
