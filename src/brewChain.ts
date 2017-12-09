import * as Crypto from 'crypto'


class Block {
	index: number
	timestamp: number
	data: string
	previousHash: string
	nonce: number
	hash: string
}

class BrewChain {
	chain: Block[] = []
	currentBlock: Block
	genesisBlock: Block

	constructor() {
		this.genesisBlock = { 
            index: 0
		  , timestamp: 1511818270000
		  , data: 'our genesis data'
		  , previousHash: '-1'
		  , nonce: 0
		  , hash: '-1'
		};

		this.genesisBlock.hash = this.createHash(this.genesisBlock)
		this.chain.push(this.genesisBlock);
		this.currentBlock = this.genesisBlock; 
	}

	createHash(block: Block) {
		return Crypto.createHash('SHA256')
			.update(block.timestamp + block.data + block.index + block.previousHash + block.nonce)
			.digest('hex');
	}

	addToChain(block: Block){

		if(this.checkNewBlockIsValid(block, this.currentBlock)){
			this.chain.push(block);
			this.currentBlock = block; 
			return true;
		}
		
		return false;
	}

	createBlock(data: string): Block {
		let newBlock = {
		    timestamp: new Date().getTime()
		  , data: data
		  , index: this.currentBlock.index+1
		  , previousHash: this.currentBlock.hash
		  , nonce: 0
		  , hash: '-1'
		};

		newBlock = this.proofOfWork(newBlock);

		return newBlock
	}

	proofOfWork(block: Block) {

		while(true){
			block.hash = this.createHash(block);
			if(block.hash.slice(-3) === "000"){	
				return block;
			}else{
				block.nonce++;
			}
		}
	}

	 getLatestBlock() {
		return this.currentBlock;
	}

	getTotalBlocks() {
		return this.chain.length;
	}

	getChain(){
		return this.chain;
	}

	replaceChain(newChain: Block[]){
		this.chain = newChain
		this.currentBlock = this.chain[this.chain.length-1];
	}

	checkNewBlockIsValid(block: Block, previousBlock: Block){
		if(previousBlock.index + 1 !== block.index){
			//Invalid index
			return false;
		}else if (previousBlock.hash !== block.previousHash){
			//The previous hash is incorrect
			return false;
		}else if(!this.hashIsValid(block)){
			//The hash isn't correct
			return false;
		}
		
		return true;
	}	

	hashIsValid(block: Block) {
		return (this.createHash(block) == block.hash);
	}

	checkNewChainIsValid(newChain: Block[]) {
		//Is the first block the genesis block?
		if(this.createHash(newChain[0]) !== this.genesisBlock.hash ){
			return false;
		}

		let previousBlock = newChain[0];
		let blockIndex = 1;

        while(blockIndex < newChain.length){
        	let block = newChain[blockIndex];

        	if(block.previousHash !== this.createHash(previousBlock)){
        		return false;
        	}

        	if(block.hash.slice(-3) !== "000"){	
        		return false;
        	}

        	previousBlock = block;
        	blockIndex++;
        }

        return true;
	}
}

export { BrewChain, Block }