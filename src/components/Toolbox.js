import React from "react";
import '../css/Toolbox.css'
const brushSizes = [24, 16, 12, 8, 4];
class Toolbox extends React.Component {
	onSizeInputChange = event => {
		const {target} = event;
		if(target.checkValidity())
			this.props.setBrushSize(Number(target.value));
	}
	onBrushSizeChange = size => {
		this.updateInputBrushSize(size);
		this.props.setBrushSize(size);
	}
	updateInputBrushSize = size => this.refs.sizeInput.value = size || this.props.brushSize;
	componentDidMount(){
		this.updateInputBrushSize();
	}
	render(){
		const {brushSize, brushColor} = this.props;
		return (
			<div className="toolbox applightbg flex flex-column items-center black">
				<button className="mv3 black"><ion-icon name="ios-save" size="large"/></button>
				<h5 className="appdarkbg w-100 white ma0 mb2 pv1">Size</h5>
				{brushSizes.map(size=>{
					return <BrushIcon key={size} size={size} selected={brushSize===size} setBrushSize={this.onBrushSizeChange}/>
				})}
				<input ref="sizeInput" className="w-100 tc" type="number" max="100" min="1" onChange={this.onSizeInputChange}/>
			</div>
		);
	}
}
const BrushIcon = ({size, selected, setBrushSize}) => {
	const width = `${size}px`, height = width;
	return (
		<div className="h2 w-100 mb1" onClick={()=>setBrushSize(size)}>
			<div className={`brushIcon br2 h-100 flex justify-center items-center mh1 ${selected ? "selected" : ""}`}>
				<div 
					className="br-100 bg-black"
					style={{width,height}}
				/>
			</div>
		</div>
	)
}
export default Toolbox;