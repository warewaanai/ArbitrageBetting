import { Link } from 'react-router-dom'
import * as React from 'react';
import './index.scss'

class AppHeader extends React.Component {
    render() {
        return <div id="AppHeader">
            <Link to="/"><h1>Bet<span style={{color: 'red'}}>Alert</span>.pro</h1> </Link>
        </div>
    }
}

export default AppHeader;
