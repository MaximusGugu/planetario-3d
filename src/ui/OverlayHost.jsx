const overlayWrapperStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    pointerEvents: "none",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.1s ease-out",
}

const overlayContentStyle = {
    pointerEvents: "none",
    width: "100%",
    height: "100%",
    maxWidth: "100%",
}

export default function OverlayHost({
    activeOverlay,
    interiorOverlay,
    mousePos,
    hudIntensity,
}) {
    if (!activeOverlay && !interiorOverlay) {
        return null
    }

    const strength = 0.25

    return (
        <div
            style={{
                ...overlayWrapperStyle,
                zIndex: 5000,
                transform: `translate(${mousePos.x * hudIntensity * strength}px, ${
                    mousePos.y * hudIntensity * strength
                }px)`,
            }}
        >
            <div style={overlayContentStyle}>
                {interiorOverlay ? interiorOverlay : activeOverlay}
            </div>
        </div>
    )
}
