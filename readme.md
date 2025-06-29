# Plataforma NFT com Integração Blockchain

Este repositório contém o código-fonte completo do projeto desenvolvido como parte do Trabalho Final da disciplina Tópicos em Computação Aplicada, envolvendo a criação de uma aplicação descentralizada (dApp) com front-end web e um contrato inteligente em Solidity de um protótipo funcional para a tokenização de personagens de jogos do tipo MMORPG utilizando tecnologia blockchain. A proposta baseia-se na criação de um contrato inteligente, implementado na rede de testes Sepolia da Ethereum, capaz de representar personagens como tokens não fungíveis (NFTs) seguindo o padrão ERC-721. O sistema permite criar (mintar), vender, comprar, transferir e consultar personagens por meio de funcionalidades descentralizadas.


## 🧪 Tecnologias Utilizadas

- **Solidity** — Linguagem para contratos inteligentes
- **Hardhat** — Framework de desenvolvimento e testes
- **Ethers.js** — Integração entre front-end e blockchain
- **React.js** (ou outro framework) — Interface do usuário
- **IPFS / Pinata** — Armazenamento descentralizado de metadados e imagens
- **OpenSea / Sepolia Testnet** — Visualização pública da coleção NFT

## 🚀 Como Executar Localmente

### Pré-requisitos

- Node.js
- NPM ou Yarn
- MetaMask instalado em seu navegador
- Hardhat (`npm install --save-dev hardhat`)
- Git

### 1. Clonar o repositório
- git clone https://github.com/vicenttcarvalho/nft-dapp.git
- cd nft-dapp


### 2. Instalar as dependências
- cd contrato
- npm install

### 3. Compilar o contrato(Caso queira compilar seu próprio contrato)
- npx hardhat compile

### 4. Executar os testes
- npx hardhat test test/PersonagemMarketplace.js

### 5. Rodar o front-end
cd ../frontend/personagem-marketplace
- npm install
- npm run dev

🔗 Deploy e Visualização
Contrato implantado na rede de testes Sepolia: https://sepolia.etherscan.io/address/0x5070f98092b88debf8b44ef1c11ca68cda02ddcc
Etherscan - Sepolia

Coleção NFT disponível no OpenSea (testnet): https://testnets.opensea.io/collection/personagemmmorpg-3
OpenSea - Coleção

