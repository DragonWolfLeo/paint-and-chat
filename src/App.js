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
		window.history[replace ? "replaceState" : "pushState"](null, "", `/${room}`);
	}
}
const getRoomFromPathname = () => window.location.pathname.substring(1) || "";

class App extends Component {
	constructor(props){
		super(props);
		const room = getRoomFromPathname();
		this.state = {
			user: null,		
			connection: null,
			connectionActive: false,
			room,
			awaiting: room ? true : false,
		}
		setPath(room, true); // Set current history state
		if(room) this.attemptRejoinSession(room);
	}
	attemptRejoinSession = room => {
		const token =  window.sessionStorage.getItem("token"); // Get token from session storage
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
	componentDidMount() {
		window.addEventListener("popstate", this.onPopState);
	}
	onPopState = event =>{
		const room = getRoomFromPathname();
		const {connection} = this.state;
		if(room){
			if(connection) connection.disconnect(); // Close current connection if any
			this.setState({
				room,
				connection: null,
				connectionActive: false,
			},()=>{
				// Join session
				this.attemptRejoinSession(room);
			})
		} else {
			if(connection) connection.disconnect();
			this.setState({
				room: null,
				connection: null,
				connectionActive: false,
			});
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
		});
		connection.onDisconnect(()=>{
			this.setState({connectionActive: false, connection: null});
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
