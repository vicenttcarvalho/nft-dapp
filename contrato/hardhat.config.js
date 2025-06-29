require("@nomicfoundation/hardhat-toolbox");

const { privateKey, etherscanApiKey, infuraProjectId } = require('./secrets.json');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://sepolia.infura.io/v3/${infuraProjectId}`, // URL da Infura para Sepolia
      accounts: [privateKey]
    }
  },
  etherscan: {
    apiKey: etherscanApiKey
  }
};
