module.exports = function(app) {
    const invoice = require('../controller/invoice.controller');

    app.get('/api/invoices', invoice.getInvoices);
    app.get('/api/invoice/:id', invoice.getInvoice);
    app.put('/api/invoice/:id', invoice.updateInvoice);
    app.delete('/api/invoice/:id', invoice.deleteInvoice);
    app.get('/api/invoice/:id/entries', invoice.getInvoiceEntries);
    app.get('/api/invoice/:id/analyse', invoice.analyseInvoice);

    app.post('/api/invoice', invoice.create);
};