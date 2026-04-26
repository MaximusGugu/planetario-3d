import { HelmetHUD } from "./HelmetHUD.jsx"

const accordionItems = [
    {
        title: "Composição e atmosfera",
        content:
            "Júpiter é formado principalmente por hidrogênio e hélio. A atmosfera visível é organizada em faixas de nuvens, correntes violentas e camadas de amônia, água e compostos que criam tons creme, laranja e marrom.",
    },
    {
        title: "A Grande Mancha Vermelha",
        content:
            "A Grande Mancha Vermelha é uma tempestade gigantesca observada há séculos. Ela é maior que a Terra e funciona como um laboratório natural para entender fluidos, ventos e energia em atmosferas extremas.",
    },
    {
        title: "Sistema de luas",
        content:
            "As quatro luas galileanas são Io, Europa, Ganimedes e Calisto. Elas revelam mundos muito diferentes: vulcanismo extremo, oceanos subterrâneos, campos magnéticos e superfícies antigas marcadas por impactos.",
    },
]

export default function JupiterHUD() {
    return (
        <HelmetHUD title="Jupiter" accordionItems={accordionItems}>
            <p>
                Júpiter é o maior planeta do Sistema Solar e domina a região
                externa com sua massa, seu campo magnético e sua coleção de
                luas. Ao aterrissar visualmente nesse ponto, o planeta deixa de
                ser apenas um corpo distante e vira um ambiente: faixas de
                nuvens em rotação, tempestades persistentes e sombras
                projetadas pelas luas atravessam a atmosfera como marcas de uma
                máquina colossal.
            </p>
            <p>
                Apesar de não ter uma superfície sólida como a Terra, Júpiter é
                um destino essencial para entender a formação do Sistema Solar.
                Ele preserva pistas da nebulosa original que deu origem aos
                planetas e influencia órbitas, asteroides e luas ao seu redor.
            </p>
        </HelmetHUD>
    )
}
