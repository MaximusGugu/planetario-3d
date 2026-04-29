const VERSION = "planetario-3d-v2"
const CACHE_PREFIX = "planetario-3d"
const ASSET_CACHE = `${VERSION}-assets`
const BUILD_CACHE = `${VERSION}-build`

const isAssetRequest = (url) =>
    url.pathname.includes("/textures/") ||
    url.pathname.includes("/models/") ||
    /\.(png|jpe?g|webp|gif|svg|glb|gltf|ktx2|woff2?|ttf|otf)$/i.test(
        url.pathname
    )

const isBuildRequest = (url) =>
    url.pathname.includes("/assets/") ||
    /\.(js|css)$/i.test(url.pathname) ||
    url.pathname.endsWith("/")

const putInCache = async (cacheName, request, response) => {
    if (!response || response.status !== 200 || response.type === "opaque") {
        return
    }

    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
}

const cacheFirst = async (request) => {
    const cached = await caches.match(request)
    if (cached) return cached

    const response = await fetch(request)
    await putInCache(ASSET_CACHE, request, response)
    return response
}

const staleWhileRevalidate = async (request) => {
    const cached = await caches.match(request)
    const refresh = fetch(request)
        .then(async (response) => {
            await putInCache(BUILD_CACHE, request, response)
            return response
        })
        .catch(() => cached)

    return cached || refresh
}

self.addEventListener("install", () => {
    self.skipWaiting()
})

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith(CACHE_PREFIX) &&
                                !key.startsWith(VERSION)
                        )
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    )
})

self.addEventListener("message", (event) => {
    if (event.data?.type !== "WARM_ASSET_CACHE") return

    const assets = Array.isArray(event.data.assets) ? event.data.assets : []
    event.waitUntil(
        caches.open(ASSET_CACHE).then((cache) =>
            Promise.allSettled(
                assets.map((asset) => cache.add(new Request(asset)))
            )
        )
    )
})

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return

    const url = new URL(event.request.url)
    if (url.origin !== self.location.origin) return

    if (isAssetRequest(url)) {
        event.respondWith(cacheFirst(event.request))
        return
    }

    if (isBuildRequest(url)) {
        event.respondWith(staleWhileRevalidate(event.request))
    }
})
