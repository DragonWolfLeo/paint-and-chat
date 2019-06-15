import React, { Component, Fragment } from 'react';
import "tachyons";
import './css/App.css';
import {Connection, checkRoom} from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';
import WelcomeScreen from './components/WelcomeScreen';

// Utility functions
const setPath = (room = "", replace = false) => {
	if(window.location.pathname !== `/${room}`){
		window.history[replace ? "replaceState" : "pushState"]({room}, "", `/${room}`);
	}
}

class App extends Component {
	constructor(props){
		super(props);
		const room = window.location.pathname.substring(1) || null; // Get room from path
		const token =  window.sessionStorage.getItem("token"); // Get token from session storage
		this.state = {
			user: null,		
			connection: null,
			connectionActive: false,
			room,
			awaiting: room !== null,
		}
		if(room) {
			checkRoom(room, token).then(response=>{
				const newState = {awaiting: false};
				if(response){
					// Join room automatically if session still exists
					if(response.authorized){
						this.joinRoom({room, token});
						return; // Skip setting state
					}
				}else{
					newState.room = null;
					setPath("", true);
				}
				this.setState(newState);
			});
		}
	}
	componentDidMount() {
		window.addEventListener("popstate", this.onPopState);
	}
	onPopState = event =>{
		const room = event.state && event.state.room; 
		this.setState({room: room || null, connectionActive: room ? true : false});
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
			this.setState({connectionActive: true, awaiting: false});
			window.sessionStorage.setItem("token", token);
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
		const {connection, connectionActive, user, room, awaiting} = this.state;
		return (
			<div className={`App ${connection ? "overflowHidden": ""}`}>
				{connectionActive && connection ?
					<Fragment>
						<CanvasSpace ref="canvasSpace" connection={connection}/>
						<Chat ref="chat" connection={connection} room={room} getCanvasSpace={()=>this.refs.canvasSpace} user={user} />
					</Fragment>
					:
					<WelcomeScreen joinRoom={this.joinRoom} declineRoom={this.declineRoom} room={room} awaiting={awaiting}/>
				}
			</div>
		);
	}
}

export default App;
