import * as React from 'react';
import { Card, Button, Select, Row, Col } from 'antd'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import { Line as Scatter } from 'react-chartjs-2'
import 'chartjs-adapter-moment';

import eu_flag from '../static/eu.png'
import us_flag from '../static/us.png'
import uk_flag from '../static/uk.png'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
)

const { Option } = Select;


const flags = {
  'eu': eu_flag,
  'us': us_flag,
  'uk': uk_flag
}

class HistoricalChart extends React.Component {
  constructor(props) {
    super(props);

    this.niceColours = [
      'rgba(0, 200, 255)',
      'rgba(0, 200, 100)',
      'rgba(255, 200, 0)',
      'rgba(127, 0, 255)',
    ]

    this.state = {
      props: props,
      bookmaker_graphs: [{
        bookmaker: 0,
        outcome: this.props.outcomes[0],
      }],
      arbitrage_graph: true
    }
  }


  render() {
    const labels = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
    ];

    let graphs_data = this.state.bookmaker_graphs.map((graph, graph_idx) => {
      let history = this.props.markets[graph.bookmaker].history.filter(update => update.outcome == graph.outcome);
      history.push(this.props.markets[graph.bookmaker].odds[graph.outcome]);

      return {
        label: `${this.props.markets[graph.bookmaker].bookmaker} - ${graph.outcome}`,
        backgroundColor: this.niceColours[graph_idx % this.niceColours.length],
        borderColor: this.niceColours[graph_idx % this.niceColours.length],
        data: history.map(update => ({x: update.last_update, y: update.odds })),
        showLine: true,
        showLabel: true,
        tension: 0.2
      };
    });

    const getArbGraph = () => {
      let history = [];
      this.props.markets.forEach(market => {
        const new_history = market.history;
        history = history.concat(new_history.map(odds => {
          odds.bookmaker = market.bookmaker;
          return odds;
        }))
      });

      this.props.outcomes.forEach(outcome => {
        this.props.markets.forEach(market => {
          history.push({
            bookmaker: market.bookmaker,
            ...market.odds[outcome]
          });
        })
      })

      history.sort((odds1, odds2) => {
        const d1 = new Date(odds1.last_update);
        const d2 = new Date(odds2.last_update);
        return d1.getTime() - d2.getTime();
      })

      let bookmaker_dict = {};
      let data0 = [];

      history.forEach(odds => {
        if (bookmaker_dict[odds.bookmaker] == undefined)
          bookmaker_dict[odds.bookmaker] =  {}
        bookmaker_dict[odds.bookmaker][odds.outcome] = odds.odds;

        let best = {}
        let ready = true;
        this.props.outcomes.forEach(outcome => {
          best[outcome] = 0.0;
          this.props.markets.forEach(market => {
            if (market.odds[outcome] !== undefined && bookmaker_dict[market.bookmaker] !== undefined && bookmaker_dict[market.bookmaker][outcome] !== undefined)
              best[outcome] = Math.max(best[outcome], bookmaker_dict[market.bookmaker][outcome]);
          })
          if (best[outcome] === 0.0)
            ready = false;
        })

        if (ready) {
          let ha = 0;
          this.props.outcomes.forEach(outcome => {
            ha+= 1 / best[outcome];
          });
          ha = 1 / ha;
          data0.push({
            x: odds.last_update,
            y: ha
          })
        }
      })

      let data = [];
      for (let i = 0; i < data0.length; ++i)
        if (i + 1 == data0.length || (data0[i + 1].x != data0[i].x || data0[i + 1].y != data0[i].y))
          data.push(data0[i])

      graphs_data.push({
        label: `Best arbitrage`,
        backgroundColor: 'rgba(225, 0, 0)',
        borderColor: 'rgb(225, 0, 0)',
        data: data,
        showLine: true,
        showLabel: true,
        tension: 0.2
      })
    }

    if (this.state.arbitrage_graph)
      getArbGraph();

    const data = {
      datasets: graphs_data
    };
    const options = {
      responsive: true,
      tooltips: false,
      scales: {
        x: {
          type: 'time',
          time: {
            timeformat: "YYYY-MM-DDTHH:MM:SS"
          }
        }
      }
    };

    console.log(this.state);

    return (<>
      { // Market graph
        this.state.bookmaker_graphs.map((graph, graph_idx) => <>
          <Card type='inner'>
            <Row>
              <Col span={3}>
                <h2>Bookmaker: </h2>
              </Col>
              <Col>
                <Select style={{width: 170}} defaultValue={ '0' } onChange={(value) => this.setState(state => {state.bookmaker_graphs[graph_idx].bookmaker = value; return state; } ) } >
                  { this.props.markets.map((market, idx) => <Option key={ idx.toString() } > <img width={20} alt={market.region} src={flags[market.region]}/> {market.bookmaker} </Option>) }
                </Select>
              </Col>
            </Row>
            <Row>
              <Col span={3}>
                <h2>Event: </h2>
              </Col>
              <Col>
                <Select style={{width: 170}} defaultValue={ this.props.outcomes[0] }  onChange={(value) => this.setState(state => {state.bookmaker_graphs[graph_idx].outcome = value; return state; } ) }>
                  { this.props.outcomes.map(outcome => <Option key={outcome}> {outcome} </Option>) }
                </Select>
              </Col>
            </Row>
            <Button danger onClick={() => {
              this.setState(state => {
                return {
                  bookmaker_graphs: (this.state.bookmaker_graphs.filter((_, idx) => idx !== graph_idx))
                }
              });
            }}>
              Remove market
            </Button>
          </Card>
          <br />
        </>) 
      }

      <Button onClick={() => this.setState(state => {
        let graphs = state.bookmaker_graphs.map(e => JSON.parse(JSON.stringify(e)))
        graphs.push({bookmaker: 0, outcome: this.props.outcomes[0]})
        return {
          bookmaker_graphs: graphs
        }
      })}>
      Add new market
      </Button>

      <br />
      <br />
      <Button onClick={() => this.setState(state => {return {arbitrage_graph: !this.state.arbitrage_graph}} )}> Toggle arbitrage profit graph </Button>
      <br />
          
      <Scatter options={options} data={data} />
      <h3>*The timescale timezone is UTC</h3>
      </>);
  }
}

export default HistoricalChart;