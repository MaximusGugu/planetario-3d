import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Ventos extremos",
        content:
            "Netuno tem alguns dos ventos mais rápidos medidos no Sistema Solar. Mesmo recebendo pouca luz, sua atmosfera é muito ativa.",
    },
    {
        title: "Metano e cor",
        content:
            "O metano contribui para a coloração azul, mas outros componentes atmosféricos também influenciam o tom profundo observado.",
    },
    {
        title: "Tritão",
        content:
            "Sua maior lua, Tritão, orbita em sentido retrógrado e pode ter sido capturada do Cinturão de Kuiper. Ela possui geologia gelada ativa.",
    },
]

export default function NeptuneHUD() {
    return (
        <InfoHUD
            title="NETUNO"
            subtitle="Poseidon · Neptune"
            accordionItems={accordionItems}
            intro={
                "Netuno é o planeta mais distante entre os oito principais. Sua aparência azul intensa contrasta com a pouca luz que chega até lá, criando a sensação de um mundo frio, remoto e ainda assim dinâmico.\n\nA atmosfera exibe tempestades, nuvens brilhantes e ventos violentos, mostrando que distância do Sol não significa imobilidade."
            }
        />
    )
}