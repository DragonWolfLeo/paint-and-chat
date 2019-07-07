import React from "react";
import '../css/Chat.css';
import LinkedList from '../util/LinkedList';
import ChatList from '../components/ChatList';
import {MESSAGE_TYPES} from '../constants';
import {isDesktopMode} from '../util/util';
import ChatNotificationIndicator from "./ChatNotificationIndicator";

class Chat extends React.Component {
	constructor(){
		super();
		this.state = {
			chatLog : new LinkedList(),
			hidden: isDesktopMode() ? false : true,
			transitioning: false,
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
	onChangeCollapse = () => {
		const {hidden, chatLog, newMessage} = this.state;
		const newState = {hidden: !hidden, transitioning: true};
		if(newMessage && !hidden){
			// Clear new messages when closing
			chatLog.detach(newMessage);
			Object.assign(newState, {
				newMessage: null,
				chatLog,
			});
		}
		this.setState(newState,()=>{
			this.sendChatSizeToCanvasSpace();
			this.sendChatNotificationToButtonBar();
		});
	}
	onAnimationEnd = event => {
		this.setState({transitioning: false});
	}
	// Actions
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
			this.setState(newState, newState.newMessage && this.sendChatNotificationToButtonBar);
		}
	} 
	sendChatSizeToCanvasSpace = () => {
		// Send chat width to CanvasSpace
		const {props: {getCanvasSpace}, state: {hidden}} = this;
		const canvasSpace = getCanvasSpace && getCanvasSpace();
		if(canvasSpace){
			canvasSpace.chatState.width = hidden ? 0 : 350;
		}
	}
	sendChatNotificationToButtonBar = () => {
		// Send chat notification to buttonbar
		const {props: {getCanvasSpace}, state: {hidden, newMessage}} = this;
		const stack = ["buttonbar", "toolbox"];
		let component = getCanvasSpace && getCanvasSpace();
		// Reach buttonbar from CanvasSpace
		while(component && stack.length){
			component = component.refs[stack.pop()];
		}
		if(component && component.setChatIndicator){
			component.setChatIndicator(hidden && newMessage ? true : false);
		}
	}
	// Lifecycle hooks
	componentDidMount() {
		this.sendChatSizeToCanvasSpace();
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
		const {hidden, transitioning, newMessage} = this.state;
		// Choose class name for chat state
		const chatStateClass = transitioning ?
			`chat_${hidden ? "hide" : "show"}` :
			(hidden ? "chat_hidden" : "");
		return (
			<div onAnimationEnd={this.onAnimationEnd} className={`chatContainer ${chatStateClass}`}>
				<div 
					className="chatCollapseBtn appdarkbg dn db-ns"
					onClick={this.onChangeCollapse}
				>
					{hidden ? "◀" : "▶"}
					<ChatNotificationIndicator visible={newMessage && hidden} />
				</div>
				<div className={`chat appdarkbg flex flex-column`}>
					<div className="dib tl pa2-ns pa1 flex">
						<h3 className="ma0 f5 f4-ns" >{`Room: ${this.props.room}`}</h3>
					</div>
					<ChatList ref="chatList" chatArray={this.state.chatLog.toArray()} />
					<form className="flex pv2">
						<input ref="chatTextField" className="f4 w-100 mr1" type="text" placeholder="Chat..." autoComplete="off" defaultValue="" maxLength="1000"/> 
						<button className="w4" onClick={this.onClickSendMessage}>Send</button>
					</form>
				</div>
			</div>
		);
	}
}


export default Chat;