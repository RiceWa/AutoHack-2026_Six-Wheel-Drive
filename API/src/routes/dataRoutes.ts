// npm imports
import express, {Router} from 'express';
// local file imports
import {test, getData, createData} from '../controllers/dataController';

const router: Router = express.Router();

// map standard RESTful routes to controller functions
router.get('/', getData);
// router.get('/:id', getById);
router.post('/', createData);
// router.put('/:id', update);
// router.delete('/:id', delete);
router.get('/test', test);

// make router public
export default router;