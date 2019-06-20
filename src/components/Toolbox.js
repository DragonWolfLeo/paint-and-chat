import React from "react";
import '../css/Toolbox.css'
const brushSizes = [24, 16, 12, 8, 4];
class Toolbox extends React.Component {
	// Setting the brush size number input
	onSizeInputChange = event => {
		const {target} = event;
		if(target.checkValidity())
			this.props.setBrushSize(Number(target.value));
	}
	// Selecting a brush size button
	onBrushSizeButton = size => {
		this.updateInputBrushSize(size);
		this.props.setBrushSize(size);
	}
	// Set the value of the brush size number input
	updateInputBrushSize = size => this.refs.sizeInput.value = size || this.props.brushSize;
	// Setting the brush color input
	onSetBrushColor = isAlt => event => this.props.setBrushColor(event.target.value, isAlt);
	// Set the value of the brush color input
	updateInputBrushColor = (color, isAlt) => this.refs[`color${isAlt?2:1}Input`].value = color || this.props[isAlt ? "brushColor" : "brushColorAlt"];
	componentDidMount(){
		// Set initial values of input
		this.updateInputBrushSize();
		this.updateInputBrushColor(null, false);
		this.updateInputBrushColor(null, true);
	}
	render(){
		const {brushSize, brushColor, brushColorAlt, saveCanvas} = this.props;
		return (
			<div className="toolbox applightbg flex flex-column items-center black">
				<button className="mv2 black" onClick={saveCanvas}>
					<ion-icon name="ios-save" size="large"/>
				</button>
				<Section label="Size">
					{brushSizes.map(size=>{
						return <BrushIcon key={size} size={size} selected={brushSize===size} setBrushSize={this.onBrushSizeButton}/>
					})}
					<input ref="sizeInput" className="w-100 tc" type="number" max="100" min="1" onChange={this.onSizeInputChange}/>
				</Section>
				<Section label="Color 1" nomargin>
					<label className="db w-100 h2" style={{
						backgroundColor: brushColor,
					}}>
						<input ref="color1Input" className="dn colorInput w-100" type="color" onChange={this.onSetBrushColor(false)}/>
					</label>
				</Section>
				<Section label="Color 2" nomargin>
					<label className="db w-100 h2" style={{
						backgroundColor: brushColorAlt,
					}}>
						<input ref="color2Input" className="colorInput dn w-100" type="color" onChange={this.onSetBrushColor(true)}/>
					</label>
				</Section>
			</div>
		);
	}
}
const Section = ({label, children, nomargin}) => {
	const marginclass = nomargin ? "" : "mb2";
	return <div className={`w-100 ${marginclass}`}>
		{label && <h5 className={`appdarkbg w-100 bt bb b--black white pv1 ma0 ${marginclass}`}>{label}</h5>}
		{children}
	</div>
}
// Brush selection button
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