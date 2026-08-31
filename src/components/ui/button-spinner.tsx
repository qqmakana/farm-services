/** White spinner that replaces button label while submitting. Keeps button size. */
export function ButtonSpinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`vr-spin inline-block shrink-0 ${dark ? "vr-spin-dark" : ""}`}
      aria-hidden
    />
  );
}
