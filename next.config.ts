import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to dev-only assets by default
  // (security fix, not present in older Next.js) — without this, loading
  // the dev server from a phone via the computer's LAN IP renders the
  // initial HTML fine (a normal top-level navigation) but silently blocks
  // the client JS/RSC requests that follow, so nothing after the first
  // paint ever works. The trailing wildcard matches any device address on
  // this machine's current subnet, not just today's exact IP.
  allowedDevOrigins: ["192.168.2.*"],
};

export default nextConfig;
