/** Link for a tab: keeps the current filters, sets (or clears) `key`, and resets paging. */
export function tabHref(
  basePath: string,
  params: Record<string, string>,
  key: string,
  value?: string,
) {
  const next = new URLSearchParams(params);
  next.delete("page");
  if (value) next.set(key, value);
  else next.delete(key);
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
