import React, { Component } from 'react';
import "tachyons";
import './css/App.css';
import {Connection, requestJoinRoom, requestCreateRoom} from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';

class App extends Component {
	constructor(){
		super();
		this.state = {
			user: null,		
			connection: null,
			connectionActive: false,
		}
	}
	joinRoom = ({room, token}) => {
		const connection = new Connection(room, token);
		connection.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				err = { error: "No response" };
			let message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: `Authentication success. Joined room: ${room}`;
			this.setState({
				connectionActive: err ? false: true,
				user: {...authResponse.user}
			});
			if(this.refs.chat)
				this.refs.chat.addMessage(message);
		});
		connection.onConnect(()=>{
			this.setState({connectionActive: true});
			console.debug("Connected to server");
		});
		connection.onDisconnect(()=>{
			this.setState({connectionActive: false});
			console.debug("Disconnected from server");
		});
		this.setState({connection});
	}
	requestCreateRoom(){
		requestCreateRoom("Test User", "#ff00ff")
		.then(this.joinRoom)
		.catch(console.error);
	}
	requestJoinRoom(){
		requestJoinRoom("Test User", "#ff00ff", "room1")
		.then(this.joinRoom)
		.catch(console.error);
	}
	componentDidMount(){
		this.requestJoinRoom();
	}
	render() {
		const {connection, connectionActive, user} = this.state;
		return (
			<div className="App">
				{connectionActive && connection ?
					<React.Fragment>
						<CanvasSpace ref="canvasSpace" connection={connection}/>
						<Chat ref="chat" connection={connection} getCanvasSpace={()=>this.refs.canvasSpace} user={user} />
					</React.Fragment>
					:
					<div>Loading</div>
				}
			</div>
		);
	}
}

export default App;
