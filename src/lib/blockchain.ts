import { ethers } from "ethers";
import { BlockchainRecord } from "./types";
import { addBlockchainRecord } from "./store";

export interface BlockchainProof {
  txHash: string;
  status: string;
  blockNumber: number;
}

const ABI = [
  {
    "name": "ProofStored",
    "type": "event",
    "inputs": [
      {
        "name": "dataHash",
        "type": "string",
        "indexed": true,
        "internalType": "string"
      },
      {
        "name": "result",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "getProof",
    "type": "function",
    "inputs": [
      {
        "name": "_dataHash",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getProofCount",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "proofKeys",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "proofs",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "dataHash",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "result",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "storeProof",
    "type": "function",
    "inputs": [
      {
        "name": "_dataHash",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_result",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];

export async function storeOnBlockchain(
  dataHash: string,
  result: string
): Promise<BlockchainProof> {
  try {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error("Missing blockchain configuration in environment variables");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    console.log(`⛓️  Sending transaction to blockchain for hash: ${dataHash}`);
    const tx = await contract.storeProof(dataHash, result);
    console.log(`⏳ Waiting for transaction confirmation: ${tx.hash}`);
    
    // Wait for 1 confirmation
    const receipt = await tx.wait();

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Persist to MongoDB
    const record: BlockchainRecord = {
      txHash: receipt.hash,
      dataHash,
      result,
      timestamp: Math.floor(Date.now() / 1000),
    };
    await addBlockchainRecord(record);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: "confirmed",
    };
  } catch (error) {
    console.error("Blockchain error:", error);
    throw error;
  }
}
