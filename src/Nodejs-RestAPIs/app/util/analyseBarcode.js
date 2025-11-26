import axios from "axios";

import { parse } from 'node-html-parser';
import { promisify } from 'node:util';
const execFile = promisify(require('node:child_process').execFile);

const toNumber = s => Number(s.replace(',', '.'));

const alkRegex = /([0-9]{1,2}(,[0-9]+)?) *%/;
const fillAlkFromName = (item) => {
    const regexResult = alkRegex.exec(item.name);
    if (regexResult) {
        item.alk = toNumber(regexResult[1]);
    }
};

const literRegex = /([0-9]+(,[0-9]+)?) *[lL]/;
const fillAmountFromName = (item) => {
    const regexResult = literRegex.exec(item.name);
    if (regexResult) {
        item.amount = toNumber(regexResult[1]) * 1000;
        item.unit = "ml";
    }
}

export async function getItemFromMetro(articleIdentifier, bundleSize = undefined) {
    // habe auf der Seite https://produkte.metro.de/shop/search mal geschaut welche Requests so gemacht werden wenn man ein Produkt sucht
    const storeId = "00017";
    let res = await axios.get("https://produkte.metro.de/searchdiscover/articlesearch/search?language=de-DE&country=DE&categories=false&facets=false&storeId=" + storeId + "&query=" + articleIdentifier);
    let data = res.data;
    if (data.resultIds.length === 0) { // No item found for the article number
        return null;
    } else if (data.resultIds.length > 1) {
        console.warn("Found to many metro items: ", data.resultIds, " for Art.Nr./Barcode ", articleIdentifier);
        return null;
    }
    const qids = data.resultIds.map(i => "ids=" + i).join("&");
    res = await axios.get("https://produkte.metro.de/evaluate.article.v1/betty-variants?country=DE&locale=de-DE&storeIds=" + storeId + "&details=true&" + qids, {
        headers: {
            "CallTreeId": "BTEV-548fafde-ff26-4420-a251-6ee5230188d5",
            "Host": "produkte.metro.de",
        }
    });

    data = res.data;
    for (let id in data.result) {
        const article = data.result[id];
        for (let variantKey in article.variants) { // gibt in der Regel nur eine
            const variant = article.variants[variantKey];
            const bundles = Object.values(variant.bundles);
            bundles.sort((a, b) => toNumber(a.bundleSize) - toNumber(b.bundleSize)); // sortiere nach Packungsgröße, kleinste zuerst
            for (let bundleId in bundles) { // Packungsgrößen, z.B. ein Kasten und eine Flasche
                const bundle = bundles[bundleId];
                if (bundleSize && toNumber(bundle.bundleSize) !== bundleSize) {
                    continue; // wir haben wohl ein anderes bundle gekauft
                }
                const result = {};
                const v = bundle.contentData.netContentVolume;
                if (v) {
                    if (v.uom === "ML") {
                        result.unit = "ml";
                    } else if (v.uom === "GRAM") {
                        result.unit = "gramm";
                    }
                    result.amount = v.value;
                }
                if (bundle.stores[storeId]) {
                    const info = bundle.stores[storeId].sellingPriceInfo
                    if (info) {
                        result.netPrice = info.netPrice;
                        result.grossPrice = info.grossPrice;
                    }
                }
                result.name = variant.description;
                result.seller = "Metro";
                result.articleNumber = bundle.customerDisplayId;
                fillAlkFromName(result);
                result.productSite = "https://produkte.metro.de/shop/pv/" + id + "/" + variantKey + "/" + bundleId;
                result.images = bundle.details.media.images.map(o => o.url.replace("{?w,h,mode}", ""));
                return result; // stop search
            }
        }
    }
    return null;
}

function PromiseTimeout(delayms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delayms);
    });
}

let userAgentIndex = 0;
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]
export async function analyseBarcode(barcode, bundleSize = undefined) {
    const metroResult = await getItemFromMetro(barcode, bundleSize);
    if (metroResult) {
        return metroResult;
    }
    // Auf der Metro Seite nichts gefunden, fragen wir mal DuckDuckGo
    // https://duckduckgo.com/params
    // Axios.get wird von DuckDuckGo geblockt, egal was ich probiert habe => curl benutzen
    const curlUrl = `https://html.duckduckgo.com/html/?kl=de-de&kd=-1&q=${encodeURIComponent(barcode)}`;
    console.debug("curl ", curlUrl);
    let res = await execFile("curl", ["--user-agent", userAgents[userAgentIndex++ % userAgents.length], curlUrl]);
    if (res.stdout.indexOf("Unfortunately, bots use DuckDuckGo too") !== -1) {
        console.error("DuckDuckGo blocked us, wait 10 seconds and try again");
        await PromiseTimeout(10000);
        res = await execFile("curl", ["--user-agent", userAgents[userAgentIndex++ % userAgents.length], curlUrl]);
    }
    const ddgRoot = parse(res.stdout);
    // console.debug(res.stdout)
    const linkElements = ddgRoot.querySelectorAll(".result__url");
    if (linkElements.length === 0) {
        return null;
    }
    const href = linkElements[0].getAttribute("href");
    // Fragen einfach mal das erste Ergebnis und suchen nach Metadaten
    console.debug("curl '" + href + "'");
    res = await execFile("curl", [href]);
    const siteRoot = parse(res.stdout);
    // Vielleicht ist die Seite cool und hat ein application/ld+json element
    for (let elem of siteRoot.querySelectorAll("script[type='application/ld+json']")) {
        try {
            let jsonld = JSON.parse(elem.innerText);
            if (Array.isArray(jsonld)) { // bei einer Seite war es nen Array, wir nehmen einfach das erste Element
                jsonld = jsonld[0];
            }
            if (jsonld["@type"] === "Product") {
                // See https://schema.org/Product
                const result = {};
                result.name = jsonld.name;
                result.productSite = href;
                result.images = [jsonld.image];
                fillAlkFromName(result);
                fillAmountFromName(result);
                if (jsonld.offers) {
                    result.grossPrice = Number(jsonld.offers.price);
                    result.netPrice = result.grossPrice / 1.19;
                }
                console.debug("Found product from jsonld: ", result);
                return result;
            }
        } catch (e) {
            console.error("Error parsing jsonld: ", e);
        }
    }
    // Hat sie scheinbar nicht, dann schauen wir uns die meta tags an
    const result = {};
    for (let elem of siteRoot.querySelectorAll("meta[property]")) {
        const property = elem.getAttribute("property");
        const content = elem.getAttribute("content");
        if (property === "og:title") {
            result.name = content;
            fillAlkFromName(result);
            fillAmountFromName(result);
        } else if (property === "og:image") {
            result.images = [content];
        } else if (property === "og:url") {
            result.productSite = content;
        } else if (property === "og:price:amount") {
            result.grossPrice = toNumber(content);
            result.netPrice = result.grossPrice / 1.19;
        } else if (property === "og:type") {
            if (content !== "article" && content.indexOf(":") === -1) {
                return null;
            }
        }
    }
    return result.name ? result : null;
}