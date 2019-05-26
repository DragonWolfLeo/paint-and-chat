import React, { Component } from 'react';
// import request from 'superagent';
import "tachyons";
import './css/App.css';
import * as api from './api/api';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';

// window.serverUrl = "http://localhost:3001";

class App extends Component {
	constructor(){
		super();
		this.state = {
			user: null,						
			connectionActive: false,
		}
		api.onAuthenticate((err, authResponse) => {
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
			this.refs.chat.addMessage(message);
		});
		const user = (window.location.search && window.location.search.substr(1)) || "user";
		api.authenticate(user, "users_pass", "test_room");
	}
	render() {
		return (
			<div className="App">
				<CanvasSpace ref="canvasSpace"/>
				<Chat ref="chat" getCanvasSpace={()=>this.refs.canvasSpace} user={this.state.user} />
			</div>
		);
	}
}

export default App;
