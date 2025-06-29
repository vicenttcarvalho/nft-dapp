// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PersonagemMarketplace is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 0;

    mapping(uint256 => uint256) public precoDeVenda;
    mapping(uint256 => bool) public estaAVenda;

    event PersonagemMintado(
        uint256 indexed tokenId,
        address owner,
        string tokenURI
    );
    event PersonagemColocadoAVenda(uint256 indexed tokenId, uint256 preco);
    event PersonagemComprado(uint256 indexed tokenId, address novoDono);
    event PersonagemTransferido(address de, address para, uint256 tokenId);
    event PrecoAlterado(uint256 indexed tokenId, uint256 novoPreco);

    constructor() ERC721("PersonagemMMORPG", "PMM") Ownable(msg.sender) {}

    struct Personagem {
        string classe;
        uint256 nivel;
        uint256 poder;
    }

    mapping(uint256 => Personagem) public personagens;

    function mintPersonagem(
        string memory tokenURI,
        string memory classe,
        uint256 nivel,
        uint256 poder
    ) public {
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        personagens[tokenId] = Personagem(classe, nivel, poder);

        // O preço e o status de venda serão definidos na função venderPersonagem
        estaAVenda[tokenId] = false; // Personagem não está à venda por padrão após o mint

        emit PersonagemMintado(tokenId, msg.sender, tokenURI);
        nextTokenId++;
    }

    function venderPersonagem(uint256 tokenId, uint256 preco) public {
        require(ownerOf(tokenId) == msg.sender, "Voce nao eh o dono");
        require(preco > 0, "O preco deve ser maior que zero.");

        precoDeVenda[tokenId] = preco;
        estaAVenda[tokenId] = true;

        emit PersonagemColocadoAVenda(tokenId, preco);
    }

    // Função para alterar o preço do personagem
    function alterarPrecoPersonagem(uint256 tokenId, uint256 novoPreco) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Voce nao eh o dono deste personagem."
        );
        require(novoPreco > 0, "O novo preco deve ser maior que zero.");

        precoDeVenda[tokenId] = novoPreco;
        estaAVenda[tokenId] = true;

        emit PrecoAlterado(tokenId, novoPreco);
    }

    function comprarPersonagem(uint256 tokenId) public payable {
        require(estaAVenda[tokenId], "Personagem nao esta a venda");
        require(msg.value == precoDeVenda[tokenId], "Valor incorreto");

        address vendedor = ownerOf(tokenId);
        require(vendedor != msg.sender, "Voce ja e o dono deste personagem.");

        _transfer(vendedor, msg.sender, tokenId);
        payable(vendedor).transfer(msg.value);

        estaAVenda[tokenId] = false;
        emit PersonagemComprado(tokenId, msg.sender);
    }

    function transferirPersonagem(address para, uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Apenas o dono pode transferir"
        );
        require(para != address(0), "Endereco invalido");
        require(para != ownerOf(tokenId), "Nao pode transferir para si mesmo.");

        _transfer(msg.sender, para, tokenId);
        estaAVenda[tokenId] = false;

        emit PersonagemTransferido(msg.sender, para, tokenId);
    }
}
