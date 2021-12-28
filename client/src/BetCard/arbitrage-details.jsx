import * as React from 'react';
import { Card, Button, Table, Select, InputNumber, Row, Col } from 'antd'
import 'chartjs-adapter-moment';

import './bet-card.scss'
import eu_flag from '../static/eu.png'
import us_flag from '../static/us.png'
import uk_flag from '../static/uk.png'

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
    props.outcomes.forEach((outcome) => {
      let best = props.markets[0];
      props.markets.forEach(market => {
        market_dict[market.bookmaker] = { odds: market.odds }; // populate market_dict
        if (best.odds[outcome].odds < market.odds[outcome].odds) // find best to compute the harmonic average
          best = market;
      });

      ha += 1 / best.odds[outcome].odds;
    });

    ha = 1 / ha;

    props.outcomes.forEach((outcome, outcome_idx) => {
      const column = {
        title: outcome,
        dataIndex: outcome,
        key: outcome
      }

      let best = props.markets[0];
      props.markets.forEach((market) => {
        if (best.odds[outcome].odds < market.odds[outcome].odds)
          best = market;
      });

      choices[outcome] = {
        value: Math.ceil(default_investment / market_dict[best.bookmaker].odds[outcome].odds * ha),
        bookmaker: best.bookmaker
      }

      investment += choices[outcome].value;
      columns.push(column);
    });

    this.columns = columns;
    this.state = {
      props: props,
      ha: ha,
      investment: investment,
      choices: choices,
      market_dict: market_dict
    }
  }

  componentDidUpdate() {
    if (this.props !== this.state.props)
      this.updateAction();
  }

  updateAction() {
    let choices = {};
    let market_dict = {};
    let ha = 0.0, investment = 0.0;

    // fill markets information
    this.props.outcomes.forEach((outcome) => {
      let best = this.props.markets[0];
      this.props.markets.forEach(market => {
        market_dict[market.bookmaker] = { odds: market.odds }; // populate market_dict
        if (best.odds[outcome].odds < market.odds[outcome].odds) // find best to compute the harmonic average
          best = market;
      });

      ha += 1 / best.odds[outcome].odds;
    });

    ha = 1 / ha;

    this.props.outcomes.forEach((outcome) => {
      let best = this.props.markets[0];
      this.props.markets.forEach((market) => {
        if (best.odds[outcome].odds < market.odds[outcome].odds)
          best = market;
      });


      choices[outcome] = {
        value: Math.ceil(this.state.investment / market_dict[best.bookmaker].odds[outcome].odds * ha),
        bookmaker: best.bookmaker
      }

      investment += choices[outcome].value;
    });

    this.setState({
      props: this.props,
      ha: ha,
      investment: investment,
      choices: choices,
      market_dict: market_dict
    });
  }

  input_event(event, outcome, value) {
    if (value === null)
      return;

    switch (event) {
      case 'bookmaker': {
        this.setState(_state => {
          let state = JSON.parse(JSON.stringify(_state));

          state.choices[outcome].bookmaker = value;

          state.ha = 0;
          for (const [outcome, entry] of Object.entries(state.choices))
            state.ha += 1 / this.state.market_dict[entry.bookmaker].odds[outcome].odds;
          state.ha = 1 / state.ha;

          let investment = 0;
          for (const [outcome, entry] of Object.entries(state.choices)) {
            const bookmaker = entry.bookmaker;
            state.choices[outcome].value = Math.ceil(state.investment / this.state.market_dict[bookmaker].odds[outcome].odds * state.ha);
            investment+= state.choices[outcome].value;
          }
          state.investment = investment;
          console.log(state);

          return state;
        })
        break;
      }
      case 'bet value': {
        value = parseFloat(value);
        this.setState(state => {
          state.investment -= state.choices[outcome].value
          state.choices[outcome].value = value
          state.investment += value
          return state;
        })
        break;
      }
      case 'investment': {
        value = parseFloat(value);

        this.setState(state => {
          state.investment = 0;
          for (const [key, entry] of Object.entries(state.choices)) {
            const bookmaker = state.choices[key].bookmaker;
            state.choices[key].value = Math.ceil(value / this.state.market_dict[bookmaker].odds[key].odds * state.ha);
            state.investment+= state.choices[key].value;
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
    this.props.outcomes.forEach((outcome) => {
      let best = this.props.markets[0];
      this.props.markets.forEach((market) => {
        if (best.odds[outcome].odds < market.odds[outcome].odds)
          best = market;
      });

      choices_dom[outcome] = <div key={outcome}>
        <Row>
          <Col span={8}>
            <h2>Bookmaker: </h2>
          </Col>
          <Col>
            <Select style={{ width: 170 }} defaultValue={best.bookmaker} onChange={value => this.input_event('bookmaker', outcome, value)}>
              {this.props.markets.map(market => <Option key={market.bookmaker}> <img width={20} alt={market.region} src={flags[market.region]} /> {market.bookmaker} </Option>)}
            </Select>
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <h2>Bet value:</h2>
          </Col>
          <Col>
            {this.state.manual ?
              <InputNumber value={this.state.choices[outcome].value} onChange={value => this.input_event('bet value', outcome, value)} /> :
              <h2>{this.state.choices[outcome].value}</h2>
            }
          </Col>
        </Row>
        <hr />

        <h2>Outcome revenue: {Math.ceil(Math.ceil(this.state.choices[outcome].value) * this.state.market_dict[this.state.choices[outcome].bookmaker].odds[outcome].odds)}</h2>
        <h2>Outcome profit: {Math.ceil((Math.ceil(Math.ceil(this.state.choices[outcome].value) * this.state.market_dict[this.state.choices[outcome].bookmaker].odds[outcome].odds) / this.state.investment - 1) * 10000) / 100} % </h2>
      </div>
    });

    return <>
      <h1>Arbitrage Calculator:</h1>
      <Card>
        <Row>
          <Col span={7}>
            <h2>Initial approximate investment:</h2>
          </Col>
          <Col>
            <InputNumber defaultValue={this.state.investment} onChange={value => this.input_event('investment', null, value)} />
          </Col>
        </Row>
        <Row>
          <Col span={7}>
            <h2>Real investment:</h2>
          </Col>
          <Col>
            <h2> { this.state.investment } </h2>
          </Col>
        </Row>
        <Table columns={this.columns} dataSource={[choices_dom]} pagination={false}></Table>
        <br />
        {this.state.manual ? null : <Button danger onClick={() => this.setState({ manual: true })}> Set Bet Values Manually </Button>}
      </Card>
    </>
  }
}

export default ArbitrageDetails;
