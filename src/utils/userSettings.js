export const USER_SETTINGS_KEY = "planetario:user-settings:v1"

const isObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value)

const clampNumber = (value, fallback, min = -Infinity, max = Infinity) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback
    return Math.min(max, Math.max(min, number))
}

const sanitizeValue = (key, value, fallback) => {
    if (key === "hideUI") return fallback
    if (typeof fallback === "boolean") return Boolean(value)
    if (typeof fallback === "number") {
        const ranges = {
            zoomSensitivity: [0.25, 3],
            rotationSensitivity: [0.25, 3],
            freeFlightSpeed: [0.2, 4],
            satelliteSpeed: [0, 3],
            rotateSpeed: [0, 3],
            orbitSpeed: [0, 3],
            systemScale: [0, 1],
            shadowIntensity: [0, 1],
            sunIntensity: [0, 4],
            bloomStrength: [0, 3],
            bloomRadius: [0, 2],
            bloomThreshold: [0, 1],
            ambientIntensity: [0, 1],
        }
        const [min, max] = ranges[key] || [-Infinity, Infinity]
        return clampNumber(value, fallback, min, max)
    }
    if (key === "displayMode") {
        return ["quality", "balanced", "performance"].includes(value)
            ? value
            : fallback
    }
    return value ?? fallback
}

export const sanitizeUserSettings = (settings, defaults) => {
    const source = isObject(settings) ? settings : {}
    return Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => [
            key,
            sanitizeValue(key, source[key], fallback),
        ])
    )
}

export const getUserSettings = (defaults) => {
    if (typeof window === "undefined") return defaults

    try {
        const stored = window.localStorage.getItem(USER_SETTINGS_KEY)
        if (!stored) return defaults
        return sanitizeUserSettings(JSON.parse(stored), defaults)
    } catch {
        return defaults
    }
}

export const saveUserSettings = (settings) => {
    if (typeof window === "undefined") return

    try {
        const { hideUI, ...persistentSettings } = settings
        window.localStorage.setItem(
            USER_SETTINGS_KEY,
            JSON.stringify(persistentSettings)
        )
    } catch {
        // Ignore storage failures so the renderer keeps working in private modes.
    }
}
