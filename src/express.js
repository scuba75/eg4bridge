import log from './logger.js';
import express from 'express';

import { dataList } from './data_list.js';

const PORT = process.env.PORT || 3000;

const app = express();

const server = app.listen(PORT, () => {
  log.info(`eg4-bridge is listening on ${server.address().port}`);
});

app.get('/data', (req, res) => {
  if (dataList?.main) {
    res.json(dataList);
  } else {
    res.sendStatus(200);
  }
});
