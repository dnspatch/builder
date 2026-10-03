export type RequestKind = "provider" | "retriever" | "notifier";

/** What the "my service is missing" form collects. */
export interface PluginRequest {
  service: string;
  apiDocs: string;
  why: string;
  /** The last field of the form: how the API authenticates, or what a retriever answers with. */
  extra: string;
}

const newIssue = "https://github.com/dnspatch/dnspatch/issues/new";

/** Id of the form's last field in .github/ISSUE_TEMPLATE/<kind>_request.yml. */
const extraField: Record<RequestKind, string> = {
  provider: "auth",
  retriever: "details",
  notifier: "auth",
};

const titlePrefix: Record<RequestKind, string> = {
  provider: "Provider request",
  retriever: "Retriever request",
  notifier: "Notifier request",
};

/**
 * A link that opens dnspatch's "new <kind> request" issue form with the answers
 * filled in. The page has no token and sends nothing itself: the person reads
 * the result on GitHub and presses "Submit" there. Only text fields can be
 * filled this way (GitHub ignores dropdowns and checkboxes), so the forms have
 * none. Query keys are the field ids of the form.
 */
export function pluginRequestUrl(kind: RequestKind, r: PluginRequest): string {
  const service = r.service.trim();
  const params = new URLSearchParams({
    template: `${kind}_request.yml`,
    title: `${titlePrefix[kind]}: ${service}`,
    service,
    "api-docs": r.apiDocs.trim(),
    why: r.why.trim(),
  });
  const extra = r.extra.trim();
  if (extra) params.set(extraField[kind], extra);
  return `${newIssue}?${params}`;
}
