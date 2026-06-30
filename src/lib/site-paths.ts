export const SITE_BASE = "/knowledge-notes-pages-test/";

export const sitePath = (path = "") => `${SITE_BASE}${path}`.replace(/([^:]\/)\/+/g, "$1");
