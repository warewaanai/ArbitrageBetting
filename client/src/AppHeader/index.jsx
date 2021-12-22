import * as React from 'react';
import './index.scss'

class AppHeader extends React.Component {
    render() {
        return <div id="AppHeader">
            <h1>Bet<span style={{color: 'red'}}>Alert</span>.pro</h1>
        </div>
    }
}

export default AppHeader;
