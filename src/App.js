import React, { Component } from 'react';
// import request from 'superagent';
import "tachyons";
import './css/App.css';
import CanvasSpace from './components/CanvasSpace';
import * as api from './api/api';
import Chat from './components/Chat';

// window.serverUrl = "http://localhost:3001";

class App extends Component {
	// sendTestData() {
	// 	request
	// 		.post(window.serverUrl + '/api/rate-dargon')
	// 		.send({ rating: 10 })
	// 		.set('accept', 'json')
	// 		.end((err, res) => {
	// 			console.log("Received response from PaintWebAppServer!", res);
	// 		});
	// }
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
		api.authenticate(user, "users_pass", "dargon_drawing_room");
	}
	render() {
		return (
			<div className="App">
				<div id="mainContainer">
					<CanvasSpace />
					<Chat ref="chat" user={this.state.user} />
				</div>
			</div>
		);
	}
}

export default App;
