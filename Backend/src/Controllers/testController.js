import { testServices } from "../Services/testServices.js";

export const testController = (req, res) => {
    const data = testServices();
    res.json(data);
};