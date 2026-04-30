const SOUND_URLS = {
    accordion: new URL("../../sounds/accordionItem.mp3", import.meta.url).href,
    afterLoading: new URL("../../sounds/afterLoadingSound.mp3", import.meta.url)
        .href,
    back: new URL("../../sounds/backButton.mp3", import.meta.url).href,
    config: new URL("../../sounds/configOption.mp3", import.meta.url).href,
    objectHover: new URL("../../sounds/meuItemHovers.mp3", import.meta.url)
        .href,
    click: new URL("../../sounds/otherMenuItems.mp3", import.meta.url).href,
    travel: new URL("../../sounds/travelToObject.mp3", import.meta.url).href,
}

const BACKGROUND_TRACKS = [
    new URL("../../sounds/bgMusic/bgMusic01.mp3", import.meta.url).href,
    new URL("../../sounds/bgMusic/bgMusic02.mp3", import.meta.url).href,
    new URL("../../sounds/bgMusic/bgMusic03.mp3", import.meta.url).href,
    new URL("../../sounds/bgMusic/bgMusic04.mp3", import.meta.url).href,
]

const DEFAULT_VOLUME = {
    accordion: 0.42,
    afterLoading: 0.5,
    back: 0.46,
    config: 0.38,
    objectHover: 0.28,
    click: 0.42,
    travel: 0.55,
}

const DEFAULT_MUSIC_VOLUME = 0.4

export const createInteractionSoundController = () => {
    const pools = new Map()
    const queuedSounds = []
    let unlocked = false
    let lastHoverElement = null
    let lastHoverAt = 0
    let musicVolume = DEFAULT_MUSIC_VOLUME
    let backgroundTrackIndex = 0
    let backgroundAudio = null
    let backgroundMusicStarted = false

    const getPool = (name) => {
        if (!SOUND_URLS[name]) return null
        if (pools.has(name)) return pools.get(name)

        const pool = Array.from({ length: 3 }, () => {
            const audio = new Audio(SOUND_URLS[name])
            audio.preload = "auto"
            audio.volume = DEFAULT_VOLUME[name] ?? 0.4
            return audio
        })

        pools.set(name, { index: 0, pool })
        return pools.get(name)
    }

    const play = (name, options = {}) => {
        if (!unlocked && !options.allowBeforeUnlock) {
            if (options.queueUntilUnlock) {
                queuedSounds.push([name, options])
            }
            return
        }

        const entry = getPool(name)
        if (!entry) return

        const audio = entry.pool[entry.index]
        entry.index = (entry.index + 1) % entry.pool.length

        audio.pause()
        audio.currentTime = 0
        audio.volume = options.volume ?? DEFAULT_VOLUME[name] ?? 0.4
        audio.play().catch(() => {})
    }

    const ensureBackgroundAudio = () => {
        if (backgroundAudio) return backgroundAudio

        backgroundAudio = new Audio()
        backgroundAudio.preload = "auto"
        backgroundAudio.addEventListener("ended", () => {
            backgroundTrackIndex =
                (backgroundTrackIndex + 1) % BACKGROUND_TRACKS.length
            playBackgroundTrack()
        })

        return backgroundAudio
    }

    const playBackgroundTrack = () => {
        if (!unlocked || !backgroundMusicStarted || !BACKGROUND_TRACKS.length) {
            return
        }

        const audio = ensureBackgroundAudio()

        audio.pause()
        audio.src = BACKGROUND_TRACKS[backgroundTrackIndex]
        audio.volume = musicVolume
        audio.currentTime = 0
        audio.play().catch(() => {})
    }

    const startBackgroundMusic = () => {
        backgroundMusicStarted = true
        const audio = ensureBackgroundAudio()

        if (unlocked && audio.src && audio.paused) {
            audio.volume = musicVolume
            audio.play().catch(() => {})
            return
        }

        playBackgroundTrack()
    }

    const pauseBackgroundMusic = () => {
        backgroundMusicStarted = false
        if (backgroundAudio) {
            backgroundAudio.pause()
        }
    }

    const stopBackgroundMusic = () => {
        backgroundMusicStarted = false
        if (backgroundAudio) {
            backgroundAudio.pause()
            backgroundAudio.currentTime = 0
        }
    }

    const setMusicVolume = (volume = DEFAULT_MUSIC_VOLUME) => {
        const nextVolume = Math.min(1, Math.max(0, Number(volume)))
        musicVolume = Number.isFinite(nextVolume)
            ? nextVolume
            : DEFAULT_MUSIC_VOLUME

        if (backgroundAudio) {
            backgroundAudio.volume = musicVolume
        }
    }

    const nextBackgroundTrack = () => {
        if (!BACKGROUND_TRACKS.length) return
        backgroundTrackIndex = (backgroundTrackIndex + 1) % BACKGROUND_TRACKS.length
        backgroundMusicStarted = true
        playBackgroundTrack()
    }

    const previousBackgroundTrack = () => {
        if (!BACKGROUND_TRACKS.length) return
        backgroundTrackIndex =
            (backgroundTrackIndex - 1 + BACKGROUND_TRACKS.length) %
            BACKGROUND_TRACKS.length
        backgroundMusicStarted = true
        playBackgroundTrack()
    }

    const unlock = () => {
        if (unlocked) return
        unlocked = true
        Object.keys(SOUND_URLS).forEach((name) => {
            getPool(name)?.pool.forEach((audio) => {
                audio.load()
            })
        })
        startBackgroundMusic()

        while (queuedSounds.length) {
            const [name, options] = queuedSounds.shift()
            play(name, { ...options, queueUntilUnlock: false })
        }
    }

    const getSoundName = (target, attr) =>
        target.closest?.(`[${attr}]`)?.getAttribute(attr)

    const onPointerDown = (event) => {
        unlock()
        const soundName = getSoundName(event.target, "data-sound-click")
        if (soundName) play(soundName)
    }

    const onPointerOver = (event) => {
        const soundName = getSoundName(event.target, "data-sound-hover")
        const element = event.target.closest?.("[data-sound-hover]")
        if (!soundName || !element) return

        const now = performance.now()
        if (element === lastHoverElement && now - lastHoverAt < 450) return

        lastHoverElement = element
        lastHoverAt = now
        play(soundName)
    }

    const onUnlockEvent = () => unlock()

    const attach = (root) => {
        root?.addEventListener("pointerdown", onPointerDown, true)
        root?.addEventListener("pointerover", onPointerOver, true)
        window.addEventListener("pointerdown", onUnlockEvent, { once: true })
        window.addEventListener("keydown", onUnlockEvent, { once: true })

        return () => {
            root?.removeEventListener("pointerdown", onPointerDown, true)
            root?.removeEventListener("pointerover", onPointerOver, true)
            window.removeEventListener("pointerdown", onUnlockEvent)
            window.removeEventListener("keydown", onUnlockEvent)
        }
    }

    const dispose = () => {
        stopBackgroundMusic()
        if (backgroundAudio) {
            backgroundAudio.src = ""
            backgroundAudio = null
        }
        pools.forEach(({ pool }) => {
            pool.forEach((audio) => {
                audio.pause()
                audio.src = ""
            })
        })
        pools.clear()
        queuedSounds.length = 0
    }

    return {
        attach,
        dispose,
        play,
        unlock,
        startBackgroundMusic,
        pauseBackgroundMusic,
        stopBackgroundMusic,
        setMusicVolume,
        nextBackgroundTrack,
        previousBackgroundTrack,
    }
}
