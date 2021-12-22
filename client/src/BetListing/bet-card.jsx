import * as React from 'react';
import { Card, Button, Table, Select, InputNumber, Row, Col } from 'antd'
import Rainbow from 'rainbowvis.js'
import eu_flag from './static/eu.png'
import us_flag from './static/us.png'
import uk_flag from './static/uk.png'

import './bet-card.scss'

const { Option } = Select;


const flags = {
  'eu': eu_flag,
  'us': us_flag,
  'uk': uk_flag
}

class ArbitrageDetails extends React.Component {
  constructor(props) {
    super(props);

    let columns = [];
    let choices = {};
    let market_dict = {};
    let ha = 0.0, investment = 0.0;

    const default_investment = 100;

    // fill markets information
    props.events.forEach((_, event_idx) => {

      let best = props.markets[0];
      props.markets.forEach(market => {
        market_dict[market.bookmaker] = { odds: market.odds }; // populate market_dict
        if (best.odds[event_idx] < market.odds[event_idx]) // find best to compute the harmonic average
          best = market;
      });

      ha+= 1 / best.odds[event_idx];
    });

    ha = 1 / ha;

    
    props.events.forEach((evt, event_idx) => {
      const column = {
        title: evt,
        dataIndex: event_idx,
        key: event_idx
      }

      let best = props.markets[0];
      props.markets.forEach((market) => {
        if (best.odds[event_idx] < market.odds[event_idx])
          best = market;
      });

      choices[event_idx] = {
        value: Math.floor(default_investment / market_dict[best.bookmaker].odds[event_idx] * ha),
        bookmaker: best.bookmaker,
        profit: Math.floor(Math.floor(default_investment / market_dict[best.bookmaker].odds[event_idx] * ha) * market_dict[best.bookmaker].odds[event_idx])
      }

      investment+= choices[event_idx].value;
      columns.push(column);
    });

    this.market_dict = market_dict;
    this.columns = columns;
    this.state = {
      ha: ha,
      investment: investment,
      choices: choices
    }
  }

  input_event(event, event_idx, value) {
    if (value === null)
      return;

      switch (event) {
      case 'bookmaker': {
        this.setState(state => {
          state.ha = 0;
          for (const [_, entry] of Object.entries(state.choices))
            state.ha+= 1 / this.market_dict[entry.bookmaker].odds[event_idx];
          state.ha = 1 / state.ha;

          state.choices[event_idx] = {
            bookmaker: value,
            value: Math.floor(state.investment / this.market_dict[value].odds[event_idx] * state.ha),
            profit: Math.floor(Math.floor(state.investment / this.market_dict[value].odds[event_idx] * state.ha) * this.market_dict[value].odds[event_idx])
          }
          return state;
        })
        break;
      }
      case 'bet value': {
        value = parseFloat(value);

        this.setState(state => {
          const bookmaker = state.choices[event_idx].bookmaker;
          state.choices[event_idx] = {
            bookmaker: bookmaker,
            value: value,
            profit: value * this.market_dict[bookmaker].odds[event_idx]
          }
          state.investment = 0;
          for (const [_, entry] of Object.entries(state.choices))
            state.investment+= entry.value;
          return state;
        })
        break;
      }
      case 'investment': {
        value = parseFloat(value);

        this.setState(state => {
          state.investment = value;
          for (const [key, entry] of Object.entries(state.choices)) {
            const bookmaker = state.choices[key].bookmaker;
            state.choices[key].value = Math.floor(value / this.market_dict[bookmaker].odds[key] * state.ha);
            state.choices[key].profit = Math.floor(state.choices[key].value * this.market_dict[bookmaker].odds[key]);
          }
          return state;
        });
        break;
      }
      default:
    }
  }

  render() {
    let choices_dom = {};
    this.props.events.forEach((evt, idx) => {
      const choice_idx = idx.toString();

      let best = this.props.markets[0];
      this.props.markets.forEach((market) => {
        if (best.odds[idx] < market.odds[idx])
          best = market;
      });

      choices_dom[choice_idx] = <div key={choice_idx}>
        <Row>
          <Col span={8}>
            <h2>Bookmaker: </h2>
          </Col>
          <Col>
            <Select style={{width: 170}} defaultValue={ best.bookmaker } onChange={value => this.input_event('bookmaker', choice_idx, value)}>
              { this.props.markets.map(market => <Option key={market.bookmaker}> <img width={20} alt={market.region} src={flags[market.region]}/> {market.bookmaker} </Option>) }
            </Select>
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <h2>Bet value:</h2>
          </Col>
          <Col>
            {this.state.manual ?
              <InputNumber value={this.state.choices[choice_idx].value} onChange={value => this.input_event('bet value', choice_idx, value) }/> :
              <h2>{this.state.choices[choice_idx].value}</h2>
            }
          </Col>
        </Row>
        <hr />
        
        <h2>Outcome revenue: { Math.floor(this.state.choices[idx].profit) }</h2>
      </div>
    });
    
    return <>
      <h1>Arbitrage Calculator:</h1>
      <Card>
        <Row>
          <Col span={5}>
            <h2>Initial investment:</h2>
          </Col>
          <Col>
            <InputNumber value={this.state.investment} onChange={value => this.input_event('investment', null, value)}/>
          </Col>
        </Row>
        <Table columns={this.columns} dataSource={[choices_dom]} pagination={false}></Table>

        { this.state.manual ? null : <Button danger onClick={() => this.setState({manual: true})}> Set Odds Manually </Button>  }
      </Card>
    </>
  }
}


class CardDetails extends React.Component {
  constructor(props) {
    super(props);

    let allData = []
    let columns = [
      {
        title: 'Bookmaker',
        dataIndex: 'bookmaker',
        key: 'bookmaker',
      },
      {
        title: 'Last update',
        dataIndex: 'last_update',
        key: 'last_update',
        sorter: (a, b) => {
          const time_a = new Date(a['last_update']);
          const time_b = new Date(b['last_update']);
          return time_a.getTime() - time_b.getTime();
        },
        sortDirections: ['ascend', 'descend', 'ascend']
      }
    ]
  
    props.events.forEach((evt, idx) => {
      const choice_idx = idx.toString();

      const column = {
        title: evt,
        dataIndex: choice_idx,
        key: choice_idx,
        sorter: (a, b) => (parseFloat(a[choice_idx]) - parseFloat(b[choice_idx])),
        sortDirections: ['ascend', 'descend', 'ascend']
      }
  
      columns.push(column);
    });
  
    props.markets.forEach((market, idx) => {
      const choice_idx = idx.toString();
      let odds = {}
  
      market.odds.forEach((oddsValue, odds_idx) => {
        odds[odds_idx.toString()] = oddsValue;
      })
  
      allData.push({
        key: choice_idx,
        bookmaker: <><img width={20} alt={market.region} src={flags[market.region]}/> {market.bookmaker}</>,
        last_update: market.last_update,
        ...odds
      })
    });

    this.allOdds = {
      data: allData,
      columns: columns
    }
  }

  render() {    
    return (
      <div className='BetCardDetails'>
        <ArbitrageDetails markets={this.props.markets} events={this.props.events} />        

        <h1>All Active Odds:</h1>
        <Table columns={this.allOdds.columns} dataSource={this.allOdds.data} pagination={false} />

        <h1>Odds history:</h1>
        <br />
        <br />
        <Button danger onClick={() => this.props.close()}> Hide Odds </Button>
      </div>
    )
  }  
}

class BetCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      detailed: false
    }
  }


  Title = () => {
    let rb = new Rainbow();
    rb.setNumberRange(-0.1, 10);
    rb.setSpectrum('red', '#dddd00', 'green', '#00aaff')

    const start_date = new Date(this.props.start_time);
    const start = this.props.live ?
      <span className='LiveEvent'>LIVE BET</span> :
      <> {start_date.toISOString()} </>

    return <div className='BetCardTitle'>
      <div className='BetTitleData'>
        <div className='BetTitleName'> {this.props.name} </div>
        <div className='BetTitleTime'> {start} </div>
      </div>
      <div className='BetTitleRevenue'
        style={{
          backgroundColor: '#' + (rb.colorAt(this.props.revenue * 100))
        }}
      > Profit: {Math.floor(this.props.revenue * 10000) / 100}% </div>
    </div>
  }


  render() {
    return <>
      <Card title={<this.Title />} >
        <h3> {this.props.description} </h3>

        {
          this.state.detailed === false ?
            <Button onClick={() => this.setState({detailed: true})}> See Odds </Button> :
            <CardDetails {...this.props} close={() => this.setState({detailed: false})} />
        }
      </Card>

      <br />
    </>
  }
}

export {
  BetCard
}
