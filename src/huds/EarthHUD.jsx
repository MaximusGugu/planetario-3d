import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Oceanos e clima",
        content:
            "A agua liquida cobre a maior parte da superficie e regula o clima. Nuvens, oceanos e continentes tornam a Terra visualmente ativa mesmo vista do espaco.",
    },
    {
        title: "Atmosfera protetora",
        content:
            "Nitrogenio, oxigenio e vapor d'agua formam uma camada que filtra radiacao, distribui calor e permite a circulacao climatica global.",
    },
    {
        title: "Mundo vivo",
        content:
            "A Terra e o unico planeta conhecido com vida. A biosfera altera quimica, superficie e atmosfera, deixando sinais observaveis em escala planetaria.",
    },
]

export default function EarthHUD() {
    return (
        <InfoHUD
            title="TERRA"
            subtitle="Gaia · Earth"
            accordionItems={accordionItems}
            intro={
                "A Terra e um planeta rochoso com oceanos, atmosfera ativa e uma superficie em transformacao constante. No planetario, ela funciona como ponto de referencia para escala, clima e habitabilidade.\n\nSua aparencia azul e branca nasce da combinacao entre agua, nuvens e luz solar refletida pela atmosfera."
            }
        />
    )
}
