import React from "react";
import "../css/WelcomeScreen.css";
import Signin from './Signin';

const WelcomeScreen = props => {
	const {awaiting, room, joinRoom, declineRoom} = props;
	return (
		<header className="welcome flex flex-wrap justify-around items-center">
			<div className="logoContainer mh3 mb3">
				<img className="logo" alt="logo" src="/images/logo.png" />
			</div>
			{!awaiting && <Signin room={room} joinRoom={joinRoom} declineRoom={declineRoom}/>}
		</header>
	);
	
}

export default WelcomeScreen;