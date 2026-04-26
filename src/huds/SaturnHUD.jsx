import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Sistema de aneis",
        content:
            "Os aneis sao formados por gelo, poeira e fragmentos rochosos. Eles parecem solidos de longe, mas sao uma estrutura fina composta por incontaveis particulas em orbita.",
    },
    {
        title: "Gigante gasoso",
        content:
            "Saturno e feito principalmente de hidrogenio e helio. Sua densidade media e tao baixa que, em teoria, flutuaria em um oceano grande o bastante.",
    },
    {
        title: "Luas complexas",
        content:
            "Titan tem atmosfera densa e lagos de hidrocarbonetos. Encélado expele jatos de gelo que sugerem um oceano subterraneo.",
    },
]

export default function SaturnHUD() {
    return (
        <InfoHUD
            title="SATURNO"
            subtitle="Cronos · Saturn"
            accordionItems={accordionItems}
            intro={
                "Saturno e o gigante dos aneis. Sua presenca no planetario combina atmosfera dourada, rotacao rapida e um sistema de aneis que transforma o planeta em uma das silhuetas mais reconheciveis do Sistema Solar.\n\nA cena evidencia a diferenca entre um planeta gasoso e os mundos rochosos internos: aqui nao ha superficie solida visivel, apenas camadas de nuvens e dinamica atmosferica."
            }
        />
    )
}
