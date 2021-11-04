import queryString from "query-string";

export const EXTENSION_TO_MEDIA_TYPE = {
  mp4: "video",
  mkv: "video",
  mov: "video",
  mpeg: "video",
  wmv: "video",
  ts: "video",
  flv: "video",
  jpg: "photo",
  jpeg: "photo",
  png: "photo",
};

export const MEDIA_TYPE_TO_SEMANTIC_UI_ICON_NAME = {
  photo: "camera",
  video: "video",
};

export const metadataFromMediaUrl = (url, { dirname, ...kwargs } = {}) => {
  const location = new URL(`${url}`);
  const { pathname } = location;
  const path = location.pathname.split("/");
  const originalFilename = path[path.length - 1];
  const filename = [dirname, originalFilename].join("__");
  const name = originalFilename.split(".");
  const extension = name[name.length - 1];
  const mediaType = EXTENSION_TO_MEDIA_TYPE[extension.toLowerCase()] || "media";
  const iconName = MEDIA_TYPE_TO_SEMANTIC_UI_ICON_NAME[mediaType] || "question";

  const params = queryString.parse(location.search);
  return {
    url,
    filename,
    originalFilename,
    params,
    dirname,
    extension,
    pathname,
    iconName,
    mediaType,
    ...kwargs,
  };
};
