// test/PersonagemMarketplace.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.parseEther;

describe("PersonagemMarketplace", function () {
    let contrato;
    let owner, addr1, addr2;

    beforeEach(async function () {
        const PersonagemMarketplace = await ethers.getContractFactory("PersonagemMarketplace");
        [owner, addr1, addr2] = await ethers.getSigners();
        contrato = await PersonagemMarketplace.deploy();
        await contrato.waitForDeployment();
    });

    describe("Mintagem de Personagem", function () {
        const uri = "ipfs://teste.json";
        const classe = "Mago";
        const nivel = 1;
        const poder = 100;

        it("Deve mintar um personagem", async function () {
            await contrato.mintPersonagem(uri, classe, nivel, poder);

            expect(await contrato.ownerOf(0)).to.equal(owner.address);
            expect(await contrato.tokenURI(0)).to.equal(uri);

            const personagemSalvo = await contrato.personagens(0);
            expect(personagemSalvo.classe).to.equal(classe);
            expect(personagemSalvo.nivel).to.equal(nivel);
            expect(personagemSalvo.poder).to.equal(poder);

            expect(await contrato.estaAVenda(0)).to.be.false; // Não está à venda por padrão
        });
    });

    describe("Venda de Personagem", function () {
        const uri = "ipfs://teste.json";
        const classe = "Guerreiro";
        const nivel = 5;
        const poder = 120;
        const precoMint = parseEther("0"); // Não é usado, mas para consistência se fosse um campo
        const precoVenda = parseEther("1");

        beforeEach(async function () {
            // Mint sem o preço
            await contrato.mintPersonagem(uri, classe, nivel, poder);
        });

        it("Deve permitir o dono colocar à venda", async function () {
            await contrato.venderPersonagem(0, precoVenda);
            const preco = await contrato.precoDeVenda(0);
            expect(preco).to.equal(precoVenda);
            expect(await contrato.estaAVenda(0)).to.be.true;
        });

        it("Nao deve permitir que nao donos listem para venda", async function () {
            await expect(contrato.connect(addr1).venderPersonagem(0, precoVenda))
                .to.be.revertedWith("Voce nao eh o dono");
        });

        it("Nao deve permitir listar com preco zero", async function () {
            await expect(contrato.connect(owner).venderPersonagem(0, 0))
                .to.be.revertedWith("O preco deve ser maior que zero.");
        });
    });

    describe("Alterar preco", function () {
        const uri = "ipfs://teste.json";
        const classe = "Mago";
        const nivel = 1;
        const poder = 100;
        const precoVendaInicial = parseEther("1");
        const novoPreco = parseEther("2");

        beforeEach(async function () {
            await contrato.mintPersonagem(uri, classe, nivel, poder);
            await contrato.venderPersonagem(0, precoVendaInicial);
        });

        it("Deve permitir que o proprietario altere o preco", async function () {
            await contrato.alterarPrecoPersonagem(0, novoPreco);
            const preco = await contrato.precoDeVenda(0);
            expect(preco).to.equal(novoPreco);
            expect(await contrato.estaAVenda(0)).to.be.true; // Deve continuar a venda
        });

        it("Deve falhar se nao for o dono tentando alterar o preco", async function () {
            await expect(contrato.connect(addr1).alterarPrecoPersonagem(0, novoPreco))
                .to.be.revertedWith("Voce nao eh o dono deste personagem.");
        });

        it("Nao deve permitir alterar para preco zero", async function () {
            await expect(contrato.alterarPrecoPersonagem(0, 0))
                .to.be.revertedWith("O novo preco deve ser maior que zero.");
        });
    });


    describe("Compra de Personagem", function () {
        const uri = "ipfs://teste.json";
        const classe = "Mago";
        const nivel = 1;
        const poder = 100;
        const precoVenda = parseEther("1");

        beforeEach(async function () {
            // Mintagem sem preço
            await contrato.mintPersonagem(uri, classe, nivel, poder);
            await contrato.venderPersonagem(0, precoVenda);
        });

        it("Deve permitir compra por outro usuário", async function () {
            await contrato.connect(addr1).comprarPersonagem(0, { value: precoVenda });
            expect(await contrato.ownerOf(0)).to.equal(addr1.address);
            expect(await contrato.estaAVenda(0)).to.be.false; // Deve sair da venda após a compra
        });

        it("Nao deve permitir que o dono compre o proprio personagem", async function () {
            await expect(
                contrato.comprarPersonagem(0, { value: precoVenda })
            ).to.be.revertedWith("Voce ja e o dono deste personagem.");
        });

        it("Deve falhar se valor enviado for incorreto", async function () {
            await expect(
                contrato.connect(addr1).comprarPersonagem(0, { value: parseEther("0.5") })
            ).to.be.revertedWith("Valor incorreto");
        });

        it("Deve falhar se personagem nao estiver a venda", async function () {
            // Minta um novo personagem, mas NAO o lista para venda
            await contrato.mintPersonagem("ipfs://nao-venda.json", "Orc", 2, 80);
            const nonListedTokenId = 1;
            await expect(
                contrato.connect(addr1).comprarPersonagem(nonListedTokenId, { value: parseEther("1") })
            ).to.be.revertedWith("Personagem nao esta a venda");
        });
    });

    describe("Transferência", function () {
        const uri = "ipfs://teste.json";
        const classe = "Curandeiro";
        const nivel = 3;
        const poder = 70;

        beforeEach(async function () {
            await contrato.mintPersonagem(uri, classe, nivel, poder);
        });

        it("Deve permitir transferência para outro usuário", async function () {
            await contrato.transferirPersonagem(addr1.address, 0);
            expect(await contrato.ownerOf(0)).to.equal(addr1.address);
            expect(await contrato.estaAVenda(0)).to.be.false; // Nao esta a venda apos transferencia
        });

        it("Nao deve permitir transferencia para si mesmo", async function () {
            await expect(
                contrato.transferirPersonagem(owner.address, 0)
            ).to.be.revertedWith("Nao pode transferir para si mesmo.");
        });

        it("Nao deve permitir transferencia por nao-dono", async function () {
            await expect(
                contrato.connect(addr1).transferirPersonagem(addr2.address, 0)
            ).to.be.revertedWith("Apenas o dono pode transferir");
        });
        // Em "Transferência"
        it("Nao deve permitir transferencia para endereco zero", async function () {
            const zeroAddress = ethers.ZeroAddress; // ou "0x0000000000000000000000000000000000000000"
            // A sua função já tem essa verificação, então a mensagem de erro é a sua.
            await expect(
                contrato.transferirPersonagem(zeroAddress, 0)
            ).to.be.revertedWith("Endereco invalido");
        });
        // test\PersonagemMarketplace.js

        it("Nao deve permitir transferir um personagem inexistente", async function () {
            const tokenIdInexistente = 999;
            await expect(
                contrato.transferirPersonagem(addr1.address, tokenIdInexistente)
            ).to.be.revertedWithCustomError(
                contrato, // O objeto do contrato que define o erro
                "ERC721NonexistentToken" // O nome do erro customizado
            ).withArgs(tokenIdInexistente); // Opcional, mas bom: verifica se o ID do token no erro está correto
        });
    });
});