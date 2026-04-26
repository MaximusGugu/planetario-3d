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
    padding: "4vh 1vw 0 3vw",
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

const cornerTicksStyle = {
    position: "absolute",
    right: "4.1vw",
    bottom: "28vh",
    width: 78,
    height: "34vh",
    opacity: 0.75,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 13px, rgba(255,255,255,0.8) 14px 15px, transparent 16px 25px)",
    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.6))",
}

const longTicksStyle = {
    position: "absolute",
    right: "3vw",
    top: "50%",
    transform: "translateY(-50%)",
    width: 40,
    height: "60vh",
    opacity: 0.5,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 9px, rgba(255,255,255,0.4) 10px 11px)",
    filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))",
}

const cornerBlockStyle = {
    ...frameLineStyle,
    width: 64,
    height: 6,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
    boxSizing: "border-box",
}

const Frame = () => (
    <div style={frameStyle} aria-hidden="true">
        {/* GRID COM FADE NAS BORDAS */}
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
}) {
    const [openItem, setOpenItem] = useState(-1)

    return (
        <section style={hudRootStyle} aria-label={`${title || "Planet"} HUD`}>
            <Frame />
            <div style={longTicksStyle} />

            {content && (
                <div style={contentStyle}>
                    <article style={leftArticleStyle}>
                        {titleComponent ? titleComponent : <h1 style={titleStyle}>{title}</h1>}
                        <div style={bodyStyle}>{children}</div>
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
                                    )}
                                </div>
                            )
                        })}
                    </aside>
                </div>
            )}
            <style>{`
                @keyframes hudFramePulse {
                    0%, 100% { opacity: 0.72; }
                    50% { opacity: 1; }
                }
            `}</style>
        </section>
    )
}

export function EmptyHelmetHUD({ title }) {
    return <HelmetHUD title={title} content={false} />
}
