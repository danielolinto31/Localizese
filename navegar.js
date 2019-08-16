import React, { Component, Fragment } from "react";
import {
    PermissionsAndroid,
    Platform,
    ToastAndroid,
    View,
    Image
} from 'react-native';
import MapView, { Marker } from "react-native-maps";
import Geocoder from "react-native-geocoding";

import { getPixelSize } from "./utils";

import Directions from "./Directions";

import markerImage from "./assets/marker.png";
import backImage from "./assets/back.png";

import {
    Back,
    LocationBox,
    LocationText,
    LocationTimeBox,
    LocationTimeText,
    LocationTimeTextSmall
} from "./estilos/styles";

Geocoder.init("<Coloque aqui sua chave API do Google>");

export default class Map extends Component {
    constructor(props) {
        super(props);
        const { navigation } = props;
        const region = navigation.getParam('region');
        const destination = navigation.getParam('destination');
        this.state = {
            region: region,
            destination: destination,
            duration: null,
            location: null
        };
    Geocoder.from( region.latitude, region.longitude ).then(response => {
            const address = response.results[0].formatted_address;
            const location = address.substring(0, address.indexOf(","));
            this.state = {
                region: region,
                destination: destination,
                duration: null,
                location: location
            };
        });

    }

    componentDidMount() {
    }

    handleBack = () => {
        this.setState({ destination: null });
    };

    render() {
        const { region, destination, duration, location } = this.state;

        return (
            <View style={{ flex: 1 }}>
                <MapView
                    style={{ flex: 1 }}
                    region={region}
                    showsUserLocation
                    loadingEnabled
                    ref={el => (this.mapView = el)}
                >
                    {destination && (
                        <Fragment>
                            <Directions
                                origin={region}
                                destination={destination}
                                onReady={result => {
                                    this.setState({ duration: Math.floor(result.duration) });

                                    this.mapView.fitToCoordinates(result.coordinates, {
                                        edgePadding: {
                                            right: getPixelSize(50),
                                            left: getPixelSize(50),
                                            top: getPixelSize(50),
                                            bottom: getPixelSize(350)
                                        }
                                    });
                                }}
                            />
                            <Marker
                                coordinate={destination}
                                anchor={{ x: 0, y: 0 }}
                                image={markerImage}
                            >
                                <LocationBox>
                                    <LocationText>{destination.title}</LocationText>
                                </LocationBox>
                            </Marker>

                            <Marker coordinate={region} anchor={{ x: 0, y: 0 }}>
                                <LocationBox>
                                    <LocationTimeBox>
                                        <LocationTimeText>{duration}</LocationTimeText>
                                        <LocationTimeTextSmall>MIN</LocationTimeTextSmall>
                                    </LocationTimeBox>
                                    <LocationText>{location}</LocationText>
                                </LocationBox>
                            </Marker>
                        </Fragment>
                    )}
                </MapView>

            </View>
        );
    }
}
