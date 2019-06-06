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
	joinRoom = (room, token) => {
		const connection = new Connection(room, token);
		connection.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				err = { error: "No response" };
			let message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: `Authentication success. Joined room: ${room}`;
			this.setState({
				connectionActive: err ? false: true,
				user: {
					name: authResponse.user.name,
					color: authResponse.user.color,
				}
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
		const user = (window.location.search && window.location.search.substr(1)) || "user";
		this.setState({connection});
	}
	componentDidMount(){
		requestCreateRoom("Test User", "#ff00ff")
		.then(({room, token}) => {
			this.joinRoom(room, token);
		})
		.catch(console.error);
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
