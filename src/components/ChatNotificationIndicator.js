import React from "react";
import "../css/ChatNotificationIndicator.css";

const ChatNotificationIndicator = ({visible = true}) => {
	return visible ? <div 
		className="chatNotificationIndicator"
		title="New messages"
	/> : null;
}

export default ChatNotificationIndicator;