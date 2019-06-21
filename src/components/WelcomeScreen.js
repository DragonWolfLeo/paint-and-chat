import React from "react";
import "../css/WelcomeScreen.css";
import Signin from './Signin';

const WelcomeScreen = props => {
	const {awaiting, room, joinRoom, declineRoom} = props;
	return (
			<div className="welcomeContainer flex flex-column">
				<header className="welcome flex flex-wrap items-center justify-center mb5">
					<div className="logoContainer mh3 mb3">
						<img className="logo" alt="logo" src="./images/logo.png" />
					</div>
					{!awaiting && <Signin room={room} joinRoom={joinRoom} declineRoom={declineRoom}/>}
				</header>
				<footer>
					<a className="white link" href="https://github.com/DragonWolfLeo/paint-and-chat">
						<ion-icon name="logo-github" />
						<span className="pl2">View on GitHub</span>
					</a>
				</footer>
			</div>
	);
	
}

export default WelcomeScreen;