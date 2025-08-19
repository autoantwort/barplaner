import { Bar } from '../model/bar.model';
import { computeRatio } from '../util/cleaning';
import { sendBarInfo } from '../util/telegramBarFeedback';

// Update a Bar
export function list(req, res) {
    computeRatio().then((users) => {
        res.send(users);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error -> " + err);
    });
}

export async function sendTelegramNewsletter(req, res) {
    const bar = await Bar.findByPk(req.params.id);
    if (!bar) {
        return res.status(404).send(`Bar with ${req.params.id} not found`);
    }
    if (bar.start < new Date()) {
        return res.status(400).send("Bar has already started");
    }
    await sendBarInfo(bar)
    res.status(200).send("Newsletter sent successfully");
}
