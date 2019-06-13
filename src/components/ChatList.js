import React from 'react';
import {MESSAGE_TYPES} from '../constants';

// Constants
class ChatList extends React.Component {
	queuedScrollDown = false;
	queueScrollDown = () => this.queuedScrollDown = true;
	componentDidUpdate() {
		if(this.queuedScrollDown) {
			// Scroll to unread messages or last message
			const {chatList: {children}, newMessages} = this.refs;
			(newMessages || children[children.length-1]).scrollIntoView();
			this.queuedScrollDown = false;
		}
	}
	render() { 
		return <li ref="chatList" className="bg-white-70 h-100 tl overflow-y-scroll">
			{this.props.chatArray.map(msg =>
				<ul key={msg.key}>{(()=>{
					switch(msg.type){
						case MESSAGE_TYPES.USER_MESSAGE:
							return <div className="userMessage">
								<span className="userName colored" style={{
									color: msg.user && msg.user.color,
								}}>{`${msg.user && msg.user.name}: `}</span>
								{msg.message}
							</div>;
						case MESSAGE_TYPES.USER_JOIN:
							return <div className="announcement colored" style={{
								color: msg.user && msg.user.color,
							}}>
								<span className="userName">{msg.user && msg.user.name}</span>
								{` joined the room.`}
							</div>;
						case MESSAGE_TYPES.USER_DISCONNECT:
							return <div className="announcement colored" style={{
								color: msg.user && msg.user.color,
							}}>
								<span className="userName">{msg.user && msg.user.name}</span>
								{` left the room.`}
							</div>;
						case MESSAGE_TYPES.NEW_MESSAGE:
							return <div ref={"newMessages"} className="newMessages">
								NEW MESSAGES
							</div>;
						default:
							return <div className="announcement">{msg.message}</div>;
					}
				})()}</ul>
			)}
		</li>
	}
}


export default ChatList;