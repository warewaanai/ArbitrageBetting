import * as React from 'react';

import BetListing from "./BetListing";
import AppHeader from './AppHeader';
import AppFooter from './AppFooter'
import './App.scss'

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bets: []
    }
  }

  
  componentDidMount() {
    fetch("/api/get_bundles").then(res => res.json()).then(res => {
      this.setState({
        bets: res
      })
    }) 
  }


  render() {
    return (
      <div id="App">
        <AppHeader />
        <BetListing bets={this.state.bets}/>
        <AppFooter />
      </div>
    );
  }
}

export default App;
