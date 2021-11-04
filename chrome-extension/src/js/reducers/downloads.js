const NewState = () => ({
  by_id: {},
  by_url: {},
  all: [],
  resumable: [],
  loaded: true,
});

export const downloads = (state = NewState(), action = {}) => {
  const cState = state || NewState();
  const all = cState.all || [];
  const by_id = cState.by_id || {};
  const by_url = cState.by_url || {};
  const resumable =
    by_id && Object.values(by_id).filter((item) => item.canResume);

  const { type, ...payload } = action;
  const OldState = () => ({
    all: all || [],
    by_id: by_id || {},
    by_url: by_url || {},
    resumable: resumable || [],
  });

  const current =
    by_id && payload.id ? by_id[payload.id] || { id: payload.id } : {};
  switch (type) {
    case "LOGOUT":
    case "PURGE_DOWNLOADS":
    case "PURGE_DATA":
      return NewState();

    case "SET_DOWNLOADS":
      if (!payload.downloads) {
        return OldState();
      }
      for (const meta of payload.downloads) {
        if (meta.id) {
          by_id[meta.id] = { ...current, ...meta };
        }
        if (meta.url) {
          by_url[meta.url] = { ...current, ...meta };
        }
        if (meta.finalUrl) {
          by_url[meta.finalUrl] = { ...current, ...meta };
        }
      }
      return {
        all: Array.from(new Set([...all, ...(payload.downloads || [])])),
        resumable: Array.from(
          new Set([...all, ...(payload.downloads || [])])
        ).filter((item) => item.canResume),
      };
    case "ADD_DOWNLOAD":
      if (!/.*putio.*/.exec(`${payload.url}{payload.finalUrl}`)) {
        return OldState();
      }
      if (by_id && payload.id) {
        by_id[payload.id] = { ...current, ...payload };
      }
      if (payload.url) {
        by_url[payload.url] = { ...current, ...payload };
      }
      if (payload.finalUrl) {
        by_url[payload.finalUrl] = { ...current, ...payload };
      }

      return {
        ...state,
        by_id,
        by_url,
        all: Object.values(by_id),
        resumable: Object.values(by_id).filter((item) => item.canResume),
      };

    case "DELETE_DOWNLOAD":
      /* if (!payload.id) {
       *   return {
       *     ...state,
       *     by_id,
       *     all: Object.values(by_id),
       *     resumable: Object.values(by_id).filter((item) => item.canResume),
       *   };
       * }
       * by_id[payload.id] = {
       *   ...current,
       *   ...payload,
       *   state: payload.state || current.state,
       * };
       * return {
       *   ...state,
       *   all: Object.values(by_id),
       *   resumable: Object.values(by_id).filter((item) => item.canResume),
       * };
       */
      break;
    default:
      return { ...state };
  }
};

export default downloads;
