import React from "react";
import * as api from '../api/api';
import '../css/Chat.css';

// Constants
const MESSAGE_TYPES = Object.freeze({
	// Global
	USER_MESSAGE: "user_message",
	USER_JOIN: "user_join",
	// Client-only
	NEW_MESSAGE: "new_message",
});

class Node {
	constructor(value, next = null, previous = null){
		this.value = value;
		this.next = next;
		this.previous = previous;
	}
}
class LinkedList {
	constructor(){
		this.head = null;
		this.tail = null;
		this.length = 0;
	}
	append(value){
		const node = new Node(value, null, this.tail);
		if(!this.length){
			this.head = node;
		} else {
			this.tail.next = node;
		}
		this.tail = node;
		this.length++;
		return node;
	}
	prepend(value){
		const node = new Node(value, this.head);
		if(!this.length){
			this.tail = node;
		} else {
			this.head.previous = node;
		}
		this.head = node;
		this.length++;
		return node;
	}
	detach(node){
		if(!node){ return }
		const {next, previous} = node;
		node.next = null;
		node.previous = null;
		previous.next = next;
		next.previous = previous;
		return node;
	}
	toArray(){
		const arr = [];
		let next = this.head;
		while(next){
			arr.push(next.value);
			next = next.next;
		}
		return arr;
	}
}

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : new LinkedList(),
			hidden: false,
			newMessage: null,
		}
		api.onReceiveMessage((err, message) => {
			this.addMessage(message);
		});
	}
	queuedScrollDown = false;
	componentDidUpdate() {
		if(this.queuedScrollDown) {
			// Scroll to unread messages or last message
			const {chatList: {children}, newMessages} = this.refs;
			(newMessages || children[children.length-1]).scrollIntoView();
			this.queuedScrollDown = false;
		}
	}
	componentDidMount() {
		this.sendChatWidthToCanvasSpace();
	}	
	onClickSendMessage = (event) => {
		event.preventDefault();
		const {chatTextField: target} = this.refs;
		const {user} = this.props;
		if(target.value.length) {
			api.postMessage(target.value);
			if(user){
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
		const {chatLog, hidden, newMessage} = this.state;
		if(typeof(message) === "object" || message.length){
			const newState = {chatLog};
			if(hidden && !newMessage){
				const newMessage = chatLog.append({type: MESSAGE_TYPES.NEW_MESSAGE});
				Object.assign(newState,{newMessage});
			}
			chatLog.append(message);
			this.queuedScrollDown = true;
			this.setState(newState);
		}
	}
	onChangeCollapse = () => {
		const {hidden, chatLog, newMessage} = this.state;
		const newState = {hidden: !hidden};
		if(newMessage && !hidden){
			// Clear new messages when closing
			chatLog.detach(newMessage);
			Object.assign(newState, {
				newMessage: null,
				chatLog,
			});
		}
		this.setState(newState,()=>{
			this.sendChatWidthToCanvasSpace();
		});
	}
	sendChatWidthToCanvasSpace = () => {
		// Send chat width to CanvasSpace
		const {props: {getCanvasSpace}, state: {hidden}} = this;
		const canvasSpace = getCanvasSpace && getCanvasSpace();
		if(canvasSpace){
			canvasSpace.chatWidth = hidden ? 0 : 350;
		}
	}
	
	renderChat = (...chat) => chat.map((msg,i) =>
		(<ul key={i}>{
			typeof(msg) === "object" ? (()=>{
				switch(msg.type){
					case MESSAGE_TYPES.USER_MESSAGE:
						return (<div className="userMessage">
							<span className="userName" style={{
								color: msg.user && msg.user.color,
							}}>{`${msg.user && msg.user.name}: `}</span>
							{msg.message}
						</div>);
					case MESSAGE_TYPES.USER_JOIN:
						return(<div className="announcement" style={{
							color: msg.user && msg.user.color,
						}}>
							<span className="userName">{msg.user && msg.user.name}</span>
							{` has joined the room ${msg.room}.`}
						</div>);
					case MESSAGE_TYPES.NEW_MESSAGE:
						return(<div ref="newMessages" className="newMessages">
							NEW MESSAGES
						</div>);
					default:
						return null;
				}
			})() : <div className="announcement">{msg}</div>
		}</ul>));
	render(){
		const {hidden, newMessage} = this.state;
		return (
			<div className={`chatContainer chat_${hidden ? "hide" : "show"}`}>
				<div 
					className="chatCollapseBtn bg-navy"
					onClick={this.onChangeCollapse}
				>
					{hidden ? "◀" : "▶"}
					{newMessage && hidden && (<div 
						className="chatNotificationIndicator"
						title="New messages"
					></div>)}
				</div>
				<div className={`chat bg-navy flex flex-column`}>
					<h3 className="bg-white-40 dib tl ma0 pa2">Room</h3>
					<li ref="chatList" className="bg-white-70 h-100 tl overflow-y-scroll">
						{this.renderChat(...this.state.chatLog.toArray())}
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