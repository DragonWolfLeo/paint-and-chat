import React from "react";
import '../css/Toolbox.css'
import Palette from "./Palette";
import {MIN_BRUSH_SIZE, MAX_BRUSH_SIZE} from '../constants';
import ButtonBar from "./ButtonBar";

const BRUSH_SIZES = Object.freeze([24, 16, 12, 8, 4]);

class Toolbox extends React.Component {
	// Setting the brush size number input
	onSizeInputChange = event => {
		const {target} = event;
		let value = Number(target.value);
		if(!target.checkValidity()) {
			 // Check if this is a number; return if not
			if(!value) return;
			// Clamp within range if invalid
			const min = Number(target.min);
			const max = Number(target.max);
			value = value > max ? max : min;
		}
		this.props.setBrushSize(value);
	}
	// Losing focus on brush input
	onSizeInputBlur = event => {
		// Revert to current brush size
		if(!event.target.checkValidity())
			return this.updateInputBrushSize();
	}
	// Selecting a brush size button
	onBrushSizeButton = size => {
		this.updateInputBrushSize(size);
		this.props.setBrushSize(size);
	}
	// Set the value of the brush size number input
	updateInputBrushSize = size => this.refs.sizeInput.value = size || this.props.brushSize;
	// Set the value of the brush color input
	updateInputBrushColor = (color, isAlt) => this.refs[`color${isAlt?2:1}Input`].value = color || this.props[`brushColor${isAlt?"Alt":""}`];
	// Setting the brush color input
	onSetBrushColor = isAlt => event => this.props.setBrushColor(event.target.value, isAlt);
	// Selecting a brush color from the palette
	choosePaletteColor = (color, isAlt) => {
		this.props.setBrushColor(color, isAlt);
		this.updateInputBrushColor(color, isAlt);
	};
	// Lifecycle hooks
	componentDidMount(){
		// Set initial values of input
		this.updateInputBrushSize();
	}
	render(){
		const {brushSize, brushColor, brushColorAlt, onButtonBar, tool} = this.props;
		return (
			<div ref="element" className="toolbox black">
				<ButtonBar ref="buttonbar" onButtonBar={onButtonBar} tool={tool} />
				<div className={"h-100-ns flex flex-wrap flex-nowrap-ns flex-column-ns overflow-y-auto-ns applightbg items-center"}>
					<Section label="Size">
						<div className="brushSectionContent flex flex-column-ns pl1 pl0-ns">
							{BRUSH_SIZES.map(size=>{
								return <BrushIcon key={size} size={size} selected={brushSize===size} setBrushSize={this.onBrushSizeButton}/>
							})}
							<input 
								ref="sizeInput" 
								className="w-100-ns w3 tc" 
								type="number"
								min={MIN_BRUSH_SIZE} 
								max={MAX_BRUSH_SIZE}
								onChange={this.onSizeInputChange}
								onBlur={this.onSizeInputBlur}
							/>
						</div>
					</Section>
					<Section label="Color" nomargin>
						<label className="db w-100 h2-ns h-100 pointer" style={{
							backgroundColor: brushColor,
						}}>
							<input 
								ref="color1Input"
								className="colorInput dn w-100"
								type="color" 
								onChange={this.onSetBrushColor(false)}
							/>
						</label>
					</Section>
					<Section label="Color 2" nomargin hideonmobile>
						<label className="db w-100 h2-ns h-100 pointer" style={{
							backgroundColor: brushColorAlt,
						}}>
							<input 
								ref="color2Input" 
								className="colorInput dn w-100" 
								type="color" 
								onChange={this.onSetBrushColor(true)}
							/>
						</label>
					</Section>
					<Section label="Palette" className="w-100" nomargin>
						<Palette choosePaletteColor={this.choosePaletteColor}/>
					</Section>
				</div>
			</div>
		);
	}
}
const Section = ({label, children, nomargin, hideonmobile, className}) => {
	const marginclass = nomargin ? "" : "mb2-ns";
	const flexclass = hideonmobile ? "dn flex-ns" : "flex";
	return <div className={`section ${flexclass} flex-column ${marginclass} ${className}`}>
		{label && <h5 className={`appdarkbg w-100 bt bb b--black white pv1 ph3 ph0-ns ma0 ${marginclass}`}>{label}</h5>}
		{children}
	</div>
}
// Brush selection button
const BrushIcon = ({size, selected, setBrushSize}) => {
	const width = `${size}px`, height = width;
	return (
		<div className="h2-ns w-100-ns w2 mb1-ns mr0-ns mr1 relative pointer" onClick={()=>setBrushSize(size)}>
			<div className={`brushIcon stretchToMargin flex flex-column justify-center items-center br2 mh1-ns mv0-ns mv1 ${selected ? "selected" : ""}`}>
				<div 
					className="br-100 bg-black"
					style={{width,height}}
				/>
			</div>
		</div>
	)
}
export default Toolbox;