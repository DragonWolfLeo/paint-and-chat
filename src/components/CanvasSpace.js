import React from "react";

class CanvasSpace extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			zoom: 0,
		}
	}
	drawing = false;
	prevPosition = null;
	// Events
	onMouseMove = event => {
		if(!this.drawing) {
			return;
		} else if (!this.prevPosition) {
			this.prevPosition = this.getMousePosition(event);
		}

		const currentPosition = this.getMousePosition(event);
		const {canvas} = this.refs;
		const ctx = canvas.getContext("2d");

		// Draw a line
		ctx.fillStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(...currentPosition);
		ctx.lineTo(...this.prevPosition);
		ctx.stroke();

		// Save current position as current
		this.prevPosition = currentPosition;
	}
	getMousePosition = event => {
		// Get mouse location
		const rect = this.refs.canvas.getBoundingClientRect();
		const scale = this.getScale();
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		return [x/scale, y/scale];
	}
	onMouseDown = event => {
		this.prevPosition = this.getMousePosition(event);
		this.drawing = true;
	}
	onMouseUp = () => {
		this.drawing = false;
	}
	onWheel = event => {
		// Only if ctrl is held
		if(!event.ctrlKey) return;

		event.preventDefault(); // Prevent scrolling
		const delta = event.deltaY/30;
		this.setState(prevState=>{
			return {zoom: prevState.zoom + delta}
		})
	}
	// Lifecycle hooks
	componentDidMount(){
		document.body.onmousemove = this.onMouseMove;
		document.body.onmouseup = this.onMouseUp;
	}
	// Other functions
	getScale = () => {
		return 2**this.state.zoom;
	}
	render(){
		return (
			<div className="canvasWindow"
				onMouseDown={this.onMouseDown}
				onWheel={this.onWheel}		
			>
				<div className="canvasSpace bg-gray">
					<canvas 
						style={{
							transform: `scale(${this.getScale()})`
						}}
						ref="canvas" 
						width={400} 
						height={400} 
					/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;