import React from "react";
import Modal from "./Modal";
import "../css/Dialog.css";
class Dialog extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			active: false,
		}
	}
	inputValues = {}
	activate = () => {
		this.setState({active: true});
	}
	deactivate = () => {
		this.setState({active: false});
	}
	onClickOverlay = event => {
		// Only deactivate if clicking on overlay directly
		if(this.refs.overlay === event.target){
			this.deactivate();
		}
	}
	onAccept = () => {
		// Send input values
		const {onAccept, inputs} = this.props;
		onAccept(this.deactivate,...inputs.map(input=>this.inputValues[input.target]));
	}
	onInputChange = (event, input) => {
		const {target} = event;
		let value = Number(target.value);
		// Update inputValues if valid
		if(!target.checkValidity()){
			// Check if this is a number; return if not
			if(!value) return;
			// Clamp within range if invalid
			const min = Number(target.min);
			const max = Number(target.max);
			value = value > max ? max : min;
		}
		this.inputValues[input.target] = value;
	}
	onInputBlur = (event, input) => {
		event.target.value = this.inputValues[input.target];
	}
	setInitialInputs = () => {
		// Update only if active is changed or not
		if(!this.state.active) return;
		const {inputs} = this.props;
		inputs.forEach(input=>{
			this.refs[`${input.target}_input`].value = input.initial;
			this.inputValues[input.target] = input.initial;
		});
	}
	componentDidMount(){
		this.setInitialInputs();
	}
	componentDidUpdate(){
		this.setInitialInputs();
	}
	render(){
		const {title, inputs} = this.props;
		return this.state.active && <Modal>
		<div onClick={this.onClickOverlay} ref="overlay" className="dialogOverlay tc flex justify-center items-center">
			<div className="dialog appdarkbg">
				<h3>{title}</h3>
				
				{inputs && <table><tbody>
					{inputs.map(input=><tr key={input.target}>
						<td>{`${input.title}:`}</td>
						<td><input 
							ref={`${input.target}_input`}
							onChange={event=>{this.onInputChange(event, input)}}
							onBlur={event=>{this.onInputBlur(event, input)}}
							type="number"
							min="1" 
							max="2000"
						/></td>
					</tr>)}
				</tbody></table>}

				<div className="flex justify-center f4">
					<button onClick={this.onAccept}>OK</button>
					<button onClick={this.deactivate}>Cancel</button>
				</div>
			</div>
		</div>
		</Modal>
	}
}

export default Dialog;