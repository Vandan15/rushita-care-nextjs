"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Sparkles } from "lucide-react"

// The build this bundle was compiled from (see next.config.mjs)
const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown"

const POLL_INTERVAL_MS = 2 * 60 * 1000 // re-check every 2 minutes
const SNOOZE_MS = 15 * 60 * 1000 // "Later" hides the prompt for 15 minutes
const CACHE_BUST_PARAM = "_updated"
const REFRESH_GUARD_KEY = "rushitacare:refreshed-for-build"

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const snoozedUntil = useRef<number>(0)
  const latestBuildId = useRef<string | null>(null)

  const checkForUpdate = useCallback(async () => {
    // Nothing to compare against if the build id was never injected (e.g. dev server)
    if (CURRENT_BUILD_ID === "unknown") return
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return

    try {
      const res = await fetch("/api/version", { cache: "no-store" })
      if (!res.ok) return

      const data: { buildId?: string } = await res.json()
      if (!data.buildId || data.buildId === "unknown") return
      if (data.buildId === CURRENT_BUILD_ID) return
      if (Date.now() < snoozedUntil.current) return

      // If we already forced a refresh for this exact build and the bundle STILL
      // reports the old id, something upstream is serving stale HTML. Prompting
      // again would just spin the user through an endless refresh loop.
      try {
        if (sessionStorage.getItem(REFRESH_GUARD_KEY) === data.buildId) return
      } catch {
        // sessionStorage can throw in private mode — fall through and prompt
      }

      latestBuildId.current = data.buildId
      setUpdateAvailable(true)
    } catch {
      // Offline or the deployment is mid-swap — try again on the next tick
    }
  }, [])

  useEffect(() => {
    // A forced refresh lands here with a cache-busting param; tidy it out of the
    // address bar so the URL stays clean (and the PWA start_url still matches).
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has(CACHE_BUST_PARAM)) {
        url.searchParams.delete(CACHE_BUST_PARAM)
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
      }
    } catch {
      // Non-fatal
    }

    checkForUpdate()

    const interval = setInterval(checkForUpdate, POLL_INTERVAL_MS)

    // Coming back to a backgrounded tab / reopening the PWA is the most
    // common moment for a user to be sitting on a stale bundle.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("online", checkForUpdate)
    window.addEventListener("focus", checkForUpdate)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("online", checkForUpdate)
      window.removeEventListener("focus", checkForUpdate)
    }
  }, [checkForUpdate])

  const handleRefresh = async () => {
    setRefreshing(true)

    // Remember which build we're refreshing for, so a failed refresh can't loop.
    try {
      if (latestBuildId.current) sessionStorage.setItem(REFRESH_GUARD_KEY, latestBuildId.current)
    } catch {
      // Ignore — the guard is a nicety, not a requirement
    }

    try {
      // Drop anything a cache layer is holding on to before navigating.
      if (typeof caches !== "undefined") {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      }
    } catch (error) {
      console.error("Error clearing caches before refresh:", error)
    }

    // A unique URL guarantees a fresh document even when location.reload() would
    // be served from the HTTP cache (notably inside an installed PWA on iOS).
    // replace() keeps it out of the back-history.
    try {
      const url = new URL(window.location.href)
      url.searchParams.set(CACHE_BUST_PARAM, Date.now().toString(36))
      window.location.replace(url.toString())
    } catch {
      window.location.reload()
    }
  }

  const handleSnooze = () => {
    snoozedUntil.current = Date.now() + SNOOZE_MS
    setUpdateAvailable(false)
  }

  return (
    <Dialog open={updateAvailable} onOpenChange={(open) => !open && handleSnooze()}>
      <DialogContent
        // bg-white is required: this app's --background token is a hex value behind
        // an hsl() wrapper, so `bg-background` compiles to invalid CSS and the panel
        // would render fully transparent. Every dialog here sets it explicitly.
        className="bg-white border-slate-200 rounded-2xl w-[calc(100%-2rem)] max-w-sm p-6 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-200/60">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-800">
            New updates available
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-slate-500 leading-relaxed">
            A newer version of RushitaCare is ready. Refresh to get the latest features and fixes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-md disabled:opacity-100"
          >
            {refreshing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Now
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSnooze}
            disabled={refreshing}
            className="w-full h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
