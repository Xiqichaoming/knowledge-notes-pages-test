export const SITE_BASE = "/knowledge-notes/";

export const sitePath = (path = "") => `${SITE_BASE}${path}`.replace(/([^:]\/)\/+/g, "$1");
