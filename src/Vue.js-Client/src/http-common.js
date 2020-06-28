import Axios from "axios";

let axios = Axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-type": "application/json",
    }
});
axios.defaults.withCredentials = true;
axios.defaults.baseWsURL = "wss://orga.symposion.hilton.rwth-aachen.de";

export default axios;