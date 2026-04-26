import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Superficie extrema",
        content:
            "Mercurio e coberto por crateras, escarpas e planicies vulcanicas antigas. Como quase nao tem atmosfera, as marcas de impacto permanecem preservadas por bilhoes de anos.",
    },
    {
        title: "Dia e temperatura",
        content:
            "A rotacao lenta cria dias muito longos. A face iluminada fica extremamente quente, enquanto a noite mergulha em frio intenso.",
    },
    {
        title: "Nucleo metalico",
        content:
            "O planeta tem um nucleo de ferro enorme em relacao ao seu tamanho. Esse interior denso ajuda a explicar seu campo magnetico fraco, mas real.",
    },
]

export default function MercuryHUD() {
    return (
        <InfoHUD
            title="MERCURIO"
            subtitle="Hermes · Mercury"
            accordionItems={accordionItems}
            intro={
                "Mercurio e o planeta mais proximo do Sol e tambem o menor do Sistema Solar. A cena revela um mundo compacto, rochoso e marcado por impactos, onde a proximidade solar domina cada detalhe.\n\nSem uma atmosfera capaz de distribuir calor ou suavizar impactos, Mercurio funciona como um registro exposto da historia inicial dos planetas rochosos."
            }
        />
    )
}
