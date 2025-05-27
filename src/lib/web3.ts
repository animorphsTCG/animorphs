
// Web3 and NFT Integration for Polygon Network
// Contract address: 0xb08882e1804B444171B560Cf7cEe99aDD26f7f62

export interface NFTMetadata {
  token_id: number;
  name: string;
  description: string;
  image: string;
  attributes: {
    element: string;
    power: number;
    health: number;
    attack: number;
    sats: number;
    size: number;
    rarity: string;
  };
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

class Web3Manager {
  private contractAddress = '0xb08882e1804B444171B560Cf7cEe99aDD26f7f62';
  private polygonRPC = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com';
  private connection: WalletConnection | null = null;

  async connectWallet(): Promise<WalletConnection> {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure MetaMask is unlocked.');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      // Check if connected to Polygon
      const polygonChainId = '0x89'; // Polygon Mainnet
      if (chainId !== polygonChainId) {
        try {
          // Try to switch to Polygon
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: polygonChainId }],
          });
        } catch (switchError: any) {
          // If Polygon is not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: polygonChainId,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      this.connection = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };

      console.log('Wallet connected:', this.connection);
      return this.connection;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.connection = null;
    console.log('Wallet disconnected');
  }

  getConnection(): WalletConnection | null {
    return this.connection;
  }

  async getUserNFTs(walletAddress: string): Promise<number[]> {
    try {
      console.log(`Fetching NFTs for address: ${walletAddress}`);
      
      // TODO: Implement actual ERC-1155 contract reading
      // This requires Web3.js or ethers.js integration
      
      // Placeholder implementation - in production, this would:
      // 1. Connect to Polygon RPC
      // 2. Create contract instance with ABI
      // 3. Call balanceOfBatch or similar method
      // 4. Return array of token IDs owned by the user
      
      // Mock data for development
      const mockTokenIds: number[] = [];
      
      // Simulate some owned tokens for demo
      if (walletAddress.toLowerCase().includes('demo')) {
        mockTokenIds.push(1, 5, 10, 15, 20); // Mock Fire cards
        mockTokenIds.push(25, 30, 35, 40, 45); // Mock Water cards
      }

      console.log(`Found ${mockTokenIds.length} NFTs for ${walletAddress}`);
      return mockTokenIds;
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      throw error;
    }
  }

  async loadNFTMetadata(): Promise<NFTMetadata[]> {
    try {
      // TODO: Load NFT metadata from JSON file
      // The metadata file should be placed at /public/nft-metadata.json
      // and contain mapping of token_id to card attributes
      
      console.log('Loading NFT metadata...');
      
      try {
        const response = await fetch('/nft-metadata.json');
        if (response.ok) {
          const metadata = await response.json();
          console.log(`Loaded metadata for ${metadata.length} NFTs`);
          return metadata;
        }
      } catch (fetchError) {
        console.log('NFT metadata file not found, using mock data');
      }

      // Mock metadata for development
      const mockMetadata: NFTMetadata[] = [];
      
      // Generate mock metadata for 200 cards (40 per element)
      const elements = ['Fire', 'Water', 'Ice', 'Ground', 'Electric'];
      const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
      
      for (let i = 1; i <= 200; i++) {
        const elementIndex = Math.floor((i - 1) / 40);
        const element = elements[elementIndex];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        
        mockMetadata.push({
          token_id: i,
          name: `${element} Creature #${i}`,
          description: `A powerful ${element.toLowerCase()} elemental creature.`,
          image: `/cards/card-${i}.png`, // TODO: Add actual card images
          attributes: {
            element,
            power: Math.floor(Math.random() * 100) + 50,
            health: Math.floor(Math.random() * 100) + 50,
            attack: Math.floor(Math.random() * 50) + 25,
            sats: Math.floor(Math.random() * 10) + 1,
            size: Math.floor(Math.random() * 5) + 1,
            rarity,
          },
        });
      }

      return mockMetadata;
    } catch (error) {
      console.error('Failed to load NFT metadata:', error);
      throw error;
    }
  }

  // Utility function to check if token is owned
  async isTokenOwned(walletAddress: string, tokenId: number): Promise<boolean> {
    try {
      const ownedTokens = await this.getUserNFTs(walletAddress);
      return ownedTokens.includes(tokenId);
    } catch (error) {
      console.error('Failed to check token ownership:', error);
      return false;
    }
  }

  // Function to transfer NFTs (for deck purchases)
  async transferNFTs(toAddress: string, tokenIds: number[]): Promise<string> {
    try {
      console.log(`Transferring ${tokenIds.length} NFTs to ${toAddress}`);
      
      // TODO: Implement actual NFT transfer using backend wallet
      // This would typically be done server-side for security
      
      // Mock transaction hash
      const txHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;
      
      console.log(`NFT transfer successful. Transaction hash: ${txHash}`);
      return txHash;
    } catch (error) {
      console.error('Failed to transfer NFTs:', error);
      throw error;
    }
  }
}

export const web3Manager = new Web3Manager();

// Utility function to format wallet address
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Utility function to get Polygon explorer URL
export const getPolygonExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx'): string => {
  return `https://polygonscan.com/${type}/${hash}`;
};

// Type declaration for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}
