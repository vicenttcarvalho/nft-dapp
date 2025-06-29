import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import contractJson from "./contracts/PersonagemMarketplace.json";

// --- Configurações do Contrato ---
// A chave JWT da Pinata agora é lida a partir das variáveis de ambiente
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
const CONTRACT_ADDRESS = "0x5070F98092B88DEbF8B44Ef1c11Ca68cda02DDCc"; // Contrato implantado
const CONTRACT_ABI = contractJson.abi;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  // --- Estados para Mintagem ---
  const [mintImageFile, setMintImageFile] = useState(null);
  const [mintClasse, setMintClasse] = useState("");
  const [mintNivel, setMintNivel] = useState("");
  const [mintPoder, setMintPoder] = useState("");
  const fileInputRef = useRef(null); // Ref para o input de arquivo

  // --- Estados para Venda/Alterar Preço ---
  const [vendaTokenId, setVendaTokenId] = useState("");
  const [vendaPreco, setVendaPreco] = useState("");

  // --- Estados para Compra ---
  const [compraTokenId, setCompraTokenId] = useState("");
  const [compraValorPago, setCompraValorPago] = useState("");

  // --- Estados para Transferência ---
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferParaEndereco, setTransferParaEndereco] = useState("");

  // --- Estados para Visualização ---
  const [viewTokenId, setViewTokenId] = useState("");
  const [viewPersonagemData, setViewPersonagemData] = useState(null);

  // Efeito para inicializar o contrato quando o signer estiver disponível
  useEffect(() => {
    if (signer) {
      const contratoInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contratoInstance);
    }
  }, [signer]);

  // --- Funções de Conexão com a Carteira ---
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Instale MetaMask!");
      return;
    }
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const sign = await prov.getSigner();
      const userAddress = await sign.getAddress();

      setProvider(prov);
      setSigner(sign);
      setAccount(userAddress);

    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
      alert("Erro ao conectar carteira: " + error.message);
    }
  }

  // Função para desconectar/limpar a conexão
  async function disconnectWallet() {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    alert("Carteira desconectada.");
  }


  // --- FUNÇÕES PINATA ---
  // A função agora usa a constante PINATA_JWT que busca a variável de ambiente
  async function uploadImageToPinata(file) {
    if (!file) return null;
    if (!PINATA_JWT) {
      alert("Chave JWT da Pinata não encontrada. Verifique seu arquivo .env.");
      return null;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);

      const options = JSON.stringify({ cidVersion: 0 });
      formData.append('pinataOptions', options);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { "Authorization": `Bearer ${PINATA_JWT}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Pinata file upload failed: ${res.status} - ${errorData.error || res.statusText}`);
      }

      const resData = await res.json();
      return `ipfs://${resData.IpfsHash}`;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem para o Pinata:", error);
      alert("Erro ao fazer upload da imagem: " + error.message);
      return null;
    }
  }

  async function uploadJsonToPinata(metadata) {
    if (!PINATA_JWT) {
      alert("Chave JWT da Pinata não encontrada. Verifique seu arquivo .env.");
      return null;
    }
    try {
      const res = await fetch("https://api.pinata.cloud/pinning/pinJsonToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify(metadata),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Pinata JSON upload failed: ${res.status} - ${errorData.error || res.statusText}`);
      }

      const resData = await res.json();
      return `ipfs://${resData.IpfsHash}`;
    } catch (error) {
      console.error("Erro ao fazer upload do JSON de metadados para o Pinata:", error);
      alert("Erro ao fazer upload dos metadados: " + error.message);
      return null;
    }
  }

  // --- Funções de Interação com o Contrato ---

  async function handleMintPersonagem() {
    if (!contract) return alert("Conecte a carteira!");
    if (!mintImageFile || !mintClasse || !mintNivel || !mintPoder) {
      return alert("Por favor, preencha todos os campos e selecione uma imagem.");
    }

    try {
      const imageUri = await uploadImageToPinata(mintImageFile);
      if (!imageUri) return;

      const metadata = {
        name: `${mintClasse} de Nível ${mintNivel}`,
        description: `Um ${mintClasse} poderoso de nível ${mintNivel} e ${mintPoder} de poder.`,
        image: imageUri,
        attributes: [
          { trait_type: "Classe", value: mintClasse },
          { trait_type: "Nível", value: parseInt(mintNivel) },
          { trait_type: "Poder", value: parseInt(mintPoder) },
        ],
      };

      const tokenURI = await uploadJsonToPinata(metadata);
      if (!tokenURI) return;

      const tx = await contract.mintPersonagem(
        tokenURI,
        mintClasse,
        parseInt(mintNivel),
        parseInt(mintPoder)
      );
      await tx.wait();
      alert("Personagem mintado com sucesso! Tx Hash: " + tx.hash);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMintImageFile(null);
      setMintClasse("");
      setMintNivel("");
      setMintPoder("");
    } catch (error) {
      console.error("Erro ao mintar personagem:", error);
      alert("Erro ao mintar personagem: " + error.message);
    }
  }

  async function handleVenderPersonagem() {
    if (!contract) return alert("Conecte a carteira!");
    if (!vendaTokenId || !vendaPreco) {
      return alert("Por favor, preencha o Token ID e o Preço de Venda.");
    }

    try {
      const tx = await contract.venderPersonagem(
        parseInt(vendaTokenId),
        ethers.parseEther(vendaPreco)
      );
      await tx.wait();
      alert("Personagem colocado à venda!");
      setVendaTokenId("");
      setVendaPreco("");
    } catch (error) {
      console.error("Erro ao vender personagem:", error);
      alert("Erro ao vender personagem: " + error.message);
    }
  }

  async function handleAlterarPrecoPersonagem() {
    if (!contract) return alert("Conecte a carteira!");
    if (!vendaTokenId || !vendaPreco) {
      return alert("Por favor, preencha o Token ID e o Novo Preço.");
    }

    try {
      const tx = await contract.alterarPrecoPersonagem(
        parseInt(vendaTokenId),
        ethers.parseEther(vendaPreco)
      );
      await tx.wait();
      alert("Preço do personagem alterado com sucesso!");
      setVendaTokenId("");
      setVendaPreco("");
    } catch (error) {
      console.error("Erro ao alterar preço:", error);
      alert("Erro ao alterar preço: " + error.message);
    }
  }

  async function handleComprarPersonagem() {
    if (!contract) return alert("Conecte a carteira!");
    if (!compraTokenId || !compraValorPago) {
      return alert("Por favor, preencha o Token ID e o Valor a Pagar.");
    }

    try {
      const tx = await contract.comprarPersonagem(
        parseInt(compraTokenId),
        { value: ethers.parseEther(compraValorPago) }
      );
      await tx.wait();
      alert("Personagem comprado com sucesso!");
      setCompraTokenId("");
      setCompraValorPago("");
    } catch (error) {
      console.error("Erro ao comprar personagem:", error);
      alert("Erro ao comprar personagem: " + error.message);
    }
  }

  async function handleTransferirPersonagem() {
    if (!contract) return alert("Conecte a carteira!");
    if (!transferTokenId || !transferParaEndereco) {
      return alert("Por favor, preencha o Token ID e o Endereço de Destino.");
    }

    try {
      const tx = await contract.transferirPersonagem(
        transferParaEndereco,
        parseInt(transferTokenId)
      );
      await tx.wait();
      alert("Personagem transferido com sucesso!");
      setTransferTokenId("");
      setTransferParaEndereco("");
    } catch (error) {
      console.error("Erro ao transferir personagem:", error);
      alert("Erro ao transferir personagem: " + error.message);
    }
  }

  async function handleViewPersonagem() {
    if (!contract || viewTokenId === "") {
      return alert("Conecte a carteira e insira um Token ID.");
    }
    try {
      const tokenIdNum = parseInt(viewTokenId);

      const [tokenOwner, tokenURI, preco, aVenda, personagemDataFromContract] = await Promise.all([
        contract.ownerOf(tokenIdNum),
        contract.tokenURI(tokenIdNum),
        contract.precoDeVenda(tokenIdNum),
        contract.estaAVenda(tokenIdNum),
        contract.personagens(tokenIdNum),
      ]);

      const { classe, nivel, poder } = personagemDataFromContract;

      let name = "N/A", description = "N/A", image = "";

      try {
        if (tokenURI && tokenURI.startsWith("ipfs://")) {
          const httpUri = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          const response = await fetch(httpUri);
          if (response.ok) {
            const metadata = await response.json();
            name = metadata.name || name;
            description = metadata.description || description;
            image = metadata.image ? `https://ipfs.io/ipfs/${metadata.image.substring(7)}` : image;
          }
        }
      } catch (uriError) {
        console.warn("Could not fetch metadata from tokenURI:", uriError);
      }

      setViewPersonagemData({
        id: tokenIdNum,
        owner: tokenOwner,
        tokenURI: tokenURI,
        precoAtualVenda: ethers.formatEther(preco),
        estaAVenda: aVenda ? "Sim" : "Não",
        classe: classe,
        nivel: nivel.toString(),
        poder: poder.toString(),
        name: name,
        description: description,
        image: image
      });

    } catch (error) {
      console.error("Erro ao visualizar personagem:", error);
      alert("Erro ao visualizar personagem: " + error.message);
      setViewPersonagemData(null);
    }
  }

  const handleViewOnOpenSea = () => {
    if (!viewPersonagemData || viewPersonagemData.id === undefined) {
      alert("Por favor, visualize um personagem primeiro para obter seu ID.");
      return;
    }
    const openSeaUrl = `https://testnets.opensea.io/assets/sepolia/${CONTRACT_ADDRESS}/${viewPersonagemData.id}`;
    window.open(openSeaUrl, '_blank');
  };

  // --- Renderização da UI ---
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Personagem Marketplace</h1>

        {!account ? (
          <button onClick={connectWallet} style={styles.button}>Conectar Carteira</button>
        ) : (
          <div style={styles.connectedSection}>
            <p style={styles.p}>Conta conectada: <strong>{account}</strong></p>

            {/* === ÁREA DE BOTÕES DE AÇÃO GERAL === */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={disconnectWallet} style={{ ...styles.button, backgroundColor: '#dc3545' }}>
                Desconectar
              </button>

              {/* === BOTÃO ADAPTADO E INSERIDO AQUI === */}
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.etherscanButton}
              >
                Ver Contrato no Etherscan
              </a>
            </div>

            <hr style={styles.hr} />

            {/* Seção Mintar Personagem */}
            <div style={styles.section}>
              <h2>Mintar Novo Personagem</h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMintImageFile(e.target.files[0])}
                style={styles.input}
                ref={fileInputRef}
              />
              <input
                type="text" placeholder="Classe (ex: Mago)"
                value={mintClasse} onChange={(e) => setMintClasse(e.target.value)}
                style={styles.input}
              />
              <input
                type="number" placeholder="Nível"
                value={mintNivel} onChange={(e) => setMintNivel(e.target.value)}
                style={styles.input}
              />
              <input
                type="number" placeholder="Poder"
                value={mintPoder} onChange={(e) => setMintPoder(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleMintPersonagem} style={styles.button}>Mintar Personagem</button>
            </div>

            <hr style={styles.hr} />

            {/* Seção Vender/Alterar Preço */}
            <div style={styles.section}>
              <h2>Vender ou Alterar Preço</h2>
              <input
                type="number" placeholder="Token ID do Personagem"
                value={vendaTokenId} onChange={(e) => setVendaTokenId(e.target.value)}
                style={styles.input}
              />
              <input
                type="text" placeholder="Preço (ETH)"
                value={vendaPreco} onChange={(e) => setVendaPreco(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleVenderPersonagem} style={styles.button}>Colocar à Venda</button>
              <button onClick={handleAlterarPrecoPersonagem} style={{ ...styles.button, backgroundColor: '#f0ad4e' }}>Alterar Preço</button>
            </div>

            <hr style={styles.hr} />

            {/* Seção Comprar Personagem */}
            <div style={styles.section}>
              <h2>Comprar Personagem</h2>
              <input
                type="number" placeholder="Token ID do Personagem"
                value={compraTokenId} onChange={(e) => setCompraTokenId(e.target.value)}
                style={styles.input}
              />
              <input
                type="text" placeholder="Valor a Pagar (ETH)"
                value={compraValorPago} onChange={(e) => setCompraValorPago(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleComprarPersonagem} style={styles.button}>Comprar Personagem</button>
            </div>

            <hr style={styles.hr} />

            {/* Seção Transferir Personagem */}
            <div style={styles.section}>
              <h2>Transferir Personagem</h2>
              <input
                type="number" placeholder="Token ID do Personagem"
                value={transferTokenId} onChange={(e) => setTransferTokenId(e.target.value)}
                style={styles.input}
              />
              <input
                type="text" placeholder="Endereço do Destino"
                value={transferParaEndereco} onChange={(e) => setTransferParaEndereco(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleTransferirPersonagem} style={styles.button}>Transferir Personagem</button>
            </div>

            <hr style={styles.hr} />

            {/* Seção Visualizar Detalhes do Personagem */}
            <div style={styles.section}>
              <h2>Ver Detalhes do Personagem</h2>
              <input
                type="number" placeholder="Token ID do Personagem"
                value={viewTokenId} onChange={(e) => setViewTokenId(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleViewPersonagem} style={styles.button}>Ver Detalhes</button>

              {viewPersonagemData && (
                <div style={styles.card}>
                  <h3>Detalhes do Personagem ID: {viewPersonagemData.id}</h3>
                  <p style={styles.p}><strong>Nome (do URI):</strong> {viewPersonagemData.name}</p>
                  <p style={styles.p}><strong>Descrição (do URI):</strong> {viewPersonagemData.description}</p>
                  <p style={styles.p}><strong>Dono:</strong> {viewPersonagemData.owner}</p>
                  <p style={styles.p}><strong>Classe:</strong> {viewPersonagemData.classe}</p>
                  <p style={styles.p}><strong>Nível:</strong> {viewPersonagemData.nivel}</p>
                  <p style={styles.p}><strong>Poder:</strong> {viewPersonagemData.poder}</p>
                  <p style={styles.p}><strong>Preço de Venda ATUAL:</strong> {viewPersonagemData.precoAtualVenda} ETH</p>
                  <p style={styles.p}><strong>À Venda:</strong> {viewPersonagemData.estaAVenda}</p>
                  <p style={styles.p}><strong>Token URI:</strong> <a href={viewPersonagemData.tokenURI.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${viewPersonagemData.tokenURI.substring(7)}` : viewPersonagemData.tokenURI} target="_blank" rel="noopener noreferrer" style={{ color: '#8be9fd' }}>{viewPersonagemData.tokenURI}</a></p>
                  {viewPersonagemData.image && (
                    <p style={styles.p}>
                      <strong>Imagem (do URI):</strong><br />
                      <img
                        src={viewPersonagemData.image}
                        alt={`Imagem de ${viewPersonagemData.name}`}
                        style={{ maxWidth: '150px', height: 'auto', marginTop: '10px' }}
                      />
                    </p>
                  )}
                  <button onClick={handleViewOnOpenSea} style={{ ...styles.button, backgroundColor: '#28a745', marginTop: '10px' }}>
                    Visualizar no OpenSea
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos básicos 
const styles = {

  wrapper: {
    display: 'flex',
    justifyContent: 'center', // Centraliza na horizontal
    width: '100%',
    alignItems: 'flex-start',   // Alinha no topo
    minHeight: '100vh',         // Altura mínima de toda a tela
    backgroundColor: '#1a1a1a', // Cor de fundo para a página inteira
    padding: '2rem 9rem'        // Espaçamento nas bordas da tela
  },

  container: {
    fontFamily: 'Arial, sans-serif',
    width: '100%',
    maxWidth: '1500px',
    padding: '20px',
    border: '1px solid #444',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    backgroundColor: '#2e2e2e',
    color: '#f0f0f0',
    textAlign: 'left'
  },
  h1: {
    display: 'flex',
    color: '#f0f0f0',
    textAlign: 'center',
    marginBottom: '30px'
  },
  etherscanButton: {
    display: 'inline-block',
    padding: '8px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center',
    border: 'none',
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    width: '18%',
    padding: '10px 15px',
    margin: '8px 0',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center'
  },
  input: {
    padding: '10px',
    margin: '7px 0',
    borderRadius: '5px',
    border: '1px solid #666',
    width: '50%',
    backgroundColor: '#3a3a3a',
    color: '#f0f0f0'
  },
  connectedSection: {
    marginTop: '20px',
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #555',
    borderRadius: '8px',
    backgroundColor: '#3a3a3a',
    color: '#f0f0f0'
  },
  hr: {
    margin: '30px 0',
    borderTop: '1px solid #444'
  },
  card: {
    border: '1px solid #b0c4de',
    padding: '15px',
    marginTop: '15px',
    borderRadius: '8px',
    backgroundColor: '#4a4a4a',
    color: '#f0f0f0'
  },
  p: {
    color: '#f0f0f0',
    marginBottom: '10px'
  }
};

export default App;