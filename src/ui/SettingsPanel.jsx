import { useEffect, useRef, useState } from "react"

const settingsPanelStyle = {
    position: "absolute",
    bottom: 110,
    left: "50%",
    transform: "translateX(-50%)",
    width: 180,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(15px)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 9001,
    color: "white",
    fontFamily: "monospace",
}

const dragHandleStyle = {
    height: 16,
    margin: "-8px 0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    touchAction: "none",
}

const dragHandleLineStyle = {
    width: 36,
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.28)",
}

const btnSmallStyle = {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    padding: "8px",
    fontSize: 7,
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
}

const ConfigSlider = ({ label, val, min, max, onChange }) => (
    <div style={{ marginBottom: 10 }}>
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 8,
                marginBottom: 3,
            }}
        >
            <span>{label}</span>
            <span>{Number(val || 0).toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={0.01}
            value={val}
            onChange={(event) => onChange(parseFloat(event.target.value))}
        />
    </div>
)

export default function SettingsPanel({ anchorX, cfg, setCfg }) {
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const dragRef = useRef(null)

    const update = (key, value) => setCfg({ ...cfg, [key]: value })

    useEffect(() => {
        const updateDrag = (event) => {
            const drag = dragRef.current
            if (!drag) return

            setDragOffset({
                x: drag.originX + event.clientX - drag.startX,
                y: drag.originY + event.clientY - drag.startY,
            })
        }

        const stopDrag = () => {
            dragRef.current = null
        }

        window.addEventListener("pointermove", updateDrag)
        window.addEventListener("pointerup", stopDrag)
        window.addEventListener("pointercancel", stopDrag)

        return () => {
            window.removeEventListener("pointermove", updateDrag)
            window.removeEventListener("pointerup", stopDrag)
            window.removeEventListener("pointercancel", stopDrag)
        }
    }, [])

    const startDrag = (event) => {
        event.stopPropagation()
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: dragOffset.x,
            originY: dragOffset.y,
        }
    }

    return (
        <div
            style={{
                ...settingsPanelStyle,
                left: anchorX ?? "50%",
                bottom: 110 - dragOffset.y,
                transform: `translateX(-50%) translateX(${dragOffset.x}px)`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <div
                style={dragHandleStyle}
                onPointerDown={startDrag}
            >
                <div style={dragHandleLineStyle} />
            </div>

            <ConfigSlider
                label="Sun"
                val={cfg.sunIntensity}
                min={0}
                max={20}
                onChange={(value) => update("sunIntensity", value)}
            />
            <ConfigSlider
                label="Bloom Strength"
                val={cfg.bloomStrength}
                min={0}
                max={3}
                onChange={(value) => update("bloomStrength", value)}
            />
            <ConfigSlider
                label="Bloom Radius"
                val={cfg.bloomRadius}
                min={0}
                max={2}
                onChange={(value) => update("bloomRadius", value)}
            />
            <ConfigSlider
                label="Bloom Threshold"
                val={cfg.bloomThreshold}
                min={0}
                max={1}
                onChange={(value) => update("bloomThreshold", value)}
            />
            <ConfigSlider
                label="Bloom"
                val={cfg.bloomRadius}
                min={0}
                max={1.48}
                onChange={(value) => update("bloomRadius", value)}
            />
            <ConfigSlider
                label="Shadows"
                val={cfg.ambientIntensity}
                min={0}
                max={1}
                onChange={(value) => update("ambientIntensity", value)}
            />
            <ConfigSlider
                label="Orbit"
                val={cfg.orbitSpeed}
                min={0}
                max={2}
                onChange={(value) => update("orbitSpeed", value)}
            />
            <ConfigSlider
                label="Rotate"
                val={cfg.rotateSpeed}
                min={0}
                max={2}
                onChange={(value) => update("rotateSpeed", value)}
            />
            <button
                style={btnSmallStyle}
                onClick={() => update("autoRotate", !cfg.autoRotate)}
            >
                {cfg.autoRotate ? "STOP" : "START"}
            </button>
        </div>
    )
}
