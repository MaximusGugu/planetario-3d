const CACHE_CONSENT_KEY = "assetCacheConsent"
const CACHE_VERSION_KEY = "assetCacheVersion"
const CACHE_VERSION = "planetario-3d-v2"

const getBasePath = () => import.meta.env.BASE_URL || "/"

const resolveAssetUrl = (path) => `${getBasePath()}${path}`

const CACHE_WARMUP_ASSETS = [
    "textures/01 sun.webp",
    "textures/02 mercury.jpg",
    "textures/03venus.jpg",
    "textures/04moon.jpg",
    "textures/05mars.jpg",
    "textures/06jupiter.jpg",
    "textures/06jupiterInterior.png",
    "textures/06jupiterIo.jpg",
    "textures/06jupiterEuropa.jpg",
    "textures/06jupiterGanymede.jpg",
    "textures/06jupiterCalisto.jpg",
    "textures/06jupiterRings.png",
    "textures/07saturn.jpg",
    "textures/07saturnRings.png",
    "textures/08uranus.jpg",
    "textures/08uranosRings.png",
    "textures/09neptune.jpg",
    "textures/09neptuneRings.png",
    "textures/earth/earthDayTexture.jpg",
    "textures/earth/earthLightMap.png",
    "textures/earth/earthCloudMap.png",
    "textures/earth/earthSpecularMap.jpg",
    "textures/earth/earthBumpMap.jpg",
    "models/asteroids_pack_rocky_version.glb",
]

export const hasAssetCacheConsent = () =>
    localStorage.getItem(CACHE_CONSENT_KEY) === "accepted"

export const setAssetCacheConsent = (value) => {
    localStorage.setItem(CACHE_CONSENT_KEY, value ? "accepted" : "declined")
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
}

export const getAssetCacheConsent = () => {
    const stored = localStorage.getItem(CACHE_CONSENT_KEY)
    return stored === "accepted" || stored === "declined" ? stored : null
}

export const registerAssetServiceWorker = async () => {
    if (import.meta.env.DEV) {
        await unregisterAssetServiceWorkers()
        return null
    }

    if (!("serviceWorker" in navigator) || !hasAssetCacheConsent()) return null

    const basePath = getBasePath()
    const registration = await navigator.serviceWorker.register(
        `${basePath}sw.js`,
        { scope: basePath }
    )

    const worker =
        registration.active || registration.waiting || registration.installing

    worker?.postMessage({
        type: "WARM_ASSET_CACHE",
        version: CACHE_VERSION,
        assets: CACHE_WARMUP_ASSETS.map(resolveAssetUrl),
    })

    return registration
}

export const unregisterAssetServiceWorkers = async () => {
    if (!("serviceWorker" in navigator)) return

    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
        registrations
            .filter((registration) => registration.scope.includes(getBasePath()))
            .map((registration) => registration.unregister())
    )

    if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(
            keys
                .filter((key) => key.startsWith("planetario-3d"))
                .map((key) => caches.delete(key))
        )
    }
}
