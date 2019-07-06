import React from "react";
import "../css/ButtonBar.css";
import {TOOLS, BUTTONBAR_ACTIONS} from "../constants";

const ButtonBar = props => {
	const {tool, onButtonBar} = props;
	return (
		<div className="buttonBar fixed absolute-ns black flex flex-column">
			<button 
				title="Save Image" 
				onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.SAVE)}
			>
				<ion-icon name="ios-save" size="large"/>
			</button>
			<button 
				title="Pick Color" 
				onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.COLOR_PICK)}
				className={tool === TOOLS.COLOR_PICK ? "active" : ""}
			>
				<ion-icon name="md-color-filter" size="large"/>
			</button>
			<button 
				title="Show Chat" 
				onClick={()=>onButtonBar(BUTTONBAR_ACTIONS.CHAT)} 
				className="dn-ns"
			>
				<ion-icon name="ios-chatboxes" size="large"/>
			</button>
		</div>
	);
}

export default ButtonBar;