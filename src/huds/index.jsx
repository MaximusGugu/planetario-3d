import JupiterHUD from "./JupiterHUD.jsx"
import IoHUD from "./IoHUD.jsx"
import EuropaHUD from "./EuropaHUD.jsx"
import GanymedeHUD from "./GanymedeHUD.jsx"
import CallistoHUD from "./CallistoHUD.jsx"
import EarthHUD from "./EarthHUD.jsx"
import MarsHUD from "./MarsHUD.jsx"
import MercuryHUD from "./MercuryHUD.jsx"
import MoonHUD from "./MoonHUD.jsx"
import NeptuneHUD from "./NeptuneHUD.jsx"
import SaturnHUD from "./SaturnHUD.jsx"
import UranusHUD from "./UranusHUD.jsx"
import VenusHUD from "./VenusHUD.jsx"
import DefaultHUD from "./DefaultHUD.jsx"

export const HUD_BY_BODY = {
    Sun: <DefaultHUD title="Sun" />,
    Mercury: <MercuryHUD />,
    Venus: <VenusHUD />,
    Earth: <EarthHUD />,
    Moon: <MoonHUD />,
    Mars: <MarsHUD />,
    Jupiter: <JupiterHUD />,
    Saturn: <SaturnHUD />,
    Uranus: <UranusHUD />,
    Neptune: <NeptuneHUD />,
    IO: <IoHUD />,
    Europa: <EuropaHUD />,
    Ganymede: <GanymedeHUD />,
    Callisto: <CallistoHUD />,
}
