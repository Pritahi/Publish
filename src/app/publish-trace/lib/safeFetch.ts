const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB
const MAX_REDIRECTS = 5;

// Reserved/private ranges per RFC1918, RFC5735, RFC4193, RFC4291, RFC6598,
// plus IPv4-mapped IPv6 and link-local. We reject any host resolving to these.
const PRIVATE_IPV4_PREFIXES = [
  "0.",      // "this network"
  "10.",     // RFC1918
  "100.64.", // RFC6598 carrier-grade NAT
  "127.",    // loopback
  "169.254.",// link-local
  "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.",
  "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
  "172.30.", "172.31.", // RFC1918
  "192.0.0.", "192.0.2.", "192.88.99.", "192.168.", // RFC5735 / RFC1918 / anycast
  "198.18.", "198.19.", // RFC2544 benchmarking
  "224.", "225.", "226.", "227.", "228.", "229.", "230.", "231.", "232.", "233.",
  "234.", "235.", "236.", "237.", "238.", "239.", // multicast
  "240.", "241.", "242.", "243.", "244.", "245.", "246.", "247.", "248.", "249.",
  "250.", "251.", "252.", "253.", "254.", "255.", // reserved
];

const IPV6_REJECT_PREFIXES = [
  "::",          // unspecified / loopback (::1)
  "fc", "fd",    // unique local (fc00::/7)
  "fe8", "fe9", "fea", "feb", // link-local (fe80::/10)
  "ff",          // multicast (ff00::/8)
];

function isPrivateIpv4(host: string): boolean {
  return PRIVATE_IPV4_PREFIXES.some((p) => host.startsWith(p));
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  return IPV6_REJECT_PREFIXES.some((p) => h.startsWith(p));
}

function looksLikeIpAddress(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host);
}

export function isBlockedHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase();
  if (looksLikeIpAddress(h)) {
    if (h.includes(":")) return isPrivateIpv6(h);
    return isPrivateIpv4(h);
  }
  // Hostnames: block literal IP-in-host and any localhost/reserved names.
  if (h === "localhost" || h === "localhost.localdomain") return true;
  return false;
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxBytes?: number;
  followRedirects?: boolean;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export async function safeFetch(urlInput: string, opts: FetchOptions = {}): Promise<{
  ok: boolean;
  status: number;
  url: string;
  body: string;
  error?: string;
  redirected: boolean;
  finalUrl: string;
}> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? MAX_RESPONSE_BYTES;
  const followRedirects = opts.followRedirects ?? false;

  let url: URL;
  try {
    url = new URL(urlInput);
  } catch {
    return { ok: false, status: 0, url: urlInput, body: "", error: "invalid-url", redirected: false, finalUrl: urlInput };
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return { ok: false, status: 0, url: urlInput, body: "", error: "unsupported-protocol", redirected: false, finalUrl: urlInput };
  }

  const hostname = url.hostname;
  if (isBlockedHost(hostname)) {
    return { ok: false, status: 0, url: urlInput, body: "", error: "blocked-host", redirected: false, finalUrl: urlInput };
  }

  // Block credentials embedded in the URL.
  if (url.username || url.password) {
    return { ok: false, status: 0, url: urlInput, body: "", error: "url-credentials", redirected: false, finalUrl: urlInput };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let redirects = 0;
  let currentUrl = urlInput;
  let redirected = false;

  try {
    while (true) {
      const res = await fetch(currentUrl, {
        ...opts,
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
          "User-Agent": "PublishTrace/1.0 (+safe-read-only inspection)",
          ...(opts.headers || {}),
        },
      } as RequestInit);

      if (res.status >= 300 && res.status < 400 && res.headers.has("location")) {
        redirects += 1;
        redirected = true;
        if (redirects > MAX_REDIRECTS) {
          return { ok: false, status: res.status, url: urlInput, body: "", error: "too-many-redirects", redirected, finalUrl: currentUrl };
        }
        const location = res.headers.get("location")!;
        try {
          currentUrl = new URL(location, currentUrl).href;
        } catch {
          return { ok: false, status: res.status, url: urlInput, body: "", error: "invalid-redirect-location", redirected, finalUrl: currentUrl };
        }
        const nextHost = new URL(currentUrl).hostname;
        if (isBlockedHost(nextHost)) {
          return { ok: false, status: res.status, url: urlInput, body: "", error: "blocked-redirect-host", redirected, finalUrl: currentUrl };
        }
        // Never follow redirects back to a private/loopback host.
        continue;
      }

      // Read body with size cap.
      const reader = res.body?.getReader();
      if (!reader) {
        return { ok: res.ok, status: res.status, url: urlInput, body: "", error: undefined, redirected, finalUrl: currentUrl };
      }

      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            total += value.byteLength;
            if (total > maxBytes) {
              return { ok: false, status: res.status, url: urlInput, body: "", error: "response-too-large", redirected, finalUrl: currentUrl };
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const body = TEXT_DECODER.decode(Buffer.concat(chunks));
      return {
        ok: res.ok,
        status: res.status,
        url: urlInput,
        body,
        error: res.ok ? undefined : `http-${res.status}`,
        redirected,
        finalUrl: currentUrl,
      };
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 0, url: urlInput, body: "", error: "timeout", redirected, finalUrl: currentUrl };
    }
    return {
      ok: false,
      status: 0,
      url: urlInput,
      body: "",
      error: err instanceof Error ? err.message : "fetch-error",
      redirected,
      finalUrl: currentUrl,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
