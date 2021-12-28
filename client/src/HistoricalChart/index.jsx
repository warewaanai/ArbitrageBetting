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
      'rgb(148, 0, 211)',
      'rgb(75, 0, 130)',
      'rgb(0, 0, 255)',
      'rgb(0, 255, 0)',
      'rgb(255, 255, 0)',
      'rgb(155, 193, 60)',
      'rgb(246,153,205)'
    ]

    this.state = {
      props: props,
      bookmaker_graphs_on: true,
      bookmaker_graphs: this.props.markets.map((market, midx) => { return {
        bookmaker: midx,
      }}),
      outcome: this.props.outcomes[0],
      arbitrage_graph: true
    }
  }

  componentDidUpdate() {
    if (this.props != this.state.props) {
      this.setState({
        props: this.props,
        bookmaker_graphs: this.props.markets.map((market, midx) => { return {
          bookmaker: midx,
        }})
      })
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

    let graphs_data = [];
    const getBookmakerGraphs = () => {
      graphs_data = this.state.bookmaker_graphs.map((graph, graph_idx) => {
        let history = this.props.markets[graph.bookmaker].history.filter(update => update.outcome == this.state.outcome);
        history.push(this.props.markets[graph.bookmaker].odds[this.state.outcome]);

        return {
          label: `${this.props.markets[graph.bookmaker].bookmaker}`,
          backgroundColor: this.niceColours[graph_idx % this.niceColours.length],
          borderColor: this.niceColours[graph_idx % this.niceColours.length],
          data: history.map(update => ({x: update.last_update, y: update.odds })),
          showLine: true,
          showLabel: true,
          tension: 0.2
        };
      });
    }

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

    if (this.state.bookmaker_graphs_on)
      getBookmakerGraphs();

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
      <Card type='inner'>
        <Row>
          <Col span={2}>
            <h2>Event: </h2>
          </Col>
          <Col>
            <Select style={{width: 170}} defaultValue={ this.props.outcomes[0] }  onChange={(value) => this.setState({outcome: value})} >
              { this.props.outcomes.map(outcome => <Option key={outcome}> {outcome} </Option>) }
            </Select>
          </Col>
        </Row>
      </Card>
      <br />
          
      <h3>*The timescale timezone is UTC</h3>
      <br />

      <Scatter options={options} data={data} />
      <Button onClick={() => this.setState(state => {return {arbitrage_graph: !this.state.arbitrage_graph}} )}> Toggle arbitrage profit graph </Button>
      <Button onClick={() => this.setState(state => {return {bookmaker_graphs_on: !this.state.bookmaker_graphs_on}} )}> Toggle bookmakers graphs </Button>
      <br />
      </>);
  }
}

export default HistoricalChart;