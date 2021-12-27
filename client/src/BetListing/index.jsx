import { Button, Card, Row, Col, Slider, Checkbox } from 'antd';
import * as React from 'react';
import BetCard from '../BetCard'
import { getCookie, setCookie } from '../cookie-manager';


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

const INF = 1e9;

const revenue = (bet) => {
  let ha = 0.0;
  bet.outcomes.forEach(outcome => {
    let best = 0.0;
    bet.markets.forEach(market => {
      if (best < market.odds[outcome].odds && market.active) // find best to compute the harmonic average
        best = market.odds[outcome].odds
    });
    ha+= 1 / best;
  });

  if (ha === NaN || ha === INF)
    return 0;
  else
    return 1 / ha - 1;
}

class SearchCard extends React.Component {
  constructor(props) {
    super(props);

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
    this.state = {
      active: false,
      ...cookieObj.settings
    }
    this.state.active_bets = props.bets.map(obj => JSON.parse(JSON.stringify(obj))).filter(raw_bet => this.state.live ? true : raw_bet.live);
  }

  filterAction() {
    const compositeFilter = (bets) => {
      return  bets.filter(raw_bet => this.state.live ? true : !raw_bet.live) // live filter
                  .filter(raw_bet => this.state.active_sports.includes(raw_bet.sport)) // sports filter
                  .map(raw_bet => { // bookmaker filter
                    let bet = raw_bet;
                    bet.markets = bet.markets.filter(market => this.state.active_bookmakers.includes(market.bookmaker));
                    return bet;
                  })
                  .map(raw_bet => {
                    let bet = raw_bet
                    bet.revenue = revenue(bet)
                    return bet;
                  })
                  .filter(raw_bet => this.state.profit_range[0] <= raw_bet.revenue * 100 && raw_bet.revenue * 100 <= this.state.profit_range[1]) // profit filter 
                  .sort((a, b) => b.revenue - a.revenue)
    }

    setCookie('app', JSON.stringify({
      settings: {
        active_sports: this.state.active_sports,
        active_bookmakers: this.state.active_bookmakers,
        live: this.state.live,
        profit_range: this.state.profit_range
      }
    }))

    const new_bets = compositeFilter(this.props.bets.map(obj => JSON.parse(JSON.stringify(obj)))).map(obj => JSON.parse(JSON.stringify(obj)));

    const equals = (a, b) => a.length === b.length && a.every((v, i) => JSON.stringify(a[i]) === JSON.stringify(b[i]));

    if (!equals(this.state.active_bets, new_bets)) {
      this.setState({active_bets: new_bets.map(obj => JSON.parse(JSON.stringify(obj)))});
      this.props.onAction(new_bets.map(obj => JSON.parse(JSON.stringify(obj))));
    }
  }

  componentDidMount() {
    this.filterAction();
  }

  componentDidUpdate() {
    this.filterAction();
  }

  toggleBookmaker(bookmaker) {
    let new_bookmakers = []
    if (this.state.active_bookmakers.includes(bookmaker)) {
      new_bookmakers = this.state.active_bookmakers.filter(b => b !== bookmaker);
    }
    else {
      new_bookmakers = this.state.active_bookmakers;
      new_bookmakers.push(bookmaker);
    }
    this.setState({
      active_bookmakers: new_bookmakers
    })
  }

  toggleSport(sport) {
    let new_sports = []
    if (this.state.active_sports.includes(sport)) {
      new_sports = this.state.active_sports.filter(b => b !== sport);
    }
    else {
      new_sports = this.state.active_sports;
      new_sports.push(sport);
    }
    this.setState({
      active_sports: new_sports
    })
  }

  render() {
    return <>
      <Card>
        {this.state.active ? <>
          <Card type="inner">
            <Row>
              <Col>
                <span style={{fontSize: "20px", marginRight: "50px"}}>Show live bets:</span>
                <Checkbox defaultChecked={this.state.live} onChange={() => this.setState({ live: !this.state.live })}/>
              </Col>
            </Row>
          </Card>
          <Card type="inner">
            <Row>
              <Col span={4}>
                <h2>Profit Range:</h2>
              </Col>
              <Col span={7}>
                <Slider range onChange={(value) => this.setState({ profit_range: [value[0], value[1] == 25 ? INF : value[1]] })} min={0.5} max={25} defaultValue={this.state.profit_range} step={0.1} marks={{0.5: '0.5%', 25: '+25%'}}></Slider>
              </Col>
            </Row>
          </Card>
          <Card type="inner">
            <Row>
            <Col span={12}>
                <h2>Bookmakers:</h2>
                {
                  bookmakers.map(bookmaker => <div key={bookmaker}>  <Checkbox defaultChecked={this.state.active_bookmakers.includes(bookmaker)} onChange={() => this.toggleBookmaker(bookmaker)} /> {bookmaker}  <br/></div>)
                }
              </Col>
              <Col span={12}>
                <h2>Sports:</h2>
                {
                  sports.map(sport => <div key={sport}>  <Checkbox defaultChecked={this.state.active_sports.includes(sport)} onChange={() => this.toggleSport(sport)} /> {sport}  <br/></div>)
                }
              </Col>

            </Row>
          </Card>
          </> :
          null
        }
        <Button onClick={() => this.setState({active: !this.state.active})}> Toggle Advanced search </Button>
      </Card>
    </>
  }
}


class BetListing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: false,
      updated: false,
      active_bets: this.props.bets.sort((a, b) => revenue(b) - revenue(a)).filter(bet => revenue(bet) >= 0.005)
    }
  }

  render() {
      return (<>
          <div id="BetFilter">

          <SearchCard onAction={(new_bets) => { this.setState({active_bets: new_bets}) }} bets={this.props.bets} />

          </div>
          <br/>
          <br/>
          <br/>
          <div id="BetListing">
            { this.state.active_bets.map(raw_bet => <BetCard {...raw_bet} key={raw_bet.name} />) }
            { this.state.active_bets.length === 0 ? <h1>No results</h1> : null }
          </div>
        </>);
  }
}

export default BetListing;
