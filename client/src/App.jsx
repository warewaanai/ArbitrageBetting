import * as React from 'react';
import {
  Routes,
  Route,
  userParams
} from "react-router-dom";

import './App.scss'
import EventPage from "./EventPage"
import Stats from "./Stats"
import BetListing from "./BetListing"
import AppHeader from "./AppHeader"
import AppFooter from "./AppFooter"
import BetCard from './BetCard';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bets: [],
      goodarbs: []
    }
  }


  componentDidMount() {
    fetch("/api/get_arbs").then(res => res.json()).then(res => {
      this.setState({
        bets: res.map(raw_bet => JSON.parse(raw_bet)).map(bet => {
          bet.id = bet.id.replace('"', '').replace('"', '');
          if (bet.live)
            bet.markets = bet.markets.filter(market => market.active);
          return bet;
        })
      })
    });

    fetch("/api/get_stats").then(res => res.json()).then(res => {
      this.setState({
        goodarbs: res.map(e => JSON.parse(e)).map(bet => {
          bet.id = bet.id.replace('"', '').replace('"', '');
          return bet;
        })
      })
    });
  }


  render() {
    return (
      <div id="App">
        <AppHeader />
        <Routes>
          <Route path="/" element={<BetListing bets={this.state.bets} />} />
          <Route path="/statistics" element={<Stats bets={this.state.goodarbs} />} />
          <Route path="/event/:id" element={<EventPage />} />
        </Routes>
        <AppFooter />
      </div>
    );
  }
}

export default App;
