export const bottomHUDBarStyle = {
    position: "absolute",
    bottom: 60,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 12,
    padding: "10px 15px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 9000,
    alignItems: "center",
}

const menuStyle = {
    position: "absolute",
    bottom: 58,
    left: "50%",
    transform: "translateX(-50%)",
    minWidth: 130,
    padding: 8,
    borderRadius: 14,
    background: "rgba(20,20,20,0.9)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)",
    zIndex: 9000,
}

const sceneButtonStyle = {
    width: "100%",
    padding: "9px 10px",
    border: "none",
    borderRadius: 10,
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    cursor: "pointer",
    marginBottom: 6,
}

const musicMenuStyle = {
    position: "absolute",
    bottom: 58,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 16px 42px rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
    zIndex: 9001,
}

const musicVolumeWrapStyle = {
    position: "relative",
}

const musicVolumeSliderStyle = {
    position: "absolute",
    left: "50%",
    bottom: 46,
    transform: "translateX(-50%)",
    height: 126,
    width: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
    borderRadius: 999,
    background: "rgba(0,0,0,0.48)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
}

const verticalRangeStyle = {
    writingMode: "vertical-lr",
    direction: "rtl",
    width: 4,
    height: 94,
    accentColor: "#fff",
}

export default function BottomNavigation({
    activeButtonStyle,
    activeScene,
    autoHideUI,
    cleanNavigationMode,
    cfg,
    freeFlightMode,
    isFullscreen,
    menuForceHidden,
    menuHoverZone,
    musicMenuOpen,
    musicPlaying,
    musicVolume,
    scenes,
    simMenuOpen,
    onBack,
    onForward,
    onGoBackView,
    onReleaseToSpace,
    onSceneClick,
    onMusicMenuClose,
    onMusicMenuOpen,
    onMusicMenuToggle,
    onMusicNext,
    onMusicPrevious,
    onMusicToggle,
    onMusicVolumeChange,
    onSettingsToggle,
    onSimMenuToggle,
    onToggleFullscreen,
    onToggleHideUI,
    onPointerEnter,
    onPointerLeave,
}) {
    const hidden =
        !cfg.pinMenu &&
        (menuForceHidden ||
            (cfg.showInterface === false && !menuHoverZone) ||
            (cleanNavigationMode && !menuHoverZone) ||
            (autoHideUI && !menuHoverZone))

    return (
        <div
            style={{
                ...bottomHUDBarStyle,
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? "none" : "auto",
            }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerDown={(event) => {
                if (!event.target.closest("[data-music-menu]")) {
                    onMusicMenuClose?.()
                }
                event.stopPropagation()
            }}
        >
            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="back"
                onClick={onBack}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="click"
                style={cleanNavigationMode ? activeButtonStyle : undefined}
                onClick={onToggleHideUI}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill={cfg.hideUI ? "transparent" : "currentColor"} />
                </svg>
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="back"
                style={{ opacity: 1 }}
                onClick={onGoBackView}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 14l-4 -4l4 -4" />
                    <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                </svg>
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="travel"
                style={{
                    ...(freeFlightMode ? activeButtonStyle : {}),
                    opacity: activeScene ? 0.35 : freeFlightMode ? 1 : undefined,
                    pointerEvents: activeScene ? "none" : "auto",
                }}
                onClick={() => {
                    if (!activeScene) onReleaseToSpace()
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.874 3.486l-4.174 7.514h3.3c.846 0 1.293 .973 .791 1.612l-.074 .085l-6.9 7.095a7.5 7.5 0 1 1 -10.21 -10.974l7.746 -6.58c.722 -.614 1.814 .028 1.628 .958l-.577 2.879l7.11 -3.95c.88 -.488 1.849 .481 1.36 1.36m-12.374 7.515a3.5 3.5 0 0 0 -3.495 3.308l-.005 .192a3.5 3.5 0 1 0 3.5 -3.5" />
                </svg>
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="click"
                onClick={onToggleFullscreen}
            >
                {isFullscreen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 3v6H3" />
                        <path d="M15 3v6h6" />
                        <path d="M9 21v-6H3" />
                        <path d="M15 21v-6h6" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9V3h6" />
                        <path d="M21 9V3h-6" />
                        <path d="M3 15v6h6" />
                        <path d="M21 15v6h-6" />
                    </svg>
                )}
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="click"
                onClick={(event) => onSettingsToggle(event)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </div>

            <div
                data-music-menu
                style={{ position: "relative" }}
                onPointerEnter={onMusicMenuOpen}
                onPointerLeave={onMusicMenuClose}
            >
                <div
                    className="ui-icon-button"
                    data-sound-hover="click"
                    data-sound-click="click"
                    style={musicMenuOpen ? activeButtonStyle : undefined}
                    onClick={onMusicMenuToggle}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5l-4 4H3v6h4l4 4z" />
                        <path d="M16 9.5a4 4 0 0 1 0 5" />
                        <path d="M19 7a8 8 0 0 1 0 10" />
                    </svg>
                </div>

                {musicMenuOpen && (
                    <div
                        style={musicMenuStyle}
                        onPointerEnter={onMusicMenuOpen}
                        onPointerLeave={onMusicMenuClose}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="ui-icon-button"
                            data-sound-hover="click"
                            data-sound-click="click"
                            onClick={onMusicPrevious}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 5h2v14H6z" />
                                <path d="M20 6v12L9 12z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="ui-icon-button"
                            data-sound-hover="click"
                            data-sound-click="click"
                            onClick={onMusicToggle}
                        >
                            {musicPlaying ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 5h4v14H7z" />
                                    <path d="M13 5h4v14h-4z" />
                                </svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                        <div style={musicVolumeWrapStyle}>
                            <button
                                type="button"
                                className="ui-icon-button music-volume-button"
                                data-sound-hover="click"
                                data-sound-click="click"
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5l-4 4H3v6h4l4 4z" />
                                    <path d="M16 9.5a4 4 0 0 1 0 5" />
                                </svg>
                            </button>
                            <div className="music-volume-popover" style={musicVolumeSliderStyle}>
                                <input
                                    className="glass-range"
                                    style={verticalRangeStyle}
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={musicVolume}
                                    onChange={(event) =>
                                        onMusicVolumeChange(
                                            parseFloat(event.target.value)
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="ui-icon-button"
                            data-sound-hover="click"
                            data-sound-click="click"
                            onClick={onMusicNext}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 5h2v14h-2z" />
                                <path d="M4 6v12l11-6z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div style={{ position: "relative" }}>
                <div
                    className="ui-icon-button"
                    data-sound-hover="click"
                    data-sound-click="click"
                    onClick={onSimMenuToggle}
                    style={activeScene ? activeButtonStyle : undefined}
                >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>SIM</span>
                </div>

                {simMenuOpen && !activeScene && (
                    <div style={menuStyle} onPointerDown={(event) => event.stopPropagation()}>
                        {(scenes || []).map((sceneItem) => (
                            <button
                                key={sceneItem.id}
                                data-sound-hover="click"
                                data-sound-click="travel"
                                onClick={() => onSceneClick(sceneItem.id)}
                                style={sceneButtonStyle}
                            >
                                {sceneItem.label || sceneItem.id}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div
                className="ui-icon-button"
                data-sound-hover="click"
                data-sound-click="click"
                onClick={onForward}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </div>
    )
}
