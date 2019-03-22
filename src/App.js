import React, { Component } from 'react';
import request from 'superagent';
import "tachyons";
import './css/App.css';
import CanvasSpace from './components/CanvasSpace';
import Chat from './components/Chat';

window.serverUrl = "http://localhost:3001";

class App extends Component {
  sendTestData() {
    request
      .post(window.serverUrl + '/api/rate-dargon')
      .send({ rating: 10 })
      .set('accept', 'json')
      .end((err, res) => {
        console.log("Received response from PaintWebAppServer!", res);
      });
  }
  render() {
    return (
      <div className="App">
        <div id="mainContainer">
          <CanvasSpace />
          <Chat />
        </div>
      </div>
    );
  }
}

export default App;
