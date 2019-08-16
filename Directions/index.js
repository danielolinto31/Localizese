import React from "react";
import MapViewDirections from "react-native-maps-directions";

const Directions = ({ destination, origin, onReady }) => (
  <MapViewDirections
    destination={destination}
    origin={origin}
    onReady={onReady}
    apikey="<Coloque aqui sua chave API do Google>"
    strokeWidth={3}
    strokeColor="#222"
  />
);

export default Directions;
