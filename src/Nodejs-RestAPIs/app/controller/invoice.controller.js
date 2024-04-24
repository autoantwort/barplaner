const db = require('../config/db.config.js');
const Image = db.Image;
const Item = db.stock.Item;
const StockChange = db.stock.Change;
const Invoice = db.stock.Invoice;
const InvoiceEntry = db.stock.InvoiceEntry;
const Files = db.File;
const Op = db.Sequelize.Op;
const File = require("./file.controller");
const Axios = require("axios");
const PDFParser = require("pdf2json");
const analyser = require("../util/analyseBarcode");

// Post a Invoice
exports.create = async (req, res) => {
    if (!req.files || Object.keys(req.files).length !== 1) {
        return res.status(400).send("The request must contain one pdf file");
    }
    const rFile = req.files[Object.keys(req.files)[0]];
    if (rFile.mimetype !== "application/pdf") {
        return res.status(400).send("The file attachment must have the mime type application/pdf");
    }
    try {
        const invoices = await Invoice.findAll({
            where: {
                fileId: rFile.md5,
            },
        });
        if (invoices.length !== 0) {
            return res.status(409).send({ text: "For this file a invoice already exits.", invoice: invoices[0] });
        }
        let file = await Files.findByPk(rFile.md5); // vielleicht wurde die Datei bereits in einem anderen Kontext hochgelanden
        if (file === null) {
            file = await File.coreCreateFileFromReqFile(rFile);
        }
        Invoice.create({
            fileId: file.id,
        }).then(i => res.status(201).send(i)).catch(e => {
            res.status(400).send("Error:" + e);
            file.destroy();
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error : " + error);
    }
};

exports.getInvoice = (req, res) => {
    Invoice.findByPk(req.params.id).then(invoice => {
        res.send(invoice);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

exports.updateInvoice = (req, res) => {
    Invoice.findByPk(req.params.id).then(invoice => {
        invoice.update(req.body)
            .then(() => res.send(invoice))
            .catch(err => res.status(500).send("Error -> " + err));
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get invoices
exports.getInvoices = (req, res) => {
    Invoice.findAll({
        order: [
            ["deliveryDate", "DESC"],
        ],
    }).then(invoices => {
        res.send(invoices);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

exports.getInvoiceEntries = (req, res) => {
    InvoiceEntry.findAll({
        where: { invoiceId: req.params.id },
        include: [{
            model: Item,
            include: [{
                model: Image,
            }],
        }, {
            model: StockChange,
        }],
    }).then(invoiceEntries => {
        res.send(invoiceEntries);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (invoice === null) {
            return res.status(404).send("No Invoice with id " + req.params.id + " found");
        }
        let count = await InvoiceEntry.count({
            where: {
                invoiceId: invoice.id,
            }
        });
        if (count > 0) {
            return res.status(400).send("There exists " + count + " InvoiceEntr(y|ies) that references the invoice. Can not delete the invoice.");
        }
        await invoice.destroy();
        res.send("Deleted");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error:" + error);
    }
};

exports.setItem = async (req, res) => {
    try {
        if (req.params.id === undefined) {
            return res.status(400).send("No id given");
        }
        const entries = await InvoiceEntry.update({
            stockItemId: req.body.itemId,
        }, {
            where: {
                id: req.params.id,
            },
        });
        if (entries[0] === 0) {
            return res.status(404).send("No Invoice Entry with id " + req.params.id + " found");
        }
        res.send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error:" + error);
    }
};

exports.unlinkItemFromEntry = async (req, res) => {
    try {
        if (req.params.id === undefined) {
            return res.status(400).send("No id given");
        }
        const entry = await InvoiceEntry.findByPk(req.params.id, { include: [{ model: Item }] });
        if (entry === null) {
            return res.status(404).send("No Invoice Entry with id " + req.params.id + " found");
        }
        const item = entry.stockItem;
        if (item === null) {
            return res.status(200).send("The Invoice Entry has no item.");
        }
        entry.stockItemId = null;
        await entry.save();
        if (item.barcode === entry.gtin) {
            item.barcode = null;
            await item.save();
        }
        if (item.barcodePack === entry.gtinPack) {
            item.barcodePack = null;
            await item.save();
        }
        res.send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error:" + error);
    }
};

exports.linkItemWithEntry = async (req, res) => {
    try {
        if (req.params.id === undefined) {
            return res.status(400).send("No entry id given");
        }
        if (req.body.itemId === undefined) {
            return res.status(400).send("No itemId given");
        }
        const entry = await InvoiceEntry.findByPk(req.params.id, { include: [{ model: Item }, { model: Invoice }] });
        if (entry === null) {
            return res.status(404).send("No Invoice Entry with id " + req.params.id + " found");
        }
        const item = await Item.findByPk(req.body.itemId);
        if (item === null) {
            return res.status(404).send("The Item with id" + req.body.itemId + " does not exist.");
        }
        entry.stockItemId = req.body.itemId;
        await entry.save();
        if (item.barcode === null) {
            item.barcode = entry.gtin;
        }
        if (item.barcodePack === null) {
            item.barcodePack = entry.gtinPack;
        }
        if (item.articleNumber === null) {
            item.articleNumber = entry.articleNumber;
        }
        if (item.seller === null) {
            item.seller = entry.invoice.seller;
        }
        await item.save();
        res.send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error:" + error);
    }
};


const parseGermanDate = s => {
    //  01234567890123456
    //  19.09.2019 14:02
    return new Date(Number(s.substring(6, 10)), s[3] + s[4] - 1, s[0] + s[1], s[11] + s[12], s[14] + s[15]);
}

const exportForMetro = (invoice, text) => {
    return new Promise(async (resolve, reject) => {
        const literRegex = /^([0-9]+,[0-9]+)l?/;
        const liter2Regex = /^([0-9]+(,[0-9]+)?)l/;
        const kgRegex = /([0-9]+(,[0-9]+)?)kg/i;
        const mlRegex = /([0-9]+)ml/;
        const grammRegex = /([0-9]+)g/;
        const packRegex = /([0-9]+)x([0-9]+)g/;
        const alkRegex = /[0-9]{2},[0-9]$/;
        const stückRegex = /ES\s+([0-9]+)\s*$/;
        const lines = text.split('\n');
        const taxRegex = /([A-Z])= ?([0-9]{1,2},[0-9]{2})/g;
        const taxMap = {}; // a mapping from tax A, B, ... to values 19%, 7% (tax can change)    
        const toNumber = s => Number(s.replace(',', '.'))
        let m;
        do {
            m = taxRegex.exec(text);
            if (m) {
                taxMap[m[1]] = 1 + toNumber(m[2]) / 100;
            }
        } while (m);
        invoice.invoiceDate = parseGermanDate(lines[1].substring(118, 118 + 16));
        invoice.deliveryDate = parseGermanDate(lines[3].substring(118, 118 + 16));
        invoice.seller = "Metro";
        await invoice.save();
        const entryCreationPromises = [];
        for (let i = 23; i < lines.length; ++i) {
            const line = lines[i];
            // console.log("line", line);
            if (line.startsWith("  ") && line[8] === '.') {
                const item = {};
                item.articleNumber = line.substring(2, 8);
                const barcode = line.substring(11, 24).trim();
                const pack = line.substring(58, 60);
                const barcodeIsPack = (pack === "KT" || pack === "TY");
                let bez = line.substring(26, 56);
                item.einzelPreis = toNumber(line.substring(63, 71));
                item.kolli = toNumber(line.substring(77, 82)); // Sachen in einer Packung. Z.B. 12 Flaschen im Kasten
                item.menge = toNumber(line.substring(97, 100));
                item.tax = line[114]; // 
                {
                    let result = alkRegex.exec(bez);
                    if (result) {
                        item.alk = toNumber(result[0]);
                        bez = bez.replace(result[0], '');
                    }
                    if (result = liter2Regex.exec(bez)) { // must end with a 'l'
                        item.amount = toNumber(result[1]) * 1000;
                        item.unit = 'ml'
                        bez = bez.replace(result[0], '');
                    } else if (result = literRegex.exec(bez)) {
                        item.amount = toNumber(result[1]) * 1000;
                        item.unit = 'ml'
                        bez = bez.replace(result[0], '');
                    } else if (result = mlRegex.exec(bez)) {
                        item.amount = result[1];
                        item.unit = 'ml'
                        bez = bez.replace(result[0], '');
                    } else if (result = kgRegex.exec(bez)) {
                        item.amount = toNumber(result[1]) * 1000;
                        item.unit = 'gramm'
                        bez = bez.replace(result[0], '');
                    } else if (result = grammRegex.exec(bez)) {
                        item.amount = toNumber(result[1]);
                        item.unit = 'gramm'
                        bez = bez.replace(result[0], '');
                    } else if (pack === "PA" && (result = packRegex.exec(bez))) {
                        item.amount = toNumber(result[1]) * toNumber(result[2]);
                        bez = bez.replace(result[0], '');
                    } else if (pack === "ST" && (result = stückRegex.exec(bez))) {
                        item.amount = toNumber(result[1]);
                        bez = bez.replace(result[0], '');
                    }
                }
                if (pack === "KG") { // in kolli ist immer die Menge gespeichert. Ist jetzt die Frage: Kaufen wir x mal 1kg oder 1 mal x kg? Wir kaufen x mal 1kg
                    item.amount = 1000;
                    item.unit = 'gramm';
                    bez = bez.replace(/ CA.?([0-9]+,[0-9]+)? *$/, ''); // wir haben oft ein ca in der bez. Überflüssig
                }
                bez = bez.trim().replace(/ +/g, " ").toLowerCase().replace(/ue/g, "ü").replace(/ae/g, "ä").replace(/oe/g, "ö");
                try {
                    bez = bez.split(' ').map(word => word[0].toUpperCase() + word.substr(1)).join(' ');
                    item.bez = bez.split('-').map(word => word.length === 0 ? '' : word[0].toUpperCase() + word.substr(1)).join('-');
                } catch (error) {
                    console.error(bez, error);
                    item.bez = bez;
                }
                // create an array of promises, we are finish when all items are completely created
                entryCreationPromises.push(new Promise((resolve, reject) => {
                    // find an equal invoice entry with an itemId 
                    InvoiceEntry.findOne({
                        attributes: ["stockItemId"],
                        where: {
                            articleNumber: item.articleNumber,
                            [Op.or]: [
                                { gtin: barcode },
                                { gtinPack: barcode },
                            ],
                            stockItemId: {
                                [Op.not]: null,
                            },
                        },
                        include: [{
                            model: Invoice,
                            attributes: [],
                            where: {
                                seller: "Metro",
                            },
                            require: true,
                        }, {
                            model: Item,
                        }]
                    }).then(async entry => {
                        if (entry === null) {
                            // noch gab es kein InvoiceEntry der gemappt wurde, aber vielleicht gibt es ja ein Item von einem Seller mit dem richtigen Barcode
                            const items = await Item.findAll({
                                where: [
                                    {
                                        [Op.or]: [
                                            { barcode: barcode },
                                            { barcodePack: barcode },
                                        ]
                                    },
                                    {
                                        [Op.or]: [{
                                            seller: null,
                                        }, {
                                            seller: "Metro",
                                        }]
                                    },
                                ]
                            });
                            if (items.length === 1) {
                                entry = { stockItemId: items[0].id, stockItem: items[0] };
                            }
                        }
                        InvoiceEntry.create({
                            itemDescription: item.bez,
                            articleNumber: item.articleNumber,
                            ...(barcodeIsPack ? { gtinPack: barcode } : { gtin: barcode }),
                            quantity: item.menge * item.kolli,
                            netPrice: item.einzelPreis,
                            brottoPrice: item.einzelPreis * taxMap[item.tax],
                            amount: item.amount,
                            unit: item.unit,
                            invoiceId: invoice.id,
                            stockItemId: entry ? entry.stockItemId : null,
                            alcoholByVolume: item.alk,
                        }).then(invoiceEntry => {
                            console.log("invoiceEntry", invoiceEntry);
                            analyser.getItemFromMetro(item.articleNumber).then((item) => {
                                console.log("invoiceEntry + item", invoiceEntry, item);
                                if (item) {
                                    if (invoiceEntry.amount === null) {
                                        invoiceEntry.amount = item.amount;
                                        invoiceEntry.unit = item.unit;
                                    }
                                    invoiceEntry.productSite = item.productSite;
                                    invoiceEntry.images = JSON.stringify(item.images);
                                    invoiceEntry.save().then(resolve).catch(err => {
                                        console.error(err);
                                        resolve(); // don't fail completely because of this
                                    });
                                } else {
                                    resolve();
                                }
                            }).catch(err => {
                                console.error("Network Error", err);
                                resolve(); // don't fail completely because of this
                            });
                        }).catch(e => {
                            console.error(e);
                            reject(e);
                        });
                    }).catch(e => {
                        console.error(e);
                        reject(e);
                    });
                }));
            }
        }
        Promise.all(entryCreationPromises).then(resolve).catch(reject);
    });
};

exports.analyseInvoice = (req, res) => {
    Invoice.findByPk(req.params.id).then(async invoice => {
        if (invoice === null)
            return res.status(404).send("No invoice with id: " + req.params.id);
        const count = await InvoiceEntry.count({ where: { invoiceId: invoice.id } });
        if (count > 0) {
            return res.status(400).send("Analysis has already been carried out");
        }
        let pdfParser = new PDFParser(null /* context */, true /* needRawText */);
        pdfParser.on("pdfParser_dataError", errData => res.status(500).send("Error while parsing PDF: " + errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const content = pdfParser.getRawTextContent();
            if (content.startsWith("METRO Deutschland GmbH")) {
                exportForMetro(invoice, content).then(() => {
                    InvoiceEntry.findAll({
                        where: {
                            invoiceId: invoice.id,
                        },
                        include: [{
                            model: Item,
                        }, {
                            model: StockChange,
                        }],
                    }).then(entries => {
                        res.send({ invoice, entries });
                    }).catch(error => {
                        console.error(error);
                        res.send(500).send("Error", error);
                    });
                });
            } else {
                res.status(501).send("can not parse this invoice");
            }
        });
        pdfParser.loadPDF(File.getFilePathForId(invoice.fileId));
    }).catch(e => res.status(500).send("Error: " + e))
};

exports.analyseArticleIdentifier = async (req, res) => {
    res.send(await analyser.analyseBarcode(req.params.identifier));
};
