import React, { Component, Fragment } from 'react';
import "tachyons";
import './css/App.css';
import {Connection} from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';
import WelcomeScreen from './components/WelcomeScreen';

class App extends Component {
	constructor(){
		super();
		this.state = {
			user: null,		
			connection: null,
			connectionActive: false,
			room: null,
		}
	}
	joinRoom = ({room, token}) => {
		const connection = new Connection(room, token);
		connection.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				err = { error: "No response" };
			const {user} = authResponse;
			let message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: `Welcome, ${user.name}! To invite your friends, give them this room ID: ${room}`;
			this.setState({
				connectionActive: err ? false: true,
				user,
				room,
			});
			if(this.refs.chat)
				this.refs.chat.addMessage(message);
		});
		connection.onConnect(()=>{
			this.setState({connectionActive: true});
			console.debug("Connected to server");
		});
		connection.onDisconnect(()=>{
			this.setState({connectionActive: false, connection: null});
			console.debug("Disconnected from server");
		});
		this.setState({connection});
	}
	render() {
		const {connection, connectionActive, user, room} = this.state;
		return (
			<div className={`App ${connection ? "overflowHidden": ""}`}>
				{connectionActive && connection ?
					<Fragment>
						<CanvasSpace ref="canvasSpace" connection={connection}/>
						<Chat ref="chat" connection={connection} room={room} getCanvasSpace={()=>this.refs.canvasSpace} user={user} />
					</Fragment>
					:
					<WelcomeScreen joinRoom={this.joinRoom}/>
				}
			</div>
		);
	}
}

export default App;
