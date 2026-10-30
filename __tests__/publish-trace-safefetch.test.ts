import { describe, it, expect } from "bun:test";
import { isBlockedHost } from "@/app/publish-trace/lib/safeFetch";

describe("safeFetch host blocking", () => {
  it("blocks private IPv4", () => {
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("10.0.0.1")).toBe(true);
    expect(isBlockedHost("192.168.1.1")).toBe(true);
    expect(isBlockedHost("172.16.0.1")).toBe(true);
    expect(isBlockedHost("169.254.169.254")).toBe(true);
  });
  it("blocks loopback hostname", () => {
    expect(isBlockedHost("localhost")).toBe(true);
  });
  it("blocks IPv6 link-local, unique-local, multicast", () => {
    expect(isBlockedHost("fe80::1")).toBe(true);
    expect(isBlockedHost("fc00::1")).toBe(true);
    expect(isBlockedHost("ff02::1")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
  });
  it("allows public hostname", () => {
    expect(isBlockedHost("example.com")).toBe(false);
  });
});
