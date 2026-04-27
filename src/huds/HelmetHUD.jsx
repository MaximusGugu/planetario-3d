import { useState } from "react"
import TextType from "../components/TextType.jsx"

const hudRootStyle = {
    width: "100vw",
    height: "100vh",
    boxSizing: "border-box",
    padding: "12px 16px",
    position: "relative",
    overflow: "hidden",
    pointerEvents: "none",
    color: "#f5f5f5",
    fontFamily: "Inter, system-ui, sans-serif",
}

const frameStyle = {
    position: "absolute",
    inset: "5% 2.5%",
    filter: "drop-shadow(0 0 18px rgba(255,255,255,0.28))",
    opacity: 0.96,
}

const frameLineStyle = {
    position: "absolute",
    background: "rgba(255,255,255,0.9)",
    boxShadow:
        "0 0 6px rgba(255,255,255,0.7), 0 0 16px rgba(255,255,255,0.2)",
}

const contentInset = "clamp(28px, 3vh, 44px)"

const contentStyle = {
    position: "absolute",
    top: "7.5%",
    left: "3%",
    right: "3%",
    width: "90%",
    height: "85%",
    display: "grid",
    gridTemplateColumns: "minmax(240px, 34vw) minmax(220px, 28vw)",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 32,
    padding: `${contentInset} 1vw ${contentInset} ${contentInset}`,
}

const titleStyle = {
    margin: "0 0 18px",
    fontFamily: "'Denton Text', serif",
    fontStyle: "italic",
    fontSize: "clamp(16px, 1.8vw, 28px)",
    lineHeight: 0.86,
    color: "#df8845",
    textShadow: "0 0 24px rgba(223,136,69,0.22)",
}

const bodyStyle = {
    maxWidth: 500,
    fontSize: "clamp(12px, 0.82vw, 14px)",
    lineHeight: 1.48,
    fontWeight: 700,
    fontFamily: "'General Sans', sans-serif",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

export const hudTitleStyle = titleStyle
export const hudBodyStyle = bodyStyle

const leftArticleStyle = {
    alignSelf: "stretch",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 0,
}

const accordionPanelStyle = {
    pointerEvents: "auto",
    alignSelf: "end",
    justifySelf: "end",
    width: "min(460px, 30vw)",
    minWidth: 280,
    padding: "16px 8px 0 22px",
    marginRight: 0,
}

const accordionButtonStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.72)",
    padding: "13px 0 11px",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    outline: "none",
    font: "inherit",
    fontWeight: 800,
    fontSize: "clamp(12px, 0.9vw, 15px)",
    textAlign: "left",
}

const accordionTextStyle = {
    maxWidth: 390,
    margin: "0 0 12px",
    fontSize: "clamp(11px, 0.78vw, 13px)",
    lineHeight: 1.42,
    fontWeight: 650,
    fontFamily: "'General Sans', sans-serif",
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const AccordionIcon = ({ isOpen }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        aria-hidden="true"
        focusable="false"
        style={{
            flex: "0 0 auto",
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.55))",
        }}
    >
        <line
            x1="4"
            y1="9"
            x2="14"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
                transformOrigin: "9px 9px",
                transition: "transform 220ms ease, opacity 220ms ease",
            }}
        />
        <line
            x1="9"
            y1="4"
            x2="9"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
                opacity: isOpen ? 0 : 1,
                transform: isOpen ? "scaleY(0)" : "scaleY(1)",
                transformOrigin: "9px 9px",
                transition: "transform 220ms ease, opacity 220ms ease",
            }}
        />
    </svg>
)

const zoomControlStyle = {
    position: "absolute",
    right: "2.85vw",
    top: "50%",
    transform: "translateY(-50%)",
    width: 64,
    height: "58vh",
    minHeight: 360,
    pointerEvents: "none",
    color: "rgba(255,255,255,0.82)",
    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.35))",
}

const zoomRailStyle = {
    position: "absolute",
    right: 24,
    top: 42,
    bottom: 42,
    width: 1,
    background:
        "linear-gradient(to bottom, transparent, rgba(255,255,255,0.58) 12%, rgba(255,255,255,0.58) 88%, transparent)",
}

const zoomTicksStyle = {
    position: "absolute",
    inset: "42px 0",
    background:
        "repeating-linear-gradient(to bottom, transparent 0 10px, rgba(255,255,255,0.26) 11px 12px, transparent 13px 22px)",
    WebkitMaskImage:
        "linear-gradient(to bottom, transparent, black 9%, black 91%, transparent)",
    maskImage:
        "linear-gradient(to bottom, transparent, black 9%, black 91%, transparent)",
}

const zoomThumbStyle = {
    position: "absolute",
    right: 11,
    top: "42%",
    width: 28,
    height: 2,
    borderRadius: 999,
    background: "#df8845",
    boxShadow:
        "0 0 10px rgba(223,136,69,0.9), 0 0 24px rgba(223,136,69,0.28)",
}

const zoomReadoutStyle = {
    position: "absolute",
    right: 40,
    top: "42%",
    transform: "translateY(-50%) rotate(-90deg)",
    transformOrigin: "right center",
    fontFamily: "'General Sans', sans-serif",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.18em",
    color: "rgba(223,136,69,0.92)",
    whiteSpace: "nowrap",
}

const zoomButtonStyle = {
    position: "absolute",
    right: 12,
    width: 24,
    height: 24,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "50%",
    background: "rgba(5,7,12,0.44)",
    color: "rgba(255,255,255,0.86)",
    fontFamily: "'General Sans', sans-serif",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1,
    cursor: "pointer",
    pointerEvents: "auto",
}

const cornerBlockStyle = {
    ...frameLineStyle,
    width: 64,
    height: 6,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
    boxSizing: "border-box",
}

const ZoomControl = ({ onZoomDelta }) => (
    <div style={zoomControlStyle} aria-label="Controle de zoom do HUD">
        <button
            type="button"
            aria-label="Aproximar"
            style={{ ...zoomButtonStyle, top: 0 }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.stopPropagation()
                onZoomDelta?.(1)
            }}
        >
            +
        </button>
        <div style={zoomTicksStyle} />
        <div style={zoomRailStyle} />
        <div className="hud-zoom-thumb" style={zoomThumbStyle} />
        <div className="hud-zoom-readout" style={zoomReadoutStyle}>
            ZOOM 68%
        </div>
        <button
            type="button"
            aria-label="Afastar"
            style={{ ...zoomButtonStyle, bottom: 0 }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.stopPropagation()
                onZoomDelta?.(-1)
            }}
        >
            −
        </button>
    </div>
)

export const Frame = ({ showGrid = true }) => (
    <div style={frameStyle} aria-hidden="true">
        {/* GRID COM FADE NAS BORDAS */}
        {showGrid && (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.25,
                    backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                    backgroundSize: "42px 42px",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.3) 60%, black 100%)",
                    maskImage:
                        "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.3) 60%, black 100%)",
                }}
            />
        )}

        {/* TOPO COM DESNÍVEL */}
        <div style={{ ...frameLineStyle, top: 0, left: 0, width: "calc(50% - 149px)", height: 1 }} />
        <div style={{ ...frameLineStyle, top: -12, left: "calc(50% - 153px)", width: 22, height: 1, transform: "rotate(-35deg)", transformOrigin: "right center" }} />
        <div style={{ ...frameLineStyle, top: -10, left: "calc(50% - 135px)", width: 270, height: 1 }} />
        <div style={{ ...frameLineStyle, top: -12, right: "calc(50% - 153px)", width: 22, height: 1, transform: "rotate(35deg)", transformOrigin: "left center" }} />
        <div style={{ ...frameLineStyle, top: 0, right: 0, width: "calc(50% - 149px)", height: 1 }} />

        {/* LATERAIS */}
        <div style={{ ...frameLineStyle, left: 0, top: 0, bottom: 0, width: 1 }} />
        <div style={{ ...frameLineStyle, right: 0, top: 0, bottom: 0, width: 1 }} />

        {/* BASE COM DESNÍVEL */}
        <div style={{ ...frameLineStyle, bottom: 0, left: 0, width: "calc(50% - 149px)", height: 1 }} />
        <div style={{ ...frameLineStyle, bottom: -12, left: "calc(50% - 153px)", width: 22, height: 1, transform: "rotate(35deg)", transformOrigin: "right center" }} />
        <div style={{ ...frameLineStyle, bottom: -10, left: "calc(50% - 135px)", width: 270, height: 1 }} />
        <div style={{ ...frameLineStyle, bottom: -12, right: "calc(50% - 153px)", width: 22, height: 1, transform: "rotate(-35deg)", transformOrigin: "left center" }} />
        <div style={{ ...frameLineStyle, bottom: 0, right: 0, width: "calc(50% - 149px)", height: 1 }} />

        {/* BARRINHAS CENTRAIS */}
        <div style={{ ...frameLineStyle, top: -5, left: "50%", width: 64, height: 4, borderRadius: 999, transform: "translateX(-50%)" }} />
        <div style={{ ...frameLineStyle, bottom: -12, left: "50%", width: 64, height: 4, borderRadius: 999, transform: "translateX(-50%)" }} />

        {/* RETÂNGULOS DOS CANTOS */}
        <div style={{ ...cornerBlockStyle, top: 0, left: 0 }} />
        <div style={{ ...cornerBlockStyle, top: 0, right: 0 }} />
        <div style={{ ...cornerBlockStyle, bottom: 0, left: 0 }} />
        <div style={{ ...cornerBlockStyle, bottom: 0, right: 0 }} />
    </div>
)

export function HelmetHUD({
    title,
    children,
    accordionItems = [],
    content = true,
    onAccordionChange,
    titleComponent,
    overlayComponent,
    onZoomDelta,
    contentStyle: contentStyleOverride,
    leftArticleStyle: leftArticleStyleOverride,
    bodyStyle: bodyStyleOverride,
    renderAccordionContent,
}) {
    const [openItem, setOpenItem] = useState(-1)

    return (
        <section style={hudRootStyle} aria-label={`${title || "Planet"} HUD`}>
            <Frame />
            <ZoomControl onZoomDelta={onZoomDelta} />

            {content && (
                <div
                    style={{
                        ...contentStyle,
                        ...(contentStyleOverride || {}),
                    }}
                >
                    <article
                        style={{
                            ...leftArticleStyle,
                            ...(leftArticleStyleOverride || {}),
                        }}
                    >
                        {titleComponent ? titleComponent : <h1 style={titleStyle}>{title}</h1>}
                        <div
                            style={{
                                ...bodyStyle,
                                ...(bodyStyleOverride || {}),
                            }}
                        >
                            {children}
                        </div>
                    </article>

                    <aside
                        style={accordionPanelStyle}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        {accordionItems.map((item, index) => {
                            const isOpen = openItem === index

                            return (
                                <div key={item.title}>
                                    <button
                                        type="button"
                                        style={accordionButtonStyle}
                                        onClick={() => {
                                            const nextIndex = isOpen
                                                ? -1
                                                : index
                                            setOpenItem(nextIndex)
                                            onAccordionChange?.(
                                                nextIndex === -1
                                                    ? null
                                                    : item
                                            )
                                        }}
                                    >
                                        <span>{item.title}</span>
                                        <AccordionIcon isOpen={isOpen} />
                                    </button>
                                    {isOpen && (
                                        <div>
                                            <TextType
                                            text={item.content}
                                            typingSpeed={20}
                                            pauseDuration={800}
                                            loop={false}
                                            showCursor={true}
                                            cursorCharacter="▌"
                                            deletingSpeed={45}
                                            className="hud-accordion-typing"
                                            style={{
                                                ...accordionTextStyle,
                                                display: 'block',
                                                margin: '12px 0 18px',
                                                fontWeight: 650,
                                            }}
                                            />
                                            {renderAccordionContent?.(item)}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </aside>
                </div>
            )}
            {overlayComponent}
            <style>{`
                @keyframes hudFramePulse {
                    0%, 100% { opacity: 0.72; }
                    50% { opacity: 1; }
                }
                @keyframes hudZoomScan {
                    0%, 100% { transform: translateY(-34px); opacity: 0.68; }
                    50% { transform: translateY(34px); opacity: 1; }
                }
                @keyframes hudZoomReadout {
                    0%, 100% { opacity: 0.58; }
                    50% { opacity: 1; }
                }
                .hud-zoom-thumb {
                    animation: hudZoomScan 3.8s ease-in-out infinite;
                }
                .hud-zoom-readout {
                    animation: hudZoomReadout 1.8s ease-in-out infinite;
                }
            `}</style>
        </section>
    )
}

export function EmptyHelmetHUD({ title }) {
    return <HelmetHUD title={title} content={false} />
}
