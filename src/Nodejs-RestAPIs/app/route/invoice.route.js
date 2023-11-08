module.exports = function(app) {
    const invoice = require('../controller/invoice.controller');

    app.get('/api/invoices', invoice.getInvoices);
    app.get('/api/invoice/:id', invoice.getInvoice);
    app.put('/api/invoice/:id', invoice.updateInvoice);
    app.delete('/api/invoice/:id', invoice.deleteInvoice);
    app.get('/api/invoice/:id/entries', invoice.getInvoiceEntries);
    app.get('/api/invoice/:id/analyse', invoice.analyseInvoice);
    app.get('/api/invoice/analyseArticleIdentifier/:identifier', invoice.analyseArticleIdentifier);

    app.post('/api/invoice', invoice.create);
    app.delete('/api/invoice/entry/:id/itemLink', invoice.unlinkItemFromEntry);
    app.post('/api/invoice/entry/:id/itemLink', invoice.linkItemWithEntry);

    app.put('/api/invoiceEntry/:id', invoice.setItem);
};