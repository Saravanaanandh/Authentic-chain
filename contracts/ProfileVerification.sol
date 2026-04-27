// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProfileVerification
 * @dev Stores verification proof on-chain.
 *      Only the data hash, result, and timestamp are stored —
 *      never the full profile data.
 */
contract ProfileVerification {

    struct ProfileProof {
        string dataHash;
        string result;
        uint256 timestamp;
    }

    mapping(string => ProfileProof) public proofs;
    string[] public proofKeys;

    event ProofStored(string indexed dataHash, string result, uint256 timestamp);

    /**
     * @dev Store a new verification proof.
     * @param _dataHash  SHA-256 hash of the full profile data
     * @param _result    Classification result (REAL / SUSPICIOUS / FAKE)
     */
    function storeProof(string memory _dataHash, string memory _result) public {
        proofs[_dataHash] = ProfileProof({
            dataHash: _dataHash,
            result: _result,
            timestamp: block.timestamp
        });
        proofKeys.push(_dataHash);
        emit ProofStored(_dataHash, _result, block.timestamp);
    }

    /**
     * @dev Retrieve a stored proof by its data hash.
     */
    function getProof(string memory _dataHash)
        public
        view
        returns (string memory, string memory, uint256)
    {
        ProfileProof memory p = proofs[_dataHash];
        return (p.dataHash, p.result, p.timestamp);
    }

    /**
     * @dev Return the total number of proofs stored.
     */
    function getProofCount() public view returns (uint256) {
        return proofKeys.length;
    }
}
