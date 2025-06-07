import { deleteItemRequest } from "../controller/itemRequest.controller";

export function registerItemRequestsRoutes(app) {
    app.delete('/api/itemRequest/:id', deleteItemRequest);
};
