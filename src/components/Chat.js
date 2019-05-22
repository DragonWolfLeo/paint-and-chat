import React from "react";
import * as api from '../api/api';

// Constants
const MESSAGE_TYPES = Object.freeze({
	USER_MESSAGE: "user_message",
	USER_JOIN: "user_join",
});

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : [],
			hidden: true,
		}
		api.onReceiveMessage((err, message) => {
			this.addMessage(message);
		});
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
	renderChat = (...chat) => chat.map((msg,i) =>
		(<ul key={i} className="stripe-dark">{
			typeof(msg) === "object" ? (()=>{
				switch(msg.type){
					case MESSAGE_TYPES.USER_MESSAGE:
						return (<div>
							<span style={{
								color: msg.user && msg.user.color,
								fontWeight: "bold",
							}}>{`${msg.user && msg.user.name}: `}</span>
							{msg.message}
						</div>);
					case MESSAGE_TYPES.USER_JOIN:
						return(<div style={{
							color: msg.user && msg.user.color,
							fontStyle: "italic",
						}}>
							<b>{msg.user && msg.user.name}</b>
							{` has joined the room ${msg.room}.`}
						</div>);
					default:
						return null;
				}
			})() : msg
		}</ul>));
	
	onClickSendMessage = (event) => {
		event.preventDefault();
		const {chatTextField: target} = this.refs;
		const {user} = this.props;
		if(target.value.length) {
			api.postMessage(target.value);
			if(user){
				// const now = new Date();
				// this.addMessage(`${now.toLocaleDateString()} ${now.toLocaleTimeString()} ${user.name}: ${target.value}`);
				this.addMessage({
					type: MESSAGE_TYPES.USER_MESSAGE,
					message: target.value,
					user,
					date: new Date(),
				});
			}
			target.value = "";
		}
	}
	addMessage = message => {
		const {chatLog} = this.state;
		if(typeof(message) === "object" || message.length){
			chatLog.push(message);
			this.queuedScrollDown = true;
			this.setState({
				chatLog,
			})
		}
	}
	render(){
		return (
			<div className={`chatContainer ${this.state.hidden ? "hideChat" : "showChat"}`}>
				<div className={`chat bg-navy flex flex-column`}>
					<h3 
						className="bg-white-40 dib tl ma0 pa2"
						onClick={()=>this.setState(prevState=>({hidden: !prevState.hidden}))}
					>Dargon's Room</h3>
					<li ref="chatList" className="bg-white-70 h-100 tl overflow-y-scroll">
						{this.renderChat(...this.state.chatLog)}
					</li>
					<form className="flex bg-white-40 pv2">
						<input ref="chatTextField" className="f4 w-100 mr1" type="text" placeholder="Chat..." autoComplete="off" defaultValue=""/> 
						<button className="w4" onClick={this.onClickSendMessage}>Send</button>
					</form>
				</div>
			</div>
		);
	}
}

export default Chat;