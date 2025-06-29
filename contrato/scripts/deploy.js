// scripts/deploy.js

const hre = require("hardhat");

async function main() {
    // 1. Obter a Factory do Contrato
    // Use "PersonagemMarketplace" pois é o nome do seu contrato Solidity
    const PersonagemMarketplaceFactory = await hre.ethers.getContractFactory("PersonagemMarketplace");

    // 2. Implantar o Contrato
    // Seu construtor PersonagemMarketplace() não recebe argumentos, então não passamos nada aqui.
    const personagemMarketplace = await PersonagemMarketplaceFactory.deploy();

    // 3. Esperar pela Confirmação do Deploy (Ethers.js v6)
    // O .deployed() é para Ethers v5. Para v6, usamos waitForDeployment().
    await personagemMarketplace.waitForDeployment();

    // 4. Obter o Endereço do Contrato Implantado
    const contractAddress = await personagemMarketplace.getAddress();
    console.log(`PersonagemMarketplace implantado em: ${contractAddress}`);

    // 5. Verificar o Contrato no Etherscan (Recomendado)
    // Usamos hre.run para o plugin de verificação do Hardhat.
    // O objeto constructorArguments deve estar vazio se seu construtor não recebe parâmetros.
    console.log("Verificando contrato...");
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [], // Seu construtor não tem argumentos
            // Opcional: Especificar o contrato se você tiver vários arquivos .sol
            // contract: "contracts/PersonagemMarketplace.sol:PersonagemMarketplace"
        });
        console.log("Contrato verificado com sucesso!");
    } catch (error) {
        if (error.message.includes("Reason: Already Verified")) {
            console.log("Contrato já verificado.");
        } else {
            console.error("Erro na verificação do contrato:", error);
        }
    }
}

// 6. Tratar Erros na Função Main
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});