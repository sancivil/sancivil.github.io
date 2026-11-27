/** The company's logo on the printed report: the owner's own logo file (black letters, for white paper). */
export function Wordmark() {
  return (
    <img
      class="dz-wordmark"
      src="/brand/faraday-logo-1200.png"
      srcset="/brand/faraday-logo-1200.png 1200w, /brand/faraday-logo-2400.png 2400w"
      sizes="46mm"
      width={1200}
      height={311}
      alt="Faraday"
      dir="ltr"
    />
  );
}
