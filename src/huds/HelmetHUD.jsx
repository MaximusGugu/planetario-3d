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
    animation: "hudLinePulse 4.5s ease-in-out infinite",
}

const contentStyle = {
    position: "absolute",
    top: "7.5%",
    left: "3%",
    right: "3%",
    width: "94%",
    height: "85%",
    display: "grid",
    gridTemplateColumns: "minmax(360px, 42vw) minmax(220px, 28vw)",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 32,
    padding: "4vh 1vw 0 1vw",
    animation: "hudContentIn 800ms ease-out both",
}

const titleStyle = {
    margin: "0 0 18px",
    fontFamily: "'Denton Text', serif",
    fontStyle: "italic",
    fontSize: "clamp(16px, 1.8vw, 28px)",
    lineHeight: 0.86,
    color: "#df8845",
    textShadow: "0 0 24px rgba(223,136,69,0.22)",
    animation: "hudTitleGlow 5s ease-in-out infinite",
}

const bodyStyle = {
    maxWidth: 620,
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
    padding: "16px 56px 0 22px",
    marginRight: 0,
    animation: "hudAccordionIn 900ms ease-out both",
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

const longTicksStyle = {
    position: "absolute",
    right: "3.4vw",
    top: "50%",
    transform: "translateY(-50%)",
    width: 10,
    height: "60vh",
    opacity: 0.5,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 9px, rgba(255,255,255,0.4) 10px 11px)",
    filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))",
    animation: "hudTicksScan 7s linear infinite",
}

const cornerBlockStyle = {
    ...frameLineStyle,
    width: 64,
    height: 6,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
    boxSizing: "border-box",
    animation: "hudCornerGlow 3.5s ease-in-out infinite",
}

const sideButtonStyle = {
    position: "absolute",
    right: "calc(3vw + 1px)",
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.9)",
    textShadow: "0 0 8px rgba(255,255,255,0.65)",
    boxShadow: "0 0 10px rgba(255,255,255,0.25)",
    pointerEvents: "none",
    animation: "hudCornerGlow 3.5s ease-in-out infinite",
}

const sweepLightStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "45%",
    height: "100%",
    pointerEvents: "none",
    background:
        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.02) 65%, transparent 100%)",
    mixBlendMode: "screen",
    filter: "blur(10px)",
    animation: "hudSweepLight 6s ease-in-out infinite",
    zIndex: 2,
}

const GridLayer = () => (
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
            animation: "hudGridDrift 18s linear infinite",
        }}
    />
)

export const Frame = () => (
    <div style={frameStyle} aria-hidden="true">
        <GridLayer />

        <div
            style={{
                ...frameLineStyle,
                top: 0,
                left: 0,
                width: "calc(50% - 149px)",
                height: 1,
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                top: -12,
                left: "calc(50% - 153px)",
                width: 22,
                height: 1,
                transform: "rotate(-35deg)",
                transformOrigin: "right center",
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                top: -10,
                left: "calc(50% - 135px)",
                width: 270,
                height: 1,
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                top: -12,
                right: "calc(50% - 153px)",
                width: 22,
                height: 1,
                transform: "rotate(35deg)",
                transformOrigin: "left center",
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                top: 0,
                right: 0,
                width: "calc(50% - 149px)",
                height: 1,
            }}
        />

        <div
            style={{
                ...frameLineStyle,
                left: 0,
                top: 0,
                bottom: 0,
                width: 1,
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                right: 0,
                top: 0,
                bottom: 0,
                width: 1,
            }}
        />

        <div
            style={{
                ...frameLineStyle,
                bottom: 0,
                left: 0,
                width: "calc(50% - 149px)",
                height: 1,
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                bottom: -12,
                left: "calc(50% - 153px)",
                width: 22,
                height: 1,
                transform: "rotate(35deg)",
                transformOrigin: "right center",
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                bottom: -10,
                left: "calc(50% - 135px)",
                width: 270,
                height: 1,
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                bottom: -12,
                right: "calc(50% - 153px)",
                width: 22,
                height: 1,
                transform: "rotate(-35deg)",
                transformOrigin: "left center",
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                bottom: 0,
                right: 0,
                width: "calc(50% - 149px)",
                height: 1,
            }}
        />

        <div
            style={{
                ...frameLineStyle,
                top: -5,
                left: "50%",
                width: 64,
                height: 4,
                borderRadius: 999,
                transform: "translateX(-50%)",
                animation: "hudCenterBlink 3s ease-in-out infinite",
            }}
        />
        <div
            style={{
                ...frameLineStyle,
                bottom: -12,
                left: "50%",
                width: 64,
                height: 4,
                borderRadius: 999,
                transform: "translateX(-50%)",
                animation: "hudCenterBlink 3s ease-in-out infinite 1.5s",
            }}
        />

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
    renderAccordionContent
}) {
    const [openItem, setOpenItem] = useState(-1)

    return (
        <section style={hudRootStyle} aria-label={`${title || "Planet"} HUD`}>
            <div style={sweepLightStyle} />

            <Frame />

            <div style={longTicksStyle} />

            <div style={{ ...sideButtonStyle, top: "calc(20% - 28px)" }}>
                +
            </div>

            <div
                style={{
                    ...sideButtonStyle,
                    top: "calc(80% + 8px)",
                    animation: "hudCornerGlow 3.5s ease-in-out infinite 1.4s",
                }}
            >
                -
            </div>

            {content && (
                <div style={contentStyle}>
                    <article style={leftArticleStyle}>
                        {titleComponent ? (
                            titleComponent
                        ) : (
                            <h1 style={titleStyle}>{title}</h1>
                        )}
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
                                                nextIndex === -1 ? null : item
                                            )
                                        }}
                                    >
                                        <span>{item.title}</span>
                                        <AccordionIcon isOpen={isOpen} />
                                    </button>

                                    {isOpen && (
    <>
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
                display: "block",
                margin: "12px 0 18px",
                fontWeight: 650,
            }}
        />

        {renderAccordionContent?.(item)}
    </>
)}
                                </div>
                            )
                        })}
                    </aside>
                </div>
            )}

            {overlayComponent}

            <style>{`
                @keyframes hudLinePulse {
                    0%, 100% {
                        opacity: 0.62;
                        filter: brightness(0.9);
                    }
                    50% {
                        opacity: 1;
                        filter: brightness(1.28);
                    }
                }

                @keyframes hudTicksScan {
                    0% {
                        background-position-y: 0px;
                        opacity: 0.32;
                    }
                    50% {
                        opacity: 0.62;
                    }
                    100% {
                        background-position-y: 42px;
                        opacity: 0.32;
                    }
                }

                @keyframes hudGridDrift {
                    0% {
                        background-position: 0 0;
                        opacity: 0.14;
                    }
                    50% {
                        opacity: 0.28;
                    }
                    100% {
                        background-position: 42px 42px;
                        opacity: 0.14;
                    }
                }

                @keyframes hudCenterBlink {
                    0%, 100% {
                        opacity: 0.45;
                        filter: brightness(0.9);
                    }
                    50% {
                        opacity: 1;
                        filter: brightness(1.8);
                    }
                }

                @keyframes hudCornerGlow {
                    0%, 100% {
                        opacity: 0.55;
                        filter: brightness(0.85) drop-shadow(0 0 2px rgba(255,255,255,0.22));
                    }
                    50% {
                        opacity: 1;
                        filter: brightness(1.35) drop-shadow(0 0 10px rgba(255,255,255,0.75));
                    }
                }

                @keyframes hudSweepLight {
                    0% {
                        transform: translateX(-120%) skewX(-18deg);
                        opacity: 0;
                    }
                    15% {
                        opacity: 0.75;
                    }
                    45% {
                        opacity: 0.25;
                    }
                    100% {
                        transform: translateX(240%) skewX(-18deg);
                        opacity: 0;
                    }
                }

                @keyframes hudContentIn {
                    0% {
                        opacity: 0;
                        transform: translateY(14px);
                        filter: blur(5px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                        filter: blur(0);
                    }
                }

                @keyframes hudAccordionIn {
                    0% {
                        opacity: 0;
                        transform: translateX(18px);
                        filter: blur(4px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                        filter: blur(0);
                    }
                }

                @keyframes hudTitleGlow {
                    0%, 100% {
                        text-shadow: 0 0 18px rgba(223,136,69,0.16);
                    }
                    50% {
                        text-shadow:
                            0 0 24px rgba(223,136,69,0.32),
                            0 0 46px rgba(223,136,69,0.12);
                    }
                }

                .hud-accordion-typing {
                    animation: hudTextGlow 3s ease-in-out infinite;
                }

                @keyframes hudTextGlow {
                    0%, 100% {
                        opacity: 0.86;
                        text-shadow: 0 2px 12px rgba(0,0,0,0.9);
                    }
                    50% {
                        opacity: 1;
                        text-shadow:
                            0 2px 12px rgba(0,0,0,0.9),
                            0 0 10px rgba(255,255,255,0.22);
                    }
                }
            `}</style>
        </section>
    )
}

export function EmptyHelmetHUD({ title }) {
    return <HelmetHUD title={title} content={false} />
}