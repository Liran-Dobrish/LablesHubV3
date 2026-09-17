// Date and path formatting helpers — see plan.md Project Structure.

export function formatCreatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Returns the last non-empty segment of a server path, e.g. "$/Proj/Foo/Bar" -> "Bar". */
export function leafSegment(path: string): string {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : path;
}

/** Returns the parent path of a server path, or null if it has no parent segment. */
export function parentPath(path: string): string | null {
  const trimmed = path.replace(/\/+$/, '');
  const lastSlash = trimmed.lastIndexOf('/');
  if (lastSlash <= 0) {
    return null;
  }
  return trimmed.slice(0, lastSlash);
}
