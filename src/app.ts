import * as express from 'express'
import * as bodyParser from 'body-parser'
import { BrewNode } from './brewNode'

const port = 18070+Math.floor(Math.random()*30);
console.log('starting node on ', port)
let node1 = new BrewNode(port);

const http_port = 3000+Math.floor(Math.random()*10);

let BrewHTTP = function (){
	const app = express();

	app.use(bodyParser.json());

	app.get('/addNode/:port', (req, res)=>{
		console.log('add host: '+req.params.port)
		node1.addPeer('localhost', req.params.port)

		res.send();
	})

	app.get('/spawnBrew/:teammember', (req, res)=>{
		let newBlock = node1.createBlock(req.params.teammember);
		console.log('block created');
		res.send();
	})

	app.listen(http_port, () => {
		console.log(`http server up.. ${http_port}`);
	})
}

let httpserver = BrewHTTP();

