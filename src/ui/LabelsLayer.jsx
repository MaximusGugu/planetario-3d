const labelStyle = {
    position: "absolute",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white",
    transform: "translate(-50%, -50%)",
    transition: "opacity 0.3s",
}

const dotStyle = { borderRadius: "50%", marginBottom: 4 }

const textStyle = {
    textShadow: "0 2px 4px black",
    pointerEvents: "none",
    marginTop: 4,
    textAlign: "center",
}

export default function LabelsLayer({
    labels,
    focusedMoon,
    selectedName,
    isInsideJupiter,
    cleanNavigationMode,
    freeFlightMode,
    autoHideUI,
    cfg,
    config,
    isJupiterChildTarget,
    isJupiterContext,
    getDisplayName,
    onFocus,
}) {
    return labels.map((label) => {
        const isFocusedTarget = focusedMoon && label.name === selectedName
        const isJupiterChild = isJupiterChildTarget(label.name)
        const isEarthChild = label.name === "Moon"

        const shouldShow =
            label.visible &&
            !isInsideJupiter &&
            !isFocusedTarget &&
            (!isJupiterChild || isJupiterContext()) &&
            (!isEarthChild || selectedName === "Earth") &&
            !cleanNavigationMode &&
            (!cfg.hideUI || freeFlightMode) &&
            !autoHideUI

        return (
            <div
                key={label.displayName || label.name}
                style={{
                    ...labelStyle,
                    left: label.x,
                    top: label.y,
                    opacity: shouldShow ? 1 : 0,
                    pointerEvents: shouldShow ? "auto" : "none",
                    zIndex: 8000,
                }}
                onPointerDown={(event) => {
                    event.stopPropagation()
                    onFocus(label.name)
                }}
            >
                {config.showPulse && (
                    <div
                        className="dot-ping"
                        style={{
                            width: config.dotSize,
                            height: config.dotSize,
                            background: config.dotColor,
                        }}
                    />
                )}

                <div
                    style={{
                        ...dotStyle,
                        width: config.dotSize,
                        height: config.dotSize,
                        background: config.dotColor,
                        boxShadow: `0 0 ${config.dotGlow}px ${config.dotColor}`,
                    }}
                />

                {cfg.showText && (
                    <span
                        style={{
                            ...textStyle,
                            fontFamily: config.labelFontFamily,
                            fontSize: config.labelFontSize,
                            color: config.labelFontColor,
                            letterSpacing: config.labelLetterSpacing,
                            textTransform: config.labelUppercase
                                ? "uppercase"
                                : "none",
                        }}
                    >
                        {getDisplayName(label.name)}
                    </span>
                )}
            </div>
        )
    })
}
