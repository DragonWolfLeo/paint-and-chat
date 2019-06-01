import React, { Component } from 'react';
// import request from 'superagent';
import "tachyons";
import './css/App.css';
import {joinRoom} from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';

// window.serverUrl = "http://localhost:3001";

class App extends Component {
	constructor(){
		super();
		const connection = joinRoom("test_room");
		this.state = {
			user: null,		
			connection,
		}
		connection.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				authResponse = { error: "No response", user: {} };
			let message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: "Authentication success. Token is: " + authResponse.token;
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
		const user = (window.location.search && window.location.search.substr(1)) || "user";
		connection.authenticate(user, "test_room");
	}
	render() {
		const {connection, user} = this.state;
		return (
			<div className="App">
				{connection &&
					<React.Fragment>
						<CanvasSpace ref="canvasSpace" connection={connection}/>
						<Chat ref="chat" connection={connection} getCanvasSpace={()=>this.refs.canvasSpace} user={user} />
					</React.Fragment>
				}
			</div>
		);
	}
}

export default App;
