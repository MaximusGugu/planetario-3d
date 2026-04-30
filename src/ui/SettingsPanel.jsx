import { useLayoutEffect, useRef, useState } from "react"

const ToggleRow = ({ label, checked, onChange }) => (
    <label className="settings-row settings-row--toggle">
        <span>{label}</span>
        <input
            className="glass-toggle"
            type="checkbox"
            data-sound-click="config"
            checked={Boolean(checked)}
            onChange={(event) => onChange(event.target.checked)}
        />
    </label>
)

const SliderRow = ({
    label,
    value,
    min = 0,
    max = 1,
    step = 0.01,
    onChange,
    minLabel,
    maxLabel,
}) => (
    <label className="settings-row settings-row--slider">
        <span>{label}</span>
        <input
            className="glass-range"
            type="range"
            data-sound-click="config"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(parseFloat(event.target.value))}
        />
        {(minLabel || maxLabel) && (
            <span className="settings-range-labels">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </span>
        )}
    </label>
)

const DisplayMode = ({ value, onChange }) => {
    const options = [
        ["quality", "Qualidade"],
        ["performance", "Desempenho"],
        ["balanced", "Equilibrado"],
    ]

    return (
        <div className="settings-display-modes">
            {options.map(([mode, label]) => (
                <label key={mode} className="settings-radio">
                    <input
                        type="radio"
                        name="displayMode"
                        data-sound-click="config"
                        checked={value === mode}
                        onChange={() => onChange(mode)}
                    />
                    <span>{label}</span>
                </label>
            ))}
        </div>
    )
}

const Section = ({ id, title, open, onToggle, children }) => (
    <section
        className={`glass-section settings-section ${open ? "is-open" : ""}`}
        data-settings-section={id}
    >
        <button
            type="button"
            className="settings-section__trigger"
            data-sound-hover="click"
            aria-expanded={open}
            onPointerDown={() => {
                window.planetarioSounds?.unlock()
                window.planetarioSounds?.play("accordion")
            }}
            onClick={() => onToggle(id)}
        >
            <span>{title}</span>
        </button>
        <div className="settings-section__content" inert={!open ? "" : undefined}>
            {children}
        </div>
    </section>
)

export default function SettingsPanel({ cfg, setCfg, onClose, onReset }) {
    const bodyRef = useRef(null)
    const lastOpenedRef = useRef(null)
    const [openSections, setOpenSections] = useState(["camera"])

    const update = (key, value) =>
        setCfg((previous) => ({
            ...previous,
            [key]: value,
        }))

    const isOpen = (id) => openSections.includes(id)

    const toggleSection = (id) => {
        setOpenSections((previous) => {
            if (previous.includes(id)) {
                return previous.filter((item) => item !== id)
            }

            lastOpenedRef.current = id
            return [...previous, id]
        })
    }

    useLayoutEffect(() => {
        const body = bodyRef.current
        const newest = lastOpenedRef.current
        if (!body || !newest || !openSections.includes(newest)) return

        if (body.scrollHeight <= body.clientHeight + 1) {
            lastOpenedRef.current = null
            return
        }

        const oldest = openSections.find((id) => id !== newest)
        if (!oldest) return

        setOpenSections((previous) => previous.filter((id) => id !== oldest))
    }, [openSections])

    return (
        <aside
            className="glass-panel settings-panel"
            aria-label="Configurações"
            onPointerDown={(event) => event.stopPropagation()}
        >
            <header className="settings-panel__header">
                <h2>Configurações</h2>
                <button
                    type="button"
                    data-sound-hover="click"
                    data-sound-click="back"
                    onClick={onClose}
                >
                    Fechar
                </button>
            </header>

            <div className="settings-panel__body" ref={bodyRef}>
                <Section
                    id="interface"
                    title="Interface"
                    open={isOpen("interface")}
                    onToggle={toggleSection}
                >
                    <ToggleRow
                        label="Mostrar interface"
                        checked={cfg.showInterface}
                        onChange={(value) => update("showInterface", value)}
                    />
                    <ToggleRow
                        label="Mostrar marcadores"
                        checked={cfg.showMarkers}
                        onChange={(value) => update("showMarkers", value)}
                    />
                    <ToggleRow
                        label="Mostrar HUD ao pousar"
                        checked={cfg.showHudOnFocus}
                        onChange={(value) => update("showHudOnFocus", value)}
                    />
                    <ToggleRow
                        label="Fixar menu na tela"
                        checked={cfg.pinMenu}
                        onChange={(value) => update("pinMenu", value)}
                    />
                </Section>

                <Section
                    id="camera"
                    title="Câmera"
                    open={isOpen("camera")}
                    onToggle={toggleSection}
                >
                    <SliderRow
                        label="Intensidade do zoom"
                        value={cfg.zoomSensitivity}
                        min={0.25}
                        max={3}
                        onChange={(value) => update("zoomSensitivity", value)}
                    />
                    <SliderRow
                        label="Sensibilidade da rotação"
                        value={cfg.rotationSensitivity}
                        min={0.25}
                        max={3}
                        onChange={(value) => update("rotationSensitivity", value)}
                    />
                    <SliderRow
                        label="Velocidade do modo astronauta"
                        value={cfg.freeFlightSpeed}
                        min={0.2}
                        max={4}
                        onChange={(value) => update("freeFlightSpeed", value)}
                    />
                </Section>

                <Section
                    id="simulation"
                    title="Simulação"
                    open={isOpen("simulation")}
                    onToggle={toggleSection}
                >
                    <ToggleRow
                        label="Mostrar anéis volumétricos"
                        checked={cfg.showVolumetricRings}
                        onChange={(value) => update("showVolumetricRings", value)}
                    />
                    <ToggleRow
                        label="Mostrar satélites naturais"
                        checked={cfg.showNaturalSatellites}
                        onChange={(value) => update("showNaturalSatellites", value)}
                    />
                    <SliderRow
                        label="Velocidade dos satélites"
                        value={cfg.satelliteSpeed}
                        min={0}
                        max={3}
                        onChange={(value) => update("satelliteSpeed", value)}
                    />
                    <SliderRow
                        label="Velocidade de rotação"
                        value={cfg.rotateSpeed}
                        min={0}
                        max={3}
                        onChange={(value) => update("rotateSpeed", value)}
                    />
                    <SliderRow
                        label="Velocidade de órbita"
                        value={cfg.orbitSpeed}
                        min={0}
                        max={3}
                        onChange={(value) => update("orbitSpeed", value)}
                    />
                    <ToggleRow
                        label="Mostrar cinturão de asteroides"
                        checked={cfg.showAsteroidBelt}
                        onChange={(value) => update("showAsteroidBelt", value)}
                    />
                    <ToggleRow
                        label="Mostrar órbitas"
                        checked={cfg.showOrbitTrails}
                        onChange={(value) => update("showOrbitTrails", value)}
                    />
                    <SliderRow
                        label="Escala do sistema"
                        value={cfg.systemScale}
                        min={0}
                        max={1}
                        onChange={(value) => update("systemScale", value)}
                        minLabel="Compacto"
                        maxLabel="Realista"
                    />
                    <ToggleRow
                        label="Pausar simulação ao focar objeto"
                        checked={cfg.pauseSimulationOnFocus}
                        onChange={(value) =>
                            update("pauseSimulationOnFocus", value)
                        }
                    />
                </Section>

                <Section
                    id="lighting"
                    title="Iluminação"
                    open={isOpen("lighting")}
                    onToggle={toggleSection}
                >
                    <ToggleRow
                        label="Mostrar luz de foco ao entrar em órbita"
                        checked={cfg.showFocusLightOnOrbit}
                        onChange={(value) => update("showFocusLightOnOrbit", value)}
                    />
                    <SliderRow
                        label="Intensidade do Sol"
                        value={cfg.sunIntensity}
                        min={0}
                        max={4}
                        onChange={(value) => update("sunIntensity", value)}
                    />
                    <SliderRow
                        label="Intensidade das sombras"
                        value={cfg.shadowIntensity}
                        min={0}
                        max={1}
                        onChange={(value) => update("shadowIntensity", value)}
                    />
                </Section>

                <Section
                    id="display"
                    title="Modo de exibição"
                    open={isOpen("display")}
                    onToggle={toggleSection}
                >
                    <DisplayMode
                        value={cfg.displayMode}
                        onChange={(value) => update("displayMode", value)}
                    />
                </Section>
            </div>

            <button
                type="button"
                className="glass-button settings-reset"
                data-sound-hover="click"
                data-sound-click="config"
                onClick={onReset}
            >
                Reiniciar
            </button>
        </aside>
    )
}
