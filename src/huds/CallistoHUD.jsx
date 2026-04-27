import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Superfície antiga",
        content:
            "Calisto é um dos terrenos mais antigos e craterados do Sistema Solar. Sua superfície registra bilhões de anos de impactos quase sem renovação intensa.",
    },
    {
        title: "Gelo e rocha",
        content:
            "A lua é composta por uma mistura de gelo, rocha e materiais escuros. Essa composição cria um visual frio, manchado e muito marcado por cicatrizes.",
    },
    {
        title: "Mundo preservado",
        content:
            "Por estar mais distante de Júpiter que Io e Europa, Calisto sofre menos aquecimento de maré. Isso ajuda a preservar sua aparência antiga.",
    },
]

export default function CallistoHUD() {
    return (
        <InfoHUD
            title="CALISTO"
            subtitle="Kallisto · Jupiter IV"
            accordionItems={accordionItems}
            intro={
                "Calisto é a lua galileana mais externa de Júpiter. Ela parece silenciosa e antiga: um mundo escuro, gelado e coberto por crateras que preservam a memória de impactos desde o início do Sistema Solar.\n\nAo contrário de luas mais ativas, Calisto mostra pouca remodelação recente. Isso transforma sua superfície em um arquivo visual da história orbital ao redor de Júpiter."
            }
        />
    )
}