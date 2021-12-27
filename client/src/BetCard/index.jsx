import * as React from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Table, Select, Row, Col } from 'antd'
import Rainbow from 'rainbowvis.js'
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

import './bet-card.scss'
import eu_flag from '../static/eu.png'
import us_flag from '../static/us.png'
import uk_flag from '../static/uk.png'

import ArbitrageDetails from './arbitrage-details'
import HistoricalChart from '../HistoricalChart'

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
  
    props.outcomes.forEach((outcome, outcome_idx) => {
      const choice_idx = outcome_idx.toString();

      const column = {
        title: outcome,
        dataIndex: outcome,
        key: outcome,
        sorter: (a, b) => (parseFloat(a[outcome]) - parseFloat(b[outcome])),
        sortDirections: ['ascend', 'descend', 'ascend']
      }

      columns.push(column);
    });
  
    props.markets.forEach((market, market_idx) => {
      let odds_dict = {}
  
      for (const [outcome, odds] of Object.entries(market.odds))
        odds_dict[outcome] = odds.odds;
  
      allData.push({
        key: market.book,
        bookmaker: <><img width={20} alt={market.region} src={flags[market.region]}/> {market.bookmaker}</>,
        last_update: new Date(market.last_update + "Z").toLocaleString(),
        ...odds_dict
      })
    });

    this.allOdds = {
      columns: columns
    }

    this.state = {
      props: props,
      allData: allData,
      charts: [<HistoricalChart key={0} outcomes={props.outcomes} markets={props.markets} />]
    }
  }

  componentDidUpdate() {
    if (this.state.props !== this.props) {
      
      let allData = []
    
      this.props.markets.forEach((market) => {
        let odds_dict = {}
    
        for (const [outcome, odds] of Object.entries(market.odds))
          odds_dict[outcome] = odds.odds;
    
        allData.push({
          key: market.book,
          bookmaker: <><img width={20} alt={market.region} src={flags[market.region]}/> {market.bookmaker}</>,
          last_update: new Date(market.last_update + "Z").toLocaleString(),
          ...odds_dict
        })
      });

      this.setState({
        props: this.props,
        allData: allData
      })

    }
  }

  render() {    
    const addChart = () => {
      let new_charts = this.state.charts;
      new_charts.push({});
      console.log(new_charts);
      this.setState({
        charts: new_charts
      })
    }

    return (
      <div className='BetCardDetails'>
        <ArbitrageDetails markets={this.props.markets} outcomes={this.props.outcomes} />        

        <br/><hr /><br/>

        <div>
          <h1>Odds history:</h1>
          { this.state.charts.map(chart => <HistoricalChart outcomes={this.props.outcomes} markets={this.props.markets} />) }
          <br />
          <Button onClick={addChart}> Add histroical chart </Button>
          <br />
        </div>
        
        <br/><hr /><br/>

        <h1>All Active Odds:</h1>
        <Table columns={this.allOdds.columns} dataSource={this.state.allData} pagination={false} />
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
      detailed: (this.props.detailed === undefined ? false : true)
    }
  }


  Title = () => {
    let rb = new Rainbow();
    rb.setNumberRange(-0.1, 10);
    rb.setSpectrum('red', '#dddd00', 'green', '#00aaff')

    const start_date = new Date(this.props.start_time);
    const start = this.props.live ?
      <span className='LiveEvent'>LIVE BET</span> :
      <> {start_date.toLocaleString()} </>

    return <div className='BetCardTitle'>
      <div className='BetTitleData'>
        <div className='BetTitleName'> <Link to={`/event/${this.props.id}`} style={{ textDecoration: 'none', color: 'black' }} >{this.props.name}</Link> </div>
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
        <h3> {this.props.description} - {this.props.sport} </h3>
        {
          this.state.detailed  === false?
            <Button onClick={() => this.setState({detailed: true})}> See Odds </Button> :
            <CardDetails {...this.props} close={() => this.setState({detailed: false})} />
        }
      </Card>

      <br />
    </>
  }
}

export default BetCard;
