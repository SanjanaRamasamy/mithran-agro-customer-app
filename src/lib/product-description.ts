import DOMPurify from "isomorphic-dompurify";

const DESCRIPTION_TAGS = [
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "ul",
];

const METADATA_CLASS_PREFIXES = [
  "citation-",
  "model-response-message-content",
  "source-inline-chip-container",
  "source-label",
];

function isMetadataElement(element: Element): boolean {
  return Array.from(element.classList).some((className) =>
    METADATA_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix)),
  );
}

function unwrap(element: Element): void {
  element.replaceWith(...Array.from(element.childNodes));
}

function escapeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function sanitizeProductDescription(description?: string | null): string {
  if (!description?.trim()) return "";

  if (!/<\/?[a-z][^>]*>/i.test(description)) {
    return escapeText(description);
  }

  const fragment = DOMPurify.sanitize(description, {
    ALLOWED_TAGS: [...DESCRIPTION_TAGS, "sup"],
    ALLOWED_ATTR: ["class"],
    RETURN_DOM_FRAGMENT: true,
  });

  for (const element of Array.from(fragment.querySelectorAll("*"))) {
    if (!isMetadataElement(element) || !element.parentNode) continue;

    const classes = Array.from(element.classList);
    const isSourceMetadata = classes.some((className) =>
      className.startsWith("source-inline-chip-container")
      || className.startsWith("source-label"),
    );
    if (isSourceMetadata) {
      element.remove();
      continue;
    }

    const isCitation = classes.some((className) => className.startsWith("citation-"));
    const citationText = element.textContent?.trim() ?? "";
    if (isCitation && (element.tagName === "SUP" || /^[\d\s,[\].;:()]+$/.test(citationText))) {
      element.remove();
      continue;
    }

    unwrap(element);
  }

  return DOMPurify.sanitize(fragment, {
    ALLOWED_TAGS: DESCRIPTION_TAGS,
    ALLOWED_ATTR: [],
  });
}
