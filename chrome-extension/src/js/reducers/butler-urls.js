const NewState = () => ({
  by_url: {},
  all: [],
  loaded: true,
});

export const butler = (state = null, action = {}) => {
  const currentState = state || NewState();
  const all = currentState.all || [];
  const by_url = currentState.by_url || {};
  const { type, ...payload } = action;
  const current =
    by_url && payload.url ? by_url[payload.url] || { url: payload.url } : {};

  switch (action.type) {
    case "LOGOUT":
    case "PURGE_DATA":
      return NewState();

    case "SET_URLS":
      for (const item of action.urls || []) {
        if (item.url) {
          by_url[item.url] = { ...current, ...item };
        }
        if (item.finalUrl) {
          by_url[item.finalUrl] = { ...current, ...item };
        }
      }
      return {
        ...state,
        by_url,
        all: Object.values(by_url),
      };
    case "ADD_URL":
      console.log("ADD_URL", action);
      if (payload.url) {
        by_url[payload.url] = { ...current, ...payload };
      }
      if (payload.finalUrl) {
        by_url[payload.finalUrl] = { ...current, ...payload };
      }

      return {
        ...state,
        by_url,
        all: Object.values(by_url),
      };

    case "DELETE_URL":
      if (payload.url) {
        delete by_url[payload.url];
      }
      if (payload.finalUrl) {
        delete by_url[payload.finalUrl];
      }

      return {
        ...state,
        by_url,
        all: Object.values(by_url),
      };

    default:
      return { ...state };
  }
};

export default butler;
