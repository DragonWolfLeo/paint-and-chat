import React from "react";
import * as api from '../api/api';

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : [],
		}
	}
	queuedScrollDown = false;
	componentDidUpdate() {
		// Scroll last message into view
		if(this.queuedScrollDown) {
			const {children} = this.refs.chatList;
			children[children.length-1].scrollIntoView();
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
		const {user} = this.props;
		if(target.value.length) {
			api.postMessage(target.value);
			if(user){
				const now = new Date();
				this.addMessage(`${now.toLocaleDateString()} ${now.toLocaleTimeString()} ${user.name}: ${target.value}`);
			}
			target.value = "";
		}
	}
	addMessage = message => {
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
			<div className="chat bg-navy flex flex-column overflow-hidden">
				<h3 className="bg-white-40 dib tl ma0 pa2">Dargon's Room</h3>
				<li ref="chatList" className="bg-white-70 h-100 tl overflow-y-scroll">
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