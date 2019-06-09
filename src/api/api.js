import io from 'socket.io-client';
import {eventListenerSetup} from '../util/util';

// Constants
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

// Exports
class Connection {
    constructor(room, token) {
        this.socket = io.connect(`${SERVER_URL}/${room}`);
        this.token = token;
    }
    // Adding event listeners
    onConnect = cb => {
        this.socket.on("connect", cb);
        // Authenticate
        this.socket.emit("auth", this.token);
    };
    onDisconnect = cb => {
        this.socket.on("disconnect", cb);
    };
    onAuthenticate = cb => {
        this.socket.on("auth", authResponse => {
            if (authResponse.error)
                cb("Failed to authenticate: " + authResponse.error, null);
            else
                cb(null, authResponse);
        });
    };

    // Sets of functions to add and remove event listeners
    onReceiveMessageSetup = cb => eventListenerSetup(this.socket, ["message", cb]);
    onCanvasSetup = cb => eventListenerSetup(this.socket, ["canvas", cb]);
    
    // Event emitters
    postMessage = text => {
        this.socket.emit("message", text);
    };
    sendCanvas = data => this.socket.emit("canvas", data);
}
const roomCall = (url, userProfile) => {
    return fetch(url,{
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      })
    .then(res=>res.json())
    .catch(console.error);
};
const requestJoinRoom = (name, color, room) => roomCall(`${SERVER_URL}/join/${room}`, {name, color});
const requestCreateRoom = (name, color) => roomCall(`${SERVER_URL}/create`, {name, color});
export {
    Connection,
    requestJoinRoom,
    requestCreateRoom,
};