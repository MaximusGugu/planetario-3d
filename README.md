# Análise do Planetário 3D

O aplicativo é um **Planetário 3D** construído com **React** e **Three.js** (Vanilla Three.js integrado no React), além do uso de **GSAP** para animações e transições. Ele oferece uma experiência interativa rica para explorar o sistema solar, com renderização avançada (como efeitos de *bloom* e texturas) e interfaces de usuário (HUDs) dinâmicas baseadas no contexto de navegação.

---

## 🚀 Funcionalidades Atuais (O que ele pode fazer)

1. **Navegação 3D Dinâmica**:
   - **Modo Órbita / Foco**: Clicar ou selecionar um planeta/lua centraliza a câmera nele.
   - **Modo Voo Livre (Free Flight)**: Permite movimentação livre da câmera pelo espaço.
   - **Close-up**: Capacidade de focar em características específicas (ex: A Grande Mancha Vermelha de Júpiter).
   - **Viagem Estelar (StarTravel)**: Transições e viagens fluidas entre os corpos celestes.
   
2. **Sistema Solar Completo**:
   - Renderização de **Planetas e Luas** com texturas e escalas definidas.
   - Geração de **Órbitas e Anéis** (Saturno, Urano, Netuno).
   - Simulação de **Cinturão de Asteroides**.
   - Iluminação realista originada pelo Sol.

3. **Interface Dinâmica e HUDs (Heads-Up Displays)**:
   - Cada corpo celeste principal possui um **HUD Exclusivo** (ex: `EarthHUD`, `MarsHUD`, `JupiterHUD`).
   - Visão de Interior de Júpiter (`JupiterInteriorHUD`) e até um `HelmetHUD` (Visão de capacete espacial).
   - Sistema de **Rótulos (Labels)** dinâmicos que acompanham a posição 3D dos objetos na tela.

4. **Painel de Configurações (SettingsPanel)**:
   - Controle de tempo: Ajuste de **Velocidade de Órbita** e **Velocidade de Rotação**.
   - Ajustes visuais em tempo real: Força, raio e limite do efeito *Bloom* (brilho), além da intensidade da luz do Sol e luz ambiente.
   
5. **Modo Imersivo**:
   - Modo **Tela Cheia (Fullscreen)**.
   - **Modo Limpo (Clean Navigation)** que esconde toda a interface para uma experiência cinematográfica.

---

## 🧱 Arquitetura e Blocos de Conteúdo

### 1. `src/core/` (O Motor do Planetário)
Responsável pelas mecânicas base do Three.js e interações.
- **`camera.js` & `controls.js`**: Gerenciam a visão do usuário e os controles orbitais.
- **`raycasting.js`**: Detecta onde o usuário está passando o mouse ou clicando (para focar em planetas).
- **`scene.js` & `postprocessing.js`**: Montam a cena 3D e aplicam os efeitos visuais (como o *Bloom* do Sol).
- **`navigation.js`**: Lógica matemática para calcular distâncias seguras de foco de câmera baseado no tamanho da viewport.

### 2. `src/systems/` (Geração do Sistema Solar)
Lida com a criação física e visual dos objetos 3D.
- **`planets.js` & `moons.js`**: Criam as esferas, aplicam texturas e mapeamentos.
- **`orbits.js`**: Desenha as linhas orbitais e os sistemas de anéis complexos.
- **`asteroids.js`**: Gera partículas de asteroides e posiciona o cinturão.
- **`lights.js`**: Configurações de PointLights (luz do Sol) e luz ambiente.

### 3. `src/huds/` (Overlays e Informação)
As interfaces que aparecem sobre a tela dependendo de onde o usuário está.
- Arquivos como `EarthHUD.jsx`, `VenusHUD.jsx`, e `GalileanMoons.jsx` sugerem painéis de dados ricos, mostrando informações científicas ou curiosidades quando focados no astro correspondente.

### 4. `src/ui/` (Interface Geral)
Componentes React que sobrepõem o canvas 3D.
- **`BottomNavigation.jsx`**: Barra inferior para navegação rápida entre planetas.
- **`SettingsPanel.jsx`**: Menu lateral ou modal de configurações.
- **`LabelsLayer.jsx`**: Desenha os nomes flutuantes em cima dos astros.

### 5. `src/config/` (Dados Mestre)
- Contém a parametrização do sistema solar (`planets.js`), definindo raios, distâncias orbitais, velocidades e texturas base para cada objeto gerado dinamicamente.