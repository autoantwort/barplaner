import { getInvoices, getInvoice, updateInvoice, deleteInvoice, getInvoiceEntries, analyseInvoice, analyseArticleIdentifier, create, unlinkItemFromEntry, linkItemWithEntry, setItem } from '../controller/invoice.controller';
export default function (app) {

    app.get('/api/invoices', getInvoices);
    app.get('/api/invoice/:id', getInvoice);
    app.put('/api/invoice/:id', updateInvoice);
    app.delete('/api/invoice/:id', deleteInvoice);
    app.get('/api/invoice/:id/entries', getInvoiceEntries);
    app.get('/api/invoice/:id/analyse', analyseInvoice);
    app.get('/api/invoice/analyseArticleIdentifier/:identifier', analyseArticleIdentifier);

    app.post('/api/invoice', create);
    app.delete('/api/invoice/entry/:id/itemLink', unlinkItemFromEntry);
    app.post('/api/invoice/entry/:id/itemLink', linkItemWithEntry);

    app.put('/api/invoiceEntry/:id', setItem);
};
