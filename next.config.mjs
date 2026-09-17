import { execSync } from "node:child_process"

/**
 * A stable identifier for the currently deployed code.
 *
 * This value is inlined into BOTH the client bundle and the /api/version route at
 * build time, which is what makes stale-tab detection work: a browser still running
 * an old bundle holds the old id, while /api/version (served by the new deployment)
 * reports the new one. See components/update-notifier.tsx.
 *
 * IMPORTANT: it MUST be derived from repo state, never from Date.now(). Next.js
 * evaluates this config once per compiler pass (client and server are separate
 * processes), so a timestamp produces a different id in each bundle and every user
 * would see the "update available" modal immediately after a deploy.
 */
function resolveBuildId() {
  // Vercel exposes the commit SHA at build time on every deployment.
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)
  }
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
      .slice(0, 12)
  } catch {
    // No git and no Vercel env: degrade to a constant so client and server always
    // agree. Update detection is disabled rather than firing false positives.
    return "dev"
  }
}

const buildId = resolveBuildId()

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
}

export default nextConfig
