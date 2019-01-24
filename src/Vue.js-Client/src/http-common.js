import Axios from "axios";

let axios = Axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-type": "application/json",
    }
});
axios.defaults.withCredentials = true;

export default axios;