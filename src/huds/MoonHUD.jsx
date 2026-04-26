import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Mares lunares",
        content:
            "As regioes escuras sao planicies basalticas formadas por antigos fluxos de lava. Elas contrastam com terras altas mais claras e crateradas.",
    },
    {
        title: "Gravidade e mares",
        content:
            "A Lua estabiliza a inclinacao da Terra e influencia as mares. Sua presenca ajuda a moldar ritmos naturais do planeta.",
    },
    {
        title: "Arquivo de impactos",
        content:
            "Sem atmosfera significativa, a Lua preserva crateras e poeira antiga, funcionando como um registro da historia de impactos do Sistema Solar interno.",
    },
]

export default function MoonHUD() {
    return (
        <InfoHUD
            title="LUA"
            subtitle="Selene · Moon"
            accordionItems={accordionItems}
            intro={
                "A Lua e o satelite natural da Terra e o corpo celeste mais familiar no ceu noturno. Sua superficie seca, poeirenta e cheia de crateras revela um mundo geologicamente mais silencioso que a Terra.\n\nEla tambem e um marco historico: o unico corpo fora da Terra onde seres humanos ja caminharam."
            }
        />
    )
}
