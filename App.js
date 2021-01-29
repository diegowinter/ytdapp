import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TextInput,
  Keyboard,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ToastAndroid
} from 'react-native';
import AnimatedLinearGradient from 'react-native-animated-linear-gradient'
import { SwipeablePanel } from 'rn-swipeable-panel';
import ytdl from "react-native-ytdl"
import RNBackgroundDownloader from 'react-native-background-downloader';
import * as Progress from 'react-native-progress';
import TextTicker from 'react-native-text-ticker'
import { ListItem, Icon } from 'react-native-elements'

const App = () => {
  const [panelProps, setPanelProps] = useState({
    fullWidth: true,
    openLarge: false,
    showCloseButton: false,
    closeOnTouchOutside: true,
    onClose: () => closePanel(),
    onPressCloseButton: () => closePanel()
  });
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [text, setText] = useState('');
  const [formats, setFormats] = useState([]);
  const [videoInfo, setVideoInfo] = useState({});
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const loadVideo = async () => {
    setIsLoadingVideo(true);
    Keyboard.dismiss();
    const result = ytdl.validateURL(text);
    if(result) {
      const response = await ytdl.getInfo(text);
      const result = Object.values(response.formats.reduce((a, curr) => {
        (a[curr.height] = a[curr.height] || []).push(curr);
        return a;
      },{}));
      let filteredResults = [];
      result.forEach(chunk => {
        let selectedFormat = chunk.find(element => element.container === 'mp4' &&
          element.hasVideo === true && element.hasAudio === true);
        if (selectedFormat != undefined) {
          filteredResults.push({ ...selectedFormat });
        } else {
          selectedFormat = chunk.find(element => element.container === 'mp4' &&
            element.hasVideo === true);
          if (selectedFormat != undefined) {
            filteredResults.push({ ...selectedFormat });
          } else {
            selectedFormat = chunk.find(element => element.hasVideo === true);
            if (selectedFormat != undefined) {
              filteredResults.push({ ...selectedFormat });
            } else {
              filteredResults.push(...chunk);
            }
          }
        }
      });
      setVideoInfo({
        title: response.videoDetails.title,
        channel: response.videoDetails.ownerChannelName,
        length: response.videoDetails.lengthSeconds,
        thumbnail: response.videoDetails.thumbnails[response.videoDetails.thumbnails.length - 1].url
      })
      setFormats(filteredResults);
      setIsLoadingVideo(false);
      openPanel();
    } else {
      ToastAndroid.show('Algo deu errado. O link está correto?', ToastAndroid.SHORT);
      setIsLoadingVideo(false);
    }
  }

  const openPanel = () => {
    setIsPanelActive(true);
  };

  useEffect (() => {
    console.log(videoInfo);
  }, [videoInfo]);
  
  const closePanel = () => {
    setIsPanelActive(false);
  };

  const download = async (index) => {
    //console.log(RNBackgroundDownloader.checkForExistingDownloads());
    setIsDownloading(true);
    closePanel();
    let task = RNBackgroundDownloader.download({
      id: 'file123',
      url: formats[index].url,
      destination: `${RNBackgroundDownloader.directories.documents}/thisvideoaaa.mp4`
    }).begin((expectedBytes) => {
      console.log(`Going to download ${expectedBytes} bytes!`);
      //setIsDownloading(true);
    }).progress((percent) => {
      console.log(`Downloaded: ${percent * 100}%`);
      setProgress(percent);
    }).done(() => {
      console.log('Download is done!');
      setIsDownloadComplete(true);
    }).error((error) => {
      console.log('Download canceled due to error: ', error);
      ToastAndroid.show('Error: ' + error, ToastAndroid.SHORT);
      setIsDownloading(false);
    });
    
    // task.pause();
    // task.resume();
    // task.stop();
  }

  const confirmDownload = () => {
    setIsDownloading(false);
    setIsDownloadComplete(false);
    setProgress(0);
  }

  return (
    <AnimatedLinearGradient customColors={['#c70000', '#940000', '#660000', '#380000']}
        speed={8000}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.content}>
        <Text style={styles.title}>ytdapp</Text>
        <TextInput style={styles.input}
          placeholder='Insira um link do YouTube...'
          onChangeText={text => setText(text)}/>
          <TouchableOpacity style={styles.button} onPress={() => loadVideo()} disabled={isLoadingVideo}>
            <View>
              {isLoadingVideo ? 
                <ActivityIndicator animating={isLoadingVideo} size="small" color="#fff"/>
                :
                <Text style={styles.buttonText}>Obter vídeo</Text>
              }
            </View>
          </TouchableOpacity>
        {isDownloading &&
          <Modal animationType="slide" transparent={true}>
            <View style={styles.modalFrame}>
              <View style={styles.downloadPanel}>
                <Text style={styles.panelTitle}>{isDownloadComplete ? 'Download concluído' : 'Fazendo o download...'}</Text>
                <Progress.Circle progress={progress} size={100} showsText={true} color="#fff"/>
                {
                  isDownloadComplete ?
                    <TouchableOpacity style={styles.modalButton} onPress={() => confirmDownload()}>
                      <Text style={styles.modalButtonText}>Ok</Text>
                    </TouchableOpacity>
                  :
                    <TouchableOpacity style={styles.modalButton}>
                      <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                }
              </View>
            </View>
          </Modal>
        }
      </View>
      <SwipeablePanel {...panelProps} isActive={isPanelActive} style={{ backgroundColor: '#202020' }}>
        <View style={{ marginHorizontal: 16, flexDirection: "row", marginVertical: 10 }}>
          <Image style={{ width: 160, height: 90, resizeMode: 'contain' }}source={{ uri: videoInfo.thumbnail }}></Image>
          <View style={{ marginLeft: 10, flex: 1, justifyContent: "flex-end" }}>
            <TextTicker style={styles.panelTitle} loop repeatSpacer={50} marqueeDelay={1000}>
              {videoInfo.title}
            </TextTicker>
            <TextTicker style={styles.panelSubtitle} loop repeatSpacer={50} marqueeDelay={1000}>
              {videoInfo.channel}
            </TextTicker>
          </View>
        </View>
        <Text style={styles.qualitySelectorTitle}>Opções disponíveis:</Text>
        <View style={{ marginHorizontal: 16, marginTop: 2 }}>
        { 
          formats.map((val, key) => {
            return  <ListItem key={key} bottomDivider
                      containerStyle={{ backgroundColor: "#202020"}}
                      onPress={() => download(key)}
                    >
                      <ListItem.Content>
                        <ListItem.Title style={{ color: 'white'}}>{val.container + " • " + val.height + "p"}</ListItem.Title>
                      </ListItem.Content>
                      <ListItem.Chevron />
                    </ListItem>
          })
        }
        </View>
      </SwipeablePanel>
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#ffffff',
    fontSize: 40
  },
  input: {
    height: 40,
    width: '90%',
    borderWidth: 1,
    borderColor: '#202020',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginVertical: 20
  },
  button: {
    height: 40,
    backgroundColor: '#202020',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18
  },
  panelTitle: {
    fontSize:  22,
    color: '#fff',
    marginBottom: 5
  },
  panelSubtitle: {
    fontSize:  14,
    color: '#fff',
    marginBottom: 2
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#fff',
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 1
  },
  listItemText: {
    color: '#fff'
  },
  downloadPanel: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202020',
    padding: 15
  },
  modalFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  modalButton: {
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 16
  },
  modalButtonText: {
    color: '#202020',
    fontSize: 18
  },
  qualitySelectorTitle: {
    fontSize:  22,
    color: '#fff',
    marginHorizontal: 16,
    textAlign: 'center'
  }
});

export default App;
