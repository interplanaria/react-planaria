import { render } from 'react-dom'
import React from 'react'
import App from './App'
import Bitbus from '@planaria/react-bitbus'
const conf = {
  query: {
    q: {
      find: { 
        "out.o1": "OP_RETURN",
      },
      sort: { "blk.i": -1 },
    },
  },
  limit: 1e3,
  crawl: true,
}
render(<Bitbus {...conf} app={App} />, document.getElementById('entry'))