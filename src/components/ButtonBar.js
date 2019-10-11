import React from "react";
import "../css/ButtonBar.css";
import {TOOLS, BUTTONBAR_ACTIONS} from "../constants";
import ChatNotificationIndicator from "./ChatNotificationIndicator";

class ButtonBar extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			chatIndicator: false,
		};
	}
	setChatIndicator = visible => {
		if(visible !== this.state.chatIndicator){
			this.setState({chatIndicator: visible});
		}
	}
	render(){
		const {tool, onButtonBar} = this.props;
		return (
			<div className="buttonBar fixed absolute-ns black w-100 flex justify-between">
				<div className="flex flex-column">
					<button 
						title="Save Image" 
						onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.SAVE)}
					>
						<ion-icon name="ios-save" size="large"/>
					</button>
					<button 
						title="Open Image" 
						onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.OPEN)}
					>
						<ion-icon name="md-open" size="large"/>
					</button>
					<button 
						title="Resize" 
						onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.RESIZE)}
					>
						<ion-icon name="md-expand" size="large"/>
					</button>
					<button 
						title="Pick Color" 
						onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.COLOR_PICK)}
						className={tool === TOOLS.COLOR_PICK ? "active" : ""}
					>
						<ion-icon name="md-color-filter" size="large"/>
					</button>
				</div>
				<div>
					<button 
						title="Show Chat" 
						onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.CHAT)} 
						className="dn-ns relative static-ns"
					>
						<ChatNotificationIndicator visible={this.state.chatIndicator} />
						<ion-icon name="ios-chatboxes" size="large"/>
					</button>
				</div>
			</div>
		);
	}
}
export default ButtonBar;