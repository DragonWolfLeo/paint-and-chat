import React from "react";

class CanvasSpace extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			nativeWidth: 400,
			nativeHeight: 400,
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
	
		// TODO: Get window to scroll towards the position of the mouse
		// const e = {...event};
		// console.log(e.clientX, e.clientY, e.currentTarget.scrollLeftMax, e.currentTarget.scrollTopMax);
		// const {currentTarget: target} = event;
		// target.scrollLeft = target.scrollLeftMax;
		// target.scrollTop = target.scrollTopMax;
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
		const {nativeWidth, nativeHeight} = this.state;
		const scale = this.getScale();
		return (
			<div className="canvasWindow"
				onMouseDown={this.onMouseDown}
				onWheel={this.onWheel}		
			>
				<div className="canvasSpace bg-gray">
					<canvas 
						style={{
							width: nativeWidth * scale,
							height: nativeHeight * scale,
						}}
						ref="canvas" 
						width={nativeWidth} 
						height={nativeHeight} 
					/>
				</div>
			</div>
		);
	}
}

export default CanvasSpace;