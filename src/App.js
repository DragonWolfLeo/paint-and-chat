import React, { Component, Fragment } from 'react';
import "tachyons";
import './css/App.css';
import {Connection, checkRoom} from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';
import WelcomeScreen from './components/WelcomeScreen';

// Utility functions
const setPath = (room = "", replace = false) => 
	window.history[replace ? "replaceState" : "pushState"]({room}, "", `/${room}`);

class App extends Component {
	constructor(props){
		super(props);
		const room = window.location.pathname.substring(1) || null; // Get room from path
		this.state = {
			user: null,		
			connection: null,
			connectionActive: false,
			room,
		}
		if(room) checkRoom(room).then(exists=>{
			if(exists){
				// Join room automatically if session still exists
			}else{
				setPath(true);
			}
		});
	}
	componentDidMount() {
	}
	joinRoom = ({room, token}) => {
		const connection = new Connection(room, token);
		connection.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				err = { error: "No response" };
			const {user} = authResponse;
			let message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: `Welcome, ${user.name}! To invite your friends, share the URL.`;
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
		this.setState({connection},()=>setPath(room));
	}
	declineRoom = () => {
		this.setState({room: null},()=>setPath());
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
					<WelcomeScreen joinRoom={this.joinRoom} declineRoom={this.declineRoom}room={room}/>
				}
			</div>
		);
	}
}

export default App;
