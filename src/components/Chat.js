import React from "react";
import '../css/Chat.css';
import LinkedList from '../util/LinkedList';

// Constants
const MESSAGE_TYPES = Object.freeze({
	// Global
	USER_MESSAGE: "user_message",
	USER_JOIN: "user_join",
	// Client-only
	NEW_MESSAGE: "new_message",
});


class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : new LinkedList(),
			hidden: false,
			newMessage: null,
		}
	}
	queuedScrollDown = false;
	// Event handlers
	onClickSendMessage = (event) => {
		event.preventDefault();
		const {chatTextField: target} = this.refs;
		const {user, connection} = this.props;
		if(target.value.length) {
			connection.postMessage(target.value);
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
	// Lifecycle hooks
	componentDidMount() {
		this.sendChatWidthToCanvasSpace();
		this.eventListenerSetup = this.props.connection.onReceiveMessageSetup(this.addMessage);
		// Add event listeners
		this.eventListenerSetup.add();
	}
	componentWillUnmount(){
		// Remove event listeners
		if(this.eventListenerSetup) this.eventListenerSetup.remove();
	}
	componentDidUpdate() {
		if(this.queuedScrollDown) {
			// Scroll to unread messages or last message
			const {chatList: {children}, newMessages} = this.refs;
			(newMessages || children[children.length-1]).scrollIntoView();
			this.queuedScrollDown = false;
		}
	}
	// Rendering
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