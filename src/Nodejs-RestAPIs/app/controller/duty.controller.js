import { computeRatio } from '../util/cleaning';

// Update a Bar
export function list(req, res) {
    computeRatio().then((users) => {
        res.send(users);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error -> " + err);
    });
}