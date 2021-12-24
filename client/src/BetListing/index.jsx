import { Card } from 'antd';
import * as React from 'react';
import { BetCard } from './bet-card';

class BetListing extends React.Component {
  render() {
    console.log(this.props)
      return (<>
          <div id="BetFilter">
            <Card>
              <h1>To Do</h1>
              <ul>
                <li>Implement the odds history functionality</li>
                <li>Websocket live bet reloading</li>
                <li><s>Implement asynchronous API requests</s></li>
                <li>Implement bet filtering</li>
                <li>Arbitrage calculator UX improvement</li>
                <li><s>Migrate to mysql</s></li>
                <li>Implement something to present the historical data stats</li>
                <li>Write the arbitrage tutorial</li>
              </ul>
            </Card>
          </div>
          <br/>
          <br/>
          <br/>
          <div id="BetListing">
            {
              this.props.bets
                .filter(raw_bet => raw_bet.revenue >= 0.008)
                .sort((rb1, rb2) => rb2.revenue - rb1.revenue)
                .map(raw_bet => <BetCard {...raw_bet} key={raw_bet.name} />)
            }
          </div>
        </>);
  }
}

export default BetListing;
