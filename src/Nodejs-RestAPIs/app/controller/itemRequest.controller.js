import { ItemRequest } from "../model/stockManagement/itemRequest.model";
import { deleteRequest } from "../util/itemRequestUtil";

export async function deleteItemRequest(req, res) {
    try {
        const itemRequest = await ItemRequest.findByPk(req.params.id);
        if (!itemRequest) {
            return res.status(404).send({ message: "Item request not found" });
        }
        await deleteRequest(itemRequest);
        res.status(200).send({ message: "Item request deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
}
