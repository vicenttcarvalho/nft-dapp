# Plataforma NFT com Integração Blockchain

Este repositório contém o código-fonte completo do projeto desenvolvido como parte do Trabalho Final da disciplina Tópicos em Computação Aplicada, envolvendo a criação de uma aplicação descentralizada (dApp) com front-end web e contratos inteligentes em Solidity. O objetivo do projeto é permitir a criação, visualização, filtragem e negociação de NFTs em um ambiente gamificado com integração à blockchain.


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
- Hardhat (`npm install --save-dev hardhat`)
- Git

### 1. Clonar o repositório

git clone https://github.com/vicenttcarvalho/nft-dapp.git
cd nft-dapp


### 2. Instalar as dependências
cd contrato
npm install

### 3. Compilar os contratos
npx hardhat compile

### 4. Executar os testes
npx hardhat test

### 5. Rodar o front-end
cd ../frontend/personagem-marketplace
npm install
npm run dev

🔗 Deploy e Visualização
Contrato implantado na rede de testes Sepolia: https://sepolia.etherscan.io/address/0x5070f98092b88debf8b44ef1c11ca68cda02ddcc
Etherscan - Sepolia

Coleção NFT disponível no OpenSea (testnet): https://testnets.opensea.io/collection/personagemmmorpg-3
OpenSea - Coleção

