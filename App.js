import React from 'react'
import { createStackNavigator, createAppContainer } from "react-navigation";

import { EscreverTag } from "./escrever-tag";
import { LerTag } from './ler-tag';
import Home from './inicial';
import Map from './navegar';


function strToBytes(str) {
    let result = [];
    for (let i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
    }
    return result;
}

function buildTextPayload(valueToWrite) {
    const textBytes = strToBytes(valueToWrite);
    // in this example. we always use `en`
    const headerBytes = [0xD1, 0x01, (textBytes.length + 3), 0x54, 0x02, 0x65, 0x6e];
    return [...headerBytes, ...textBytes];
}

const AppNavigator = createStackNavigator(
    {
        Home: Home,
        LerTag: LerTag,
        EscreverTag: EscreverTag,
        Navegar: Map
    },
    {
        initialRouteName: "Home"
    }
    );
  
const AppContainer = createAppContainer(AppNavigator);

export class App extends React.Component {
  render() {
    return <AppContainer />;
  }
}

export default App;