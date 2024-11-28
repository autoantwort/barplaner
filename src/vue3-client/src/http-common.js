import Axios from 'axios';

let axios = Axios.create({
  //baseURL: "http://localhost:8083/api",
  baseURL: 'https://orga.symposion.hilton.rwth-aachen.de/api',
  headers: {
    'Content-type': 'application/json',
  },
});
axios.getFile = fileId => {
  return axios.defaults.baseURL + '/file/' + fileId;
};
axios.getImage = imageId => {
  return axios.getFile(imageId);
};
axios.defaults.withCredentials = true;
//axios.defaults.baseWsURL = 'ws://localhost:8083';
axios.defaults.baseWsURL = 'wss://orga.symposion.hilton.rwth-aachen.de';

export default axios;
