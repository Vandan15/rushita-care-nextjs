"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Sparkles } from "lucide-react"

// The build this bundle was compiled from (see next.config.mjs)
const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown"

const POLL_INTERVAL_MS = 2 * 60 * 1000 // re-check every 2 minutes
const SNOOZE_MS = 15 * 60 * 1000 // "Later" hides the prompt for 15 minutes

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const snoozedUntil = useRef<number>(0)

  const checkForUpdate = useCallback(async () => {
    // Nothing to compare against if the build id was never injected (e.g. dev server)
    if (CURRENT_BUILD_ID === "unknown") return
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return

    try {
      const res = await fetch("/api/version", { cache: "no-store" })
      if (!res.ok) return

      const data: { buildId?: string } = await res.json()
      if (!data.buildId || data.buildId === "unknown") return

      if (data.buildId !== CURRENT_BUILD_ID && Date.now() >= snoozedUntil.current) {
        setUpdateAvailable(true)
      }
    } catch {
      // Offline or the deployment is mid-swap — try again on the next tick
    }
  }, [])

  useEffect(() => {
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
    try {
      // Best-effort hard refresh: drop anything a cache layer is holding on to
      // before reloading, so the browser fetches the new HTML + assets.
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
    } finally {
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
        className="sm:max-w-md"
        // Force a deliberate choice — dismissing by accident leaves the user on a stale app
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-lg">New updates available</DialogTitle>
          <DialogDescription className="text-center">
            A newer version of RushitaCare has been released. Please refresh to get the latest features and fixes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
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
          <Button variant="ghost" onClick={handleSnooze} disabled={refreshing} className="w-full text-slate-500">
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
