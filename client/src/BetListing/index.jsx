import { Button, Card, Row, Col, Slider, Checkbox } from 'antd';
import * as React from 'react';
import { BetCard } from './bet-card';


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
  'betfred',
  'betvictor',
  'betfair',
  'betway',
  'coral',
  'ladbrokes',
  'livescorebet',
  'marathonbet',
  'matchbook',
  'paddypower',
  'skybet',
  'unibet',
  'virginbet',
  'williamhill'
]

const revenue = (bet) => {
  let ha = 0.0;
  bet.events.forEach((_, event_idx) => {
    let best = 0.0;
    bet.markets.forEach(market => {
      if (best < market.odds[event_idx]) // find best to compute the harmonic average
        best = market.odds[event_idx];
    });
    ha+= 1 / best;
  });

  if (ha === NaN || ha === Infinity)
    return 0;
  else
    return 1 / ha - 1;
}

class SearchCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      active_bets: props.bets.map(obj => JSON.parse(JSON.stringify(obj))),
      active_bookmakers: bookmakers,
      active_sports: sports,
      profit_range: [0.5, Infinity],
      live: false
    }
  }


  componentDidUpdate() {
    const compositeFilter = (bets) => {
      return  bets.filter(raw_bet => this.state.live ? true : !raw_bet.live) // live filter
                  .filter(raw_bet => this.state.active_sports.includes(raw_bet.game)) // sports filter
                  .map(raw_bet => { // bookmaker filter
                    let bet = raw_bet;
                    bet.markets = raw_bet.markets.filter(market => this.state.active_bookmakers.includes(market.bookmaker))
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

    console.log(this.state.profit_range)


    console.log({
      propbets: this.props.bets,
    });

    const new_bets = compositeFilter(this.props.bets.map(obj => JSON.parse(JSON.stringify(obj)))).map(obj => JSON.parse(JSON.stringify(obj)));

    const equals = (a, b) => a.length === b.length && a.every((v, i) => JSON.stringify(a[i]) === JSON.stringify(b[i]));

    if (!equals(this.state.active_bets, new_bets)) {
      this.setState({active_bets: new_bets.map(obj => JSON.parse(JSON.stringify(obj)))});
      this.props.onAction(new_bets);
    }
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

  toggleLive() {
    this.setState({
      live: !this.state.live
    })
  }

  render() {
    return <>
      <Card type="inner">
        <Row>
          <Col>
            <span style={{fontSize: "20px", marginRight: "50px"}}>Show live bets:</span>
            <Checkbox/>
          </Col>
        </Row>
      </Card>
      <Card type="inner">
        <Row>
          <Col span={4}>
            <h2>Profit Range:</h2>
          </Col>
          <Col span={7}>
            <Slider range onChange={(value) => this.setState({ profit_range: value })} min={0.5} max={25} defaultValue={[0.5, 25]} step={0.1} marks={{0.5: '0.5%', 25: '+25%'}}></Slider>
          </Col>
        </Row>
      </Card>
      <Card type="inner">
        <Row>
        <Col span={12}>
            <h2>Bookmakers:</h2>
            {
              bookmakers.map(bookmaker => <div key={bookmaker}>  <Checkbox defaultChecked={true} onChange={() => this.toggleBookmaker(bookmaker)} /> {bookmaker}  <br/></div>)
            }
          </Col>
          <Col span={12}>
            <h2>Sports:</h2>
            {
              sports.map(sport => <div key={sport}>  <Checkbox defaultChecked={true} onChange={() => this.toggleSport(sport)} /> {sport}  <br/></div>)
            }
          </Col>

        </Row>
      </Card>
    </>
  }
}


class BetListing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: false,
      active_bets: this.props.bets.sort((a, b) => revenue(b) - revenue(a)).filter(bet => bet.revenue >= 0.005)
    }
  }

  componentDidUpdate() {
    console.log(this.props);
    
    const equals = (a, b) => a.length === b.length && a.every((v, i) => JSON.stringify(a[i]) === JSON.stringify(b[i]));
    const prop_bets = this.props.bets.sort((a, b) => revenue(b) - revenue(a)).filter(bet => bet.revenue >= 0.005);

    if (!equals(prop_bets, this.state.active_bets))
      this.setState({
        active_bets: this.props.bets.sort((a, b) => revenue(b) - revenue(a)).filter(bet => bet.revenue >= 0.005)
      })
  }

  render() {
      return (<>
          <div id="BetFilter">
          <Card>
            <h1>To Do</h1>
            <ul>
              <li>Implement the raw calculator and stats routes</li>
              <li>Arbitrage calculator UX improvement</li>
              <li>Implement the odds history functionality</li>
              <li>Implement something to present the historical data stats</li>
              <li>Websocket live bet reloading</li>
              <li>User registration</li>
              <li>Ad integration</li>
              <li>Arbitrage tutorial</li>
            </ul>
          </Card>

          <Card>
            { this.state.filter ? <SearchCard onAction={(new_bets) => this.setState({active_bets: new_bets})} bets={this.props.bets} /> : null }
            { this.state.filter ? null : <Button onClick={() => this.setState({filter: true})}> Toggle Advanced search </Button> }
          </Card>

          </div>
          <br/>
          <br/>
          <br/>
          <div id="BetListing">
            {
              this.state.active_bets.map(raw_bet => <BetCard {...raw_bet} key={raw_bet.name} />)
            }
          </div>
        </>);
  }
}

export default BetListing;
