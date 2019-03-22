import React from "react";
import * as api from '../api/api';

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : [],
			user: null,						
			connectionActive: false,
		}
		this.queuedScrollDown = true;
		api.onAuthenticate((err, authResponse) => {
			if(!authResponse)
				authResponse = { error: "No response", user: {} };
			var message = err
				? "Failed to authenticate. Error is: " + authResponse.error
				: "Authentication success. Token is: " + authResponse.token;
			this.setState({
				connectionActive: err ? false: true,
				chatLog: this.state.chatLog.concat([message]),
				user: {
					name: authResponse.user.name
				}
			});
		});
		api.onReceiveMessage((err, message) => {
			this.receiveMessage(message);
		});
		const user = (window.location.search && window.location.search.substr(1)) || "user";
		api.authenticate(user, "users_pass", "dargon_drawing_room");
	}
	componentDidUpdate() {
		if(this.queuedScrollDown) {
			document.querySelector("#chatList > ul:last-child").scrollIntoView();
			this.queuedScrollDown = false;
		}
	}
	simulateChat = (...chat) => {
		return chat.map((msg,i)=>{
			return (<ul key={i} className="stripe-dark">{msg}</ul>);
		});
	}
	onClickSendMessage = (event) => {
		event.preventDefault();
		const target = document.getElementById("chatTF");
		if(target.value.length) {
			api.postMessage(target.value);
			if(this.state.user){
				const now = new Date();
				this.receiveMessage(`${now.toLocaleDateString()} ${now.toLocaleTimeString()} ${this.state.user.name}: ${target.value}`);
			}
			target.value = "";
		}
	}
	receiveMessage = message => {
		if(message.length){
			this.state.chatLog.push(message);
			this.queuedScrollDown = true;
			this.setState({
				chatLog: this.state.chatLog,
			})
		}
	}
	render(){
		return (
			<div id="chat" className="chat bg-navy db flex flex-column overflow-hidden">
				<h3 className="bg-white-40 dib tl ma0 pa2">Dargon's Room</h3>
				<li id="chatList" className="bg-white-70 h-100 tl overflow-y-scroll">
					{this.simulateChat(...this.state.chatLog)}
				</li>
				<form className="flex bg-white-40 pv2">
					<input id="chatTF" className="f4 w-100 mr1" type="text" placeholder="Chat..." autoComplete="off" defaultValue=""/> 
					<button id="chatSendBtn" className="w4" onClick={this.onClickSendMessage}>Send</button>
				</form>
			</div>
		);
	}
}

export default Chat;