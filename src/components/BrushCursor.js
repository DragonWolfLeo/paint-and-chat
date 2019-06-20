import React from "react";
import '../css/BrushCursor.css';
import {eventListenerSetup} from '../util/util';
class BrushCursor extends React.Component {
	constructor(props){
		super(props);
		this.state = {position: [0,0]}
	}
	// Events
	onMouseMove = event => {
		const position = this.props.getMousePosition(event, document.body);
		this.setState({position});
	}
	// Lifecycle hooks
	componentDidMount(){
		// Add mousemove event listener
		this.setup = eventListenerSetup(document.body,
			["mousemove", this.onMouseMove],
		);
		this.setup.add();
	}
	componentWillUnmount(){
		// Remove mousemove event listener
		this.setup.remove();
	}
	render(){
		const {brushSize, scale} = this.props;
		const size = Math.ceil(brushSize*scale);
		const {position} = this.state;
		return (
			<div 
				className="brushCursor"
				style={{
					left: position[0] - size/2,
					top: position[1] - size/2,
					width: `${size}px`,
					height: `${size}px`,
				}}
			/>
		);
	}
}
export default BrushCursor;