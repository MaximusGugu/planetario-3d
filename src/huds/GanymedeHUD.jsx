import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Maior lua",
        content:
            "Ganimedes e a maior lua do Sistema Solar e e maior que Mercurio. Mesmo orbitando Jupiter, ela tem escala de pequeno planeta.",
    },
    {
        title: "Campo magnetico",
        content:
            "E a unica lua conhecida com campo magnetico proprio. Esse detalhe indica um interior diferenciado, com camadas capazes de gerar dinamica interna.",
    },
    {
        title: "Gelo e oceano",
        content:
            "A superficie mistura regioes antigas, crateradas, e terrenos claros marcados por sulcos. Abaixo do gelo pode existir um oceano salgado profundo.",
    },
]

export default function GanymedeHUD() {
    return (
        <InfoHUD
            title="GANIMEDES"
            subtitle="Ganymedes · Jupiter III"
            accordionItems={accordionItems}
            intro={
                "Ganimedes e a maior lua de Jupiter e tambem a maior lua do Sistema Solar. Seu tamanho, sua superficie de gelo e rocha e seu campo magnetico proprio fazem dela um mundo com comportamento quase planetario.\n\nDe perto, Ganimedes parece dividido entre regioes antigas cheias de crateras e terrenos mais claros, riscados por longas faixas que contam uma historia de tensao interna e gelo em movimento."
            }
        />
    )
}
