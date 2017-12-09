import { BrewChain, Block } from './brewChain'
import * as WebSocket from 'ws'

enum Event {
    REQUEST_CHAIN = "REQUEST_CHAIN",
    REQUEST_BLOCK = "REQUEST_BLOCK",
    BLOCK = "BLOCK",
	CHAIN = "CHAIN"
}

class BrewNode {
    brewSockets: WebSocket[] = []
    brewServer: WebSocket.Server
    chain = new BrewChain()
    _port : number


    constructor(port: number) {
        this._port = port
        this.brewSockets = []
        this.brewServer = new WebSocket.Server({ port: this._port })
        this.brewServer.on('connection', (connection) => {
            console.log('connection in')
            this.initConnection(connection)
        })
    }

    initConnection(connection: WebSocket) {
        console.log('init connection');

        this.messageHandler(connection);
        
        this.requestLatestBlock(connection);

        this.brewSockets = []
        this.brewSockets.push(connection);

        connection.on('error', () => this.closeConnection(connection));
        connection.on('close', () => this.closeConnection(connection));
    }

    closeConnection(connection: WebSocket) {
        console.log('closing connection');
        this.brewSockets.splice(this.brewSockets.indexOf(connection),1);
    }

    messageHandler(connection: WebSocket) {
        connection.on('message', (data: string) => {
            const msg = JSON.parse(data);
            switch(msg.event){
            	case Event.REQUEST_CHAIN:
                    connection.send(JSON.stringify({ event: Event.CHAIN, message: this.chain.getChain()}))    
                    break;                  
            	case Event.REQUEST_BLOCK:
                    this.requestLatestBlock(connection);
                    break;      
                case Event.BLOCK:
                    this.processedRecievedBlock(msg.message);
                    break;  
                case Event.CHAIN:
                    this.processedRecievedChain(msg.message);
                    break;  

                default:  
                    console.log('Unknown message ');
            }
        });
    }


    processedRecievedChain(blocks: Block[]) {
        let newChain = blocks.sort((block1, block2) => (block1.index - block2.index))

        if(newChain.length > this.chain.getTotalBlocks() && this.chain.checkNewChainIsValid(newChain)){
        	this.chain.replaceChain(newChain);
        	console.log('chain replaced');
        }
    }

    processedRecievedBlock(block: Block) {

        let currentTopBlock = this.chain.getLatestBlock();

        // Is the same or older?
        if(block.index <= currentTopBlock.index){
        	console.log('No update needed');
        	return;
        }

        //Is claiming to be the next in the chain
        if(block.previousHash == currentTopBlock.hash){
        	//Attempt the top block to our chain
        	this.chain.addToChain(block);

        	console.log('New block added');
        	console.log(this.chain.getLatestBlock());
        }else{
        	// It is ahead.. we are therefore a few behind, request the whole chain
        	console.log('requesting chain');
        	this.broadcastMessage(Event.REQUEST_CHAIN,"");
        }
    }

    requestLatestBlock(connection: WebSocket) {
        connection.send(JSON.stringify({ event: Event.BLOCK, message: this.chain.getLatestBlock()}))   
    }

    broadcastMessage(event: Event, message: string | Block) {
        this.brewSockets.forEach(node => node.send(JSON.stringify({ event, message})))
    }

    createBlock(teammember: string) {
        let newBlock = this.chain.createBlock(teammember)
        this.chain.addToChain(newBlock);

		this.broadcastMessage(Event.BLOCK, newBlock);

    }

    getStats() {
        return {
            blocks: this.chain.getTotalBlocks()
        }
    }

    addPeer(host: string, port: number) {
        let connection = new WebSocket(`ws://${host}:${port}`);

        connection.on('error', (error) =>{
            console.log(error);
        });

        connection.on('open', (_: any) =>{
            this.initConnection(connection);
        });
    }
}

export { BrewNode }