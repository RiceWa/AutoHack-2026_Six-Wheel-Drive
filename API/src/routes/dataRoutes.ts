// npm imports
import express, {Router} from 'express';
// local file imports
import {calcAngleDifference, calcMagitudeDifference, getRunData, getTickData, getTickDataByRunId, compareRunsById} from '../controllers/dataController';

const router: Router = express.Router();

// map standard RESTful routes to controller functions
router.get('/Run', getRunData);
router.get('/Tick', getTickData);
router.get('/Tick/:id', getTickDataByRunId);
// router.post('/', createData);
// router.put('/:id', update);
// router.delete('/:id', delete);
router.get('/calcAngDiff', calcAngleDifference);
router.get('/calcMagDiff', calcMagitudeDifference);

router.get('/compareRuns/:runId1/:runId2', compareRunsById);

// make router public
export default router;