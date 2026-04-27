import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Superfície extrema",
        content:
            "Mercúrio é coberto por crateras, escarpas e planícies vulcânicas antigas. Como quase não tem atmosfera, as marcas de impacto permanecem preservadas por bilhões de anos.",
    },
    {
        title: "Dia e temperatura",
        content:
            "A rotação lenta cria dias muito longos. A face iluminada fica extremamente quente, enquanto a noite mergulha em frio intenso.",
    },
    {
        title: "Núcleo metálico",
        content:
            "O planeta tem um núcleo de ferro enorme em relação ao seu tamanho. Esse interior denso ajuda a explicar seu campo magnético fraco, mas real.",
    },
]

export default function MercuryHUD() {
    return (
        <InfoHUD
            title="MERCÚRIO"
            subtitle="Hermes · Mercury"
            accordionItems={accordionItems}
            intro={
                "Mercúrio é o planeta mais próximo do Sol e também o menor do Sistema Solar. A cena revela um mundo compacto, rochoso e marcado por impactos, onde a proximidade solar domina cada detalhe.\n\nSem uma atmosfera capaz de distribuir calor ou suavizar impactos, Mercúrio funciona como um registro exposto da história inicial dos planetas rochosos."
            }
        />
    )
}