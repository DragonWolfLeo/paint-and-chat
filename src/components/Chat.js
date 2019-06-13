import React from "react";
import '../css/Chat.css';
import LinkedList from '../util/LinkedList';
import ChatList from '../components/ChatList';
import {MESSAGE_TYPES} from '../constants';

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : new LinkedList(),
			hidden: false,
			newMessage: null,
		}
	}
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
				});
			}
			target.value = "";
			// Clear new message banner
			const {chatLog, newMessage} = this.state;
			chatLog.detach(newMessage);
			this.setState({newMessage: null, chatLog});
		}
	}
	addMessage = message => {
		const {chatLog, hidden, newMessage} = this.state;
		const m = 
			(typeof(message) === "object" && {...message}) ||
			(typeof(message) === "string" && message.length && {message}) 
		m.key = Math.random(); // Make a unique key
		if(typeof(message) === "object" || message.length){
			const newState = {chatLog};
			if(hidden && !newMessage){
				const newMessage = chatLog.append({type: MESSAGE_TYPES.NEW_MESSAGE, key: "newMessage"});
				Object.assign(newState,{newMessage});
			}
			chatLog.append(m);
			this.refs.chatList.queueScrollDown();
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
	// Rendering
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
					<h3 className="bg-white-40 dib tl ma0 pa2">{`Room: ${this.props.room}`}</h3>
					<ChatList ref="chatList" chatArray={this.state.chatLog.toArray()} />
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