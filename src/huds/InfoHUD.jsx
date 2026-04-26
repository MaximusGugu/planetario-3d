import { HelmetHUD, hudTitleStyle } from "./HelmetHUD.jsx"
import TextType from "../components/TextType.jsx"

const infoTitleStyle = {
    ...hudTitleStyle,
    margin: 0,
    lineHeight: 1.05,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const infoTitleMetaStyle = {
    display: "block",
    marginTop: 8,
    fontSize: "0.56em",
    fontStyle: "italic",
    letterSpacing: "0.04em",
    textTransform: "none",
    opacity: 0.9,
}

const InfoTitle = ({ title, subtitle }) => (
    <h1 style={infoTitleStyle}>
        {title}
        {subtitle && <span style={infoTitleMetaStyle}>{subtitle}</span>}
    </h1>
)

export default function InfoHUD({
    title,
    subtitle,
    intro,
    accordionItems,
    onAccordionChange,
}) {
    return (
        <HelmetHUD
            title={title}
            accordionItems={accordionItems}
            titleComponent={<InfoTitle title={title} subtitle={subtitle} />}
            onAccordionChange={onAccordionChange}
        >
            <TextType
                text={intro}
                typingSpeed={20}
                pauseDuration={1500}
                loop={false}
                showCursor={true}
                cursorCharacter="▌"
                deletingSpeed={45}
                className="hud-content-typing"
            />
        </HelmetHUD>
    )
}
