export const isCustomMarker = (config, name) =>
    Boolean(config.customMarkers?.some((marker) => marker.name === name))
