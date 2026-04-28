import { useEffect, useState } from "react"
import SolarSystemRenderer from "./components/SolarSystemRenderer"
import EntryConsent from "./components/EntryConsent"
import {
  getAssetCacheConsent,
  registerAssetServiceWorker,
  setAssetCacheConsent,
  unregisterAssetServiceWorkers,
} from "./utils/serviceWorker"

export default function App() {
  const [cacheConsent, setCacheConsent] = useState(() => getAssetCacheConsent())

  useEffect(() => {
    if (import.meta.env.DEV) {
      unregisterAssetServiceWorkers().catch(() => {})
      return
    }

    if (cacheConsent === "accepted") {
      registerAssetServiceWorker().catch((error) => {
        console.warn("Falha ao registrar service worker:", error)
      })
    }
  }, [cacheConsent])

  const enterWithCache = () => {
    setAssetCacheConsent(true)
    setCacheConsent("accepted")
  }

  const enterWithoutCache = () => {
    setAssetCacheConsent(false)
    setCacheConsent("declined")
    unregisterAssetServiceWorkers().catch(() => {})
  }

  if (!cacheConsent) {
    return <EntryConsent onAccept={enterWithCache} onSkip={enterWithoutCache} />
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#000" }}>
      <SolarSystemRenderer />
    </div>
  )
}
