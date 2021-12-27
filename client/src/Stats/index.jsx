import * as React from 'react'
import BetCard from '../BetCard';

class Stats extends React.Component {
    render() {
        return <>
            <h1>Bet List:</h1>
            { this.props.bets.map(bet => <BetCard {...bet} />) }
        </>
    }
}

export default Stats;