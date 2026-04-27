import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Maior lua",
        content:
            "Ganimedes é a maior lua do Sistema Solar e é maior que Mercúrio. Mesmo orbitando Júpiter, ela tem escala de pequeno planeta.",
    },
    {
        title: "Campo magnético",
        content:
            "É a única lua conhecida com campo magnético próprio. Esse detalhe indica um interior diferenciado, com camadas capazes de gerar dinâmica interna.",
    },
    {
        title: "Gelo e oceano",
        content:
            "A superfície mistura regiões antigas, crateradas, e terrenos claros marcados por sulcos. Abaixo do gelo pode existir um oceano salgado profundo.",
    },
]

export default function GanymedeHUD() {
    return (
        <InfoHUD
            title="GANIMEDES"
            subtitle="Ganymedes · Jupiter III"
            accordionItems={accordionItems}
            intro={
                "Ganimedes é a maior lua de Júpiter e também a maior lua do Sistema Solar. Seu tamanho, sua superfície de gelo e rocha e seu campo magnético próprio fazem dela um mundo com comportamento quase planetário.\n\nDe perto, Ganimedes parece dividido entre regiões antigas cheias de crateras e terrenos mais claros, riscados por longas faixas que contam uma história de tensão interna e gelo em movimento."
            }
        />
    )
}