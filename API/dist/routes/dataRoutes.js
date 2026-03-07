"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// npm imports
const express_1 = __importDefault(require("express"));
// local file imports
const dataController_1 = require("../controllers/dataController");
const router = express_1.default.Router();
// map standard RESTful routes to controller functions
router.get('/Run', dataController_1.getRunData);
router.get('/Tick', dataController_1.getTickData);
// // router.get('/:id', getById);
// router.post('/', createData);
// router.put('/:id', update);
// router.delete('/:id', delete);
router.get('/calcAngDiff', dataController_1.calcAngleDifference);
router.get('/calcMagDiff', dataController_1.calcMagitudeDifference);
// make router public
exports.default = router;
