// Dependencies
import {Server as WebSocketServer} from 'ws';

// Enums
import {INIT, ICE_CANDIDATE, OFFER, ANSWER, PEERS_LIST} from '../messages';

// Config
const {SERVER_PORT} = process.env;

const webSocketServer = new WebSocketServer({port: SERVER_PORT});
const connectedPeersWebSockets = new Map();

// Web socket server
webSocketServer.on('connection', webSocket => {
    console.log('New client connection');
    webSocket.on('message', message => {
        const parsedMessage = JSON.parse(message);
        messageHandler(webSocket, parsedMessage);
    });
    webSocket.on('close',() => {
        console.log(`Client disconnected ${webSocket.id}`);
        connectedPeersWebSockets.delete(webSocket.id);
    });
});

// Message dispatcher
const messageHandler = (webSocket, message) => {
    const {type} = message;
    switch (type) {
        case INIT:
            initHandler(webSocket, message);
            break;
        default:
            transitHandler(message);
            break;
    }
}

// Init handler
const initHandler = (webSocket, message) => {
    const {source} = message;
    console.log(`Init from peer ${source}`);
    webSocket.id = source;

    // Send all the connected peers ids (question 1)
    const peersList = [];
    for (let peerId of connectedPeersWebSockets.keys()) {
        peersList.push(peerId);
    }
    webSocket.send(JSON.stringify({
        type: PEERS_LIST,
        destination: source,
        [PEERS_LIST]: peersList
    }));
    connectedPeersWebSockets.set(source, webSocket);
}

const transitHandler = message => {
    console.log(`Transiting message from source ${message.source} to destination ${message.destination}, of type ${message.type}`);
    const destinationWebSocket = connectedPeersWebSockets.get(message.destination);
    destinationWebSocket.send(JSON.stringify(message));
}

const iceCandidateHandler = ({id: source}, message) => {
    const ICECandidate = message[ICE_CANDIDATE];
    const {destination} = message;
    console.log(`ICE Candidate from peer ${source} to peer ${destination}`);
    const destinationWebSocket = connectedPeersWebSockets.get(destination);
    destinationWebSocket.send(JSON.stringify({
        type: ICE_CANDIDATE,
        ICECandidate,
        source
    }));
}

console.log(`WebSocket server started on port ${SERVER_PORT}`);
