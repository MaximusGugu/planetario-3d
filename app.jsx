import SolarSystemRenderer from "./components/SolarSystemRenderer"
import "./styles/global.css"

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <SolarSystemRenderer />
    </div>
  )
}