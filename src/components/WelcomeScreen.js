import React from "react";
import "../css/WelcomeScreen.css";
import {requestJoinRoom, requestCreateRoom} from '../api/api';
const button_class = "f5 link br2 ph3 pv2 mh1 mv1 dib";
class WelcomeScreen extends React.Component {
	joinRoom = response => {
		if(response && response.alert){
			window.alert(response.alert);
			return;
		}
		this.props.joinRoom(response);
	}
	requestCreateRoom = () => {
		const inputs = this.getInputs();
		if(inputs){
			requestCreateRoom(...inputs)
			.then(this.joinRoom)
			.catch(console.error);
		}
	}
	requestJoinRoom = () => {
		const inputs = this.getInputs();
		if(inputs){
			const room = this.props.room || window.prompt("Enter room name.").trim().substring(0,10);
			if(room){
				requestJoinRoom(...inputs, room)
				.then(this.joinRoom)
				.catch(console.error);
			}
		}
	}
	getInputs = () => {
		const name = this.refs.nameInput.value.trim();
		const color = this.refs.colorInput.value;
		if(!name){
			alert("Please enter a nickname.");
			return null;
		}
		return [name, color];
	}
	render(){
		const {room} = this.props;
		return (
			<header className="welcome flex flex-wrap justify-around items-center">
				<div className="logoContainer mh3 mb3">
					<img className="logo" alt="logo" src="/images/logo.png" />
				</div>
				<div className="textContainer mb3 flex flex-column items-center">
					<div className="textBox">
						<h1 className="mt0 mb3">
							{
								room ? 
								"You're invited to draw!":
								"Draw and chat online with friends!"
							}
						</h1>
						<h3 className="mt0 mb3">To get started, choose a nickname and color.</h3>
						<div className="pb3 mw6 w-100 flex justify-center items-center">
								<input ref="nameInput" className="textInput f3" type="text" maxLength="20" placeholder="Nickname" />
								<input ref="colorInput" className="colorInput h-100" type="color" />
						</div>
						<div className="flex flex-wrap justify-center">
							{room ? 
								<React.Fragment>
									<button className={button_class} onClick={this.requestJoinRoom}>Join</button> 
									<button className={button_class+" declineButton"} onClick={this.props.declineRoom}>Decline</button> 
								</React.Fragment>:
								<React.Fragment>
									<button className={button_class} onClick={this.requestCreateRoom}>Create a Room</button>
									<button className={button_class} onClick={this.requestJoinRoom}>Join a Room</button>
								</React.Fragment>
							}
						</div>
					</div>
				</div>
			</header>
		);
	}
}

export default WelcomeScreen;