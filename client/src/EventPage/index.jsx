import * as React from 'react';
import { useParams } from "react-router-dom";
import { Card, Row, Col, Checkbox } from 'antd';

import { getCookie, setCookie } from '../cookie-manager';
import BetCard from '../BetCard'

function withParams(Component) {
  return props => <Component {...props} params={useParams()} />;
}

const INF = 1e9;

const sports = [
  'American Football',
  'Aussie Rules',
  'Basketball',
  'Baseball',
  'Cricket',
  'Golf',
  'Ice Hockey',
  'Mixed Martial Arts',
  'Soccer',
  'Rugby',
  'Tennis'
];

const bookmakers = [
  '888sport',
  'Betfred',
  'Bet Victor',
  'Betfair',
  'Betway',
  'Coral',
  'Ladbrokes',
  'Livescore Bet',
  'Marathon Bet',
  'Matchbook',
  'Nordic Bet',
  'Paddy Power',
  'Sky Bet',
  'Unibet',
  'Virgin Bet',
  'William Hill'
]

class EventPage extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);


    if (getCookie('app') == undefined) {
      setCookie('app', JSON.stringify({
        settings: {
          active_sports: sports,
          active_bookmakers: bookmakers,
          profit_range: [0.5, INF],
          live: true
        }
      }));
    }

    let cookieObj = JSON.parse(getCookie('app'));
    console.log(cookieObj);
    this.state = {
      bet: null,
      active_bookmakers: cookieObj.settings.active_bookmakers
    }
  }

  componentDidMount() {
    fetch(`/api/get_bundle/${this.props.params.id}`).then(res => res.json()).then(bet => {
      bet.markets = bet.markets.filter(market => this.state.active_bookmakers.includes(market.bookmaker));
      bet.id = bet.id.replace('"', '').replace('"', '');
      if (bet.live)
        bet.markets = bet.markets.filter(market => market.active);
      this.setState({
        bet: bet
      })

      if (this.state.bet !== null) {
        this.ws = new WebSocket(`ws://thawing-brushlands-00177.herokuapp.com/api/get_socket/${this.state.bet.id.replace('"', '').replace('"', '')}`);
        this.ws.addEventListener('message', (evt) => {
          let bet = JSON.parse(evt.data);

          bet.markets = bet.markets.filter(market => this.state.active_bookmakers.includes(market.bookmaker));
          bet.id = bet.id.replace('"', '').replace('"', '');

          if (bet.live)
            bet.markets = bet.markets.filter(market => market.active);

          this.setState({
            bet: bet
          });
          console.log("UPDATED")
        });
      }
    });
  }

  toggleBookmaker(bookmaker) {
    if (this.state.active_bookmakers.includes(bookmaker)) {
      this.setState({
        active_bookmakers: this.state.active_bookmakers.filter(b => b !== bookmaker)
      })
      let cookieObj = JSON.parse(getCookie('app'));
      cookieObj.settings.active_bookmakers = this.state.active_bookmakers.filter(b => b !== bookmaker);
      setCookie('app', JSON.stringify(cookieObj));
    }
    else {
      let active_bookmakers = this.state.active_bookmakers.map(e => e);
      active_bookmakers.push(bookmaker);
      this.setState({
        active_bookmakers: active_bookmakers
      })
      let cookieObj = JSON.parse(getCookie('app'));
      cookieObj.settings.active_bookmakers = active_bookmakers;
      setCookie('app', JSON.stringify(cookieObj));
    }
  }

  render() {
    return <>
      <Card>
        <h2>Bookmakers:</h2>
        { bookmakers.map(bookmaker => <> <Checkbox defaultChecked={this.state.active_bookmakers.includes(bookmaker)} onChange={() => this.toggleBookmaker(bookmaker)} /> {bookmaker} <br/></> ) }

      </Card>
      {this.state.bet === null ? null : <BetCard detailed {...this.state.bet} /> }
    </>
  }
}

export default withParams(EventPage);
