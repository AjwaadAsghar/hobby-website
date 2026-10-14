/**
 * Soft entrance between storefront pages. Pure CSS (no JavaScript) so it never
 * delays the first paint; disabled automatically for reduced motion.
 */
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
