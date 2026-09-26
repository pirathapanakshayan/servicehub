/**
 * The one italic serif word allowed inside a big heading, e.g.
 * <h1>Book trusted services in <SerifAccent>minutes</SerifAccent></h1>.
 */
export function SerifAccent({ children }: { children: React.ReactNode }) {
  return <em className="font-serif font-normal tracking-normal italic">{children}</em>;
}
