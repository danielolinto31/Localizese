import React, { Component } from 'react'
import {
  PermissionsAndroid,
  Platform,
  ToastAndroid,
  View, Text, Image, Button, StyleSheet, TouchableOpacity
} from 'react-native'
import { Card, ListItem, Icon, Divider } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import NfcManager, { Ndef, ByteParser } from 'react-native-nfc-manager';
import Geolocation from 'react-native-geolocation-service';

import logoufrn from './images/logo-ufrn-60-anos.png';
import logoapp from './images/logo-app.png';

const list = [
  {
    title: 'NFC suportado:',
    icon: 'thumbs-up',
    color: '#1d9900'
  },
  {
    title: 'NFC habilitado (Android):',
    icon: 'thumbs-down',
    color: '#c80000'
  },
  {
    title: 'GPS habilitado:',
    icon: 'thumbs-up',
    color: '#1d9900'
  },
];



const RtdType = {
  URL: 0,
  TEXT: 1,
  COORDENADA: 'app/coordenadas'
};

function buildUrlPayload(valueToWrite) {
  return Ndef.encodeMessage([
    Ndef.uriRecord(valueToWrite),
  ]);
}

function buildTextPayload(valueToWrite) {
  return Ndef.encodeMessage([
    Ndef.textRecord(valueToWrite),
  ]);
}

export class Home extends Component {
  static navigationOptions = {
    // title: 'Localize-se',
  };

  constructor(props) {
    super(props);
    this.state = {
      supported: true,
      enabled: false,
      isWriting: false,
      urlToWrite: 'https://www.google.com',
      rtdType: RtdType.URL,
      parsedText: null,
      tag: {},
      region: null,
    }
  }

  hasLocationPermission = async () => {
    if (Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show('Location permission denied by user.', ToastAndroid.LONG);
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show('Location permission revoked by user.', ToastAndroid.LONG);
    }

    return false;
  }

  async componentDidMount() {

    const hasLocationPermission = await this.hasLocationPermission();
    if (hasLocationPermission) {
      Geolocation.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
        ToastAndroid.show('Minhas coordenadas ' + latitude + ' e ' + longitude, ToastAndroid.LONG);
        this.setState({
          region: {
            latitude,
            longitude,
            latitudeDelta: 0.0143,
            longitudeDelta: 0.0134
          }
        });
      },
        (error) => {
          // See error code charts below.
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 300000 }
      );
    }


    NfcManager.isSupported()
      .then(supported => {
        this.setState({ supported });
        if (supported) {
          this._startNfc();
        }
      })

    NfcManager.getLaunchTagEvent()
      .then(tag => {
        if (tag != null) {
          this.setState({ tag });
          let text = this._parseText(tag);
          this.setState({ parsedText: JSON.parse(text) });
        }
      })

    this._startDetection;
  }

  componentWillUnmount() {
    if (this._stateChangedSubscription) {
      this._stateChangedSubscription.remove();
    }
  }

  render() {
    let { supported, enabled, parsedText, region } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Animatable.View animation="pulse" iterationCount="infinite" easing="ease-out">
            <Image style={styles.imageApp} source={logoapp} />
          </Animatable.View>
          <Text style={styles.headerText}>LOCALIZE-SE</Text>
          <Divider style={{ backgroundColor: 'blue' }} />
        </View>

        <View style={styles.body}>
          <Image style={styles.imageUfrn} source={logoufrn} />

          <View style={styles.box}>

            {/* 
      https://fontawesome.com/icons
      https://react-native-training.github.io/react-native-elements/docs/getting_started.html
      https://github.com/oblador/react-native-animatable
      https://css-tricks.com/snippets/css/a-guide-to-flexbox/
    */}

            <Card containerStyle={{
              paddingHorizontal: 0, margin: 0,
              borderTopStartRadius: 20, borderTopEndRadius: 20
            }}>
              <ListItem key="1"
                title="NFC suportado:"
                rightIcon={{ name: supported ? 'thumbs-up' : 'thumbs-down', type: 'font-awesome', color: supported ? '#1d9900' : '#c80000' }}
                containerStyle={{ paddingVertical: 5 }}
              />
              <ListItem
                key="2"
                title="NFC habilitado (Android):"
                rightIcon={{ name: enabled ? 'thumbs-up' : 'thumbs-down', type: 'font-awesome', color: enabled ? '#1d9900' : '#c80000' }}
                containerStyle={{ paddingVertical: 5 }}
              />
              <ListItem
                key="3"
                title="GPS habilitado:"
                rightIcon={{ name: region ? 'thumbs-up' : 'thumbs-down', type: 'font-awesome', color: region ? '#1d9900' : '#c80000' }}
                containerStyle={{ paddingVertical: 5 }}
              />
            </Card>

            {enabled && parsedText == null &&
              <Text style={styles.boxText}>Aguardando leitura da TAG NFC...</Text>}
            {enabled && parsedText == null &&
              <Animatable.View animation="rotate" iterationCount="infinite" easing="linear" duration={3000}>
                <Icon name='spinner' type='font-awesome' color='#063e5f' />
              </Animatable.View>
            }
            {parsedText && <Text style={styles.boxText}>{`${parsedText.title}`}</Text>}
          </View>
          {!parsedText &&
            <TouchableOpacity style={styles.button} 
              activeOpacity={0.8} disabled>
              <Text style={styles.buttonText}>NAVEGAR</Text>
            </TouchableOpacity>
          }
          {parsedText &&
            <TouchableOpacity style={styles.button} 
              activeOpacity={0.8}
              onPress={() => this.props.navigation.push('Navegar', { region: region, destination: parsedText })}>
              <Text style={styles.buttonText}>NAVEGAR</Text>
            </TouchableOpacity>
          }

          <View style={styles.question}>
            <Icon name='question' type='font-awesome' color='#FFF'
              iconStyle={{ marginRight: 10, fontSize: 20 }} />
            <Text style={styles.questionText}>
              Posicione o celular próximo a tag NFC para visualizar a rota da sua posição atual até o destino desejado.
    </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Grupo:</Text>
          <Text style={styles.footerText}>Daniel Olinto / Gileno Rocha / Júlio César</Text>
        </View>
      </View>
    )
  }

  _requestFormat = () => {
    let { isWriting } = this.state;
    if (isWriting) {
      return;
    }

    this.setState({ isWriting: true });
    NfcManager.requestNdefWrite(null, { format: true })
      .then(() => console.log('format completed'))
      .catch(err => console.warn(err))
      .then(() => this.setState({ isWriting: false }));
  }

  _requestNdefWrite = () => {
    let { isWriting, urlToWrite, rtdType } = this.state;
    if (isWriting) {
      return;
    }

    let bytes;

    if (rtdType === RtdType.URL) {
      bytes = buildUrlPayload(urlToWrite);
    } else if (rtdType === RtdType.TEXT) {
      bytes = buildTextPayload(urlToWrite);
    }

    this.setState({ isWriting: true });
    NfcManager.requestNdefWrite(bytes)
      .then(() => console.log('write completed'))
      .catch(err => console.warn(err))
      .then(() => this.setState({ isWriting: false }));
  }

  _cancelNdefWrite = () => {
    this.setState({ isWriting: false });
    NfcManager.cancelNdefWrite()
      .then(() => console.log('write cancelled'))
      .catch(err => console.warn(err))
  }

  _requestAndroidBeam = () => {
    let { isWriting, urlToWrite, rtdType } = this.state;
    if (isWriting) {
      return;
    }

    let bytes;

    if (rtdType === RtdType.URL) {
      bytes = buildUrlPayload(urlToWrite);
    } else if (rtdType === RtdType.TEXT) {
      bytes = buildTextPayload(urlToWrite);
    }

    this.setState({ isWriting: true });
    NfcManager.setNdefPushMessage(bytes)
      .then(() => console.log('beam request completed'))
      .catch(err => console.warn(err))
  }

  _cancelAndroidBeam = () => {
    this.setState({ isWriting: false });
    NfcManager.setNdefPushMessage(null)
      .then(() => console.log('beam cancelled'))
      .catch(err => console.warn(err))
  }

  _startNfc() {
    NfcManager.start({
      onSessionClosedIOS: () => {
        console.log('ios session closed');
      }
    })
      .then(result => {
        console.log('start OK', result);
      })
      .catch(error => {
        console.warn('start fail', error);
        this.setState({ supported: false });
      })

    if (Platform.OS === 'android') {
      NfcManager.getLaunchTagEvent()
        .then(tag => {
          console.log('launch tag', tag);
          if (tag) {
            this.setState({ tag });
          }
        })
        .catch(err => {
          console.log(err);
        })
      NfcManager.isEnabled()
        .then(enabled => {
          this.setState({ enabled });
        })
        .catch(err => {
          console.log(err);
        })
      NfcManager.onStateChanged(
        event => {
          if (event.state === 'on') {
            this.setState({ enabled: true });
          } else if (event.state === 'off') {
            this.setState({ enabled: false });
          } else if (event.state === 'turning_on') {
            // do whatever you want
          } else if (event.state === 'turning_off') {
            // do whatever you want
          }
        }
      )
        .then(sub => {
          this._stateChangedSubscription = sub;
          // remember to call this._stateChangedSubscription.remove()
          // when you don't want to listen to this anymore
        })
        .catch(err => {
          console.warn(err);
        })
    }
  }

  _onTagDiscovered = tag => {
    console.log('Tag Discovered', tag);
    this.setState({ tag });
    let url = this._parseUri(tag);
    if (url) {
      Linking.openURL(url)
        .catch(err => {
          console.warn(err);
        })
    }

    let text = this._parseText(tag);
    this.setState({ parsedText: JSON.parse(text) });
  }

  _startDetection = () => {
    NfcManager.registerTagEvent(this._onTagDiscovered)
      .then(result => {
        console.log('registerTagEvent OK', result)
      })
      .catch(error => {
        console.warn('registerTagEvent fail', error)
      })
  }

  _stopDetection = () => {
    NfcManager.unregisterTagEvent()
      .then(result => {
        console.log('unregisterTagEvent OK', result)
      })
      .catch(error => {
        console.warn('unregisterTagEvent fail', error)
      })
  }

  _clearMessages = () => {
    this.setState({ tag: null });
  }

  _goToNfcSetting = () => {
    if (Platform.OS === 'android') {
      NfcManager.goToNfcSetting()
        .then(result => {
          console.log('goToNfcSetting OK', result)
        })
        .catch(error => {
          console.warn('goToNfcSetting fail', error)
        })
    }
  }

  _parseUri = (tag) => {
    try {
      if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
        return Ndef.uri.decodePayload(tag.ndefMessage[0].payload);
      }
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  _parseText = (tag) => {
    try {
      let str = ByteParser.byteToString(tag.ndefMessage[0].payload);
      console.warn('string: ' + str);
      if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
        return Ndef.text.decodePayload(tag.ndefMessage[0].payload);
      }
      if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_MIME_MEDIA, 'app/coordenadas')) {
        coord = Ndef.text.decodePayload(tag.ndefMessage[0].payload);
        console.warn(coord);
        return str;
      }
    } catch (e) {
      console.log(e);
    }
    return null;
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#063e5f',
    alignItems: 'center',
    padding: 30
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingBottom: 20
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF'
  },
  imageApp: {
    width: 40,
    height: 40,
    marginRight: 20
  },
  body: {
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  imageUfrn: {
    width: 140,
    height: 45,
    marginBottom: 10
  },
  box: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF',
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
  },
  boxText: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 50
  },
  button: {
    height: 50,
    alignSelf: 'stretch',
    backgroundColor: '#def3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20
  },
  buttonText: {
    color: '#063e5f',
    fontWeight: 'bold',
    fontSize: 16
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10
  },
  questionText: {
    color: '#FFF',
    fontSize: 12,
  },
  footer: {
    marginTop: 20,
  },
  footerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center'
  }
});

export default Home;