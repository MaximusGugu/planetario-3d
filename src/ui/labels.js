const DISPLAY_NAMES = {
    Sun: "Sol",
    Mercury: "Mercúrio",
    Venus: "Vênus",
    Earth: "Terra",
    Moon: "Lua",
    Mars: "Marte",
    Jupiter: "Júpiter",
    Saturn: "Saturno",
    Uranus: "Urano",
    Neptune: "Netuno",
    Callisto: "Calisto",
    Europa: "Europa",
    Ganymede: "Ganimedes",
    IO: "Io",
}

export const getDisplayName = (name, config = {}) =>
    config[`customName_${name}`] || DISPLAY_NAMES[name] || name

export const isLabelHovered = (label, mouseScreenPos, radius = 38) => {
    const dx = label.x - mouseScreenPos.x
    const dy = label.y - mouseScreenPos.y

    return Math.sqrt(dx * dx + dy * dy) < radius
}
