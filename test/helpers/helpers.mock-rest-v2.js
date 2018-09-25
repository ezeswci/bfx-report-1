'use strict'

const { MockRESTv2Server } = require('bfx-api-mock-srv')

const _mockData = new Map([
  [
    'symbols',
    [
      'btcusd',
      'ethusd',
      'ethbtc',
      'btceur',
      'btcjpy',
      'iotusd',
      'iotbtc',
      'ioteth',
      'ifxusd',
      'ioteur',
      'euxusx'
    ]
  ],
  [
    'user_info',
    [
      123,
      'fake@email.fake',
      'fakename'
    ]
  ],
  [
    'ledgers',
    [[
      12345,
      'BTC',
      null,
      (new Date()).getTime(),
      null,
      -0.00001,
      5.555555,
      null,
      'Crypto Withdrawal fee on wallet exchange'
    ]]
  ],
  [
    'trades',
    [[
      12345,
      'tBTCUSD',
      (new Date()).getTime(),
      12345,
      0.01,
      12345,
      null,
      null,
      false,
      -0.00001,
      'BTC'
    ]]
  ],
  [
    'orders',
    [[
      12345,
      12345,
      12345,
      'tBTCUSD',
      (new Date()).getTime(),
      (new Date()).getTime(),
      0,
      0.01,
      'EXCHANGE LIMIT',
      null,
      null,
      null,
      '0',
      'EXECUTED @ 15065.0(0.01)',
      null,
      null,
      12345,
      12345,
      12345,
      12345,
      null,
      null,
      null,
      false,
      null,
      null
    ]]
  ],
  [
    'movements',
    [[
      12345,
      'BTC',
      'BITCOIN',
      null,
      null,
      (new Date()).getTime(),
      (new Date()).getTime(),
      null,
      null,
      'PENDING REVIEW',
      null,
      null,
      -0.009999,
      -0.000001,
      null,
      null,
      '0x047633e8e976dc13a81ac3e45564f6b83d10aeb9',
      null,
      null,
      null,
      '0x754687b3cbee7cdc4b29107e325455c682dfc320ca0c4233c313263a27282760',
      null
    ]]
  ],
  [
    'f_offer_hist',
    [[
      12345,
      'fUSD',
      (new Date()).getTime(),
      (new Date()).getTime(),
      0,
      100,
      null,
      null,
      null,
      null,
      'EXECUTED at 0.7% (100.0)',
      null,
      null,
      null,
      0.007,
      7,
      false,
      false,
      null,
      false,
      null
    ]]
  ],
  [
    'f_loan_hist',
    [[
      12345,
      'fUSD',
      1,
      (new Date()).getTime(),
      (new Date()).getTime(),
      200,
      null,
      'CLOSED (used)',
      null,
      null,
      null,
      0.00168,
      30,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false
    ]]
  ],
  [
    'f_credit_hist',
    [[
      12345,
      'fUSD',
      -1,
      (new Date()).getTime(),
      (new Date()).getTime(),
      681.25937738,
      null,
      'CLOSED (reduced)',
      null,
      null,
      null,
      0,
      2,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false,
      null
    ]]
  ]
])

const _getMockData = (methodName) => {
  if (!_mockData.has(methodName)) throw new Error('NO_MOCKING_DATA')

  return _mockData.get(methodName)
}

const _fillAllData = (mockRESTv2Srv) => {
  for (let [key, val] of _mockData) {
    mockRESTv2Srv.setResponse(key, val)
  }
}

const _createMockRESTv2Srv = () => {
  return new MockRESTv2Server({ listen: true })
}

const createMockRESTv2SrvWithAllData = () => {
  const srv = _createMockRESTv2Srv()
  _fillAllData(srv)

  return srv
}

const _setDateTo = (key, dataItem, date = new Date().getTime()) => {
  const _date = Math.round(date)

  switch (key) {
    case 'ledgers':
      dataItem[3] = _date
      break

    case 'trades':
      dataItem[2] = _date
      break

    case 'orders':
      dataItem[4] = _date
      dataItem[5] = _date
      break

    case 'movements':
      dataItem[5] = _date
      dataItem[6] = _date
      break

    case 'f_offer_hist':
      dataItem[2] = _date
      dataItem[3] = _date
      break

    case 'f_loan_hist':
      dataItem[3] = _date
      dataItem[4] = _date
      break

    case 'f_credit_hist':
      dataItem[3] = _date
      dataItem[4] = _date
      break
  }

  return dataItem
}

const createMockRESTv2SrvWithDate = (
  start = new Date().getTime(),
  end = start,
  limit = null,
  opts = {
    'ledgers': { limit: 5000 },
    'trades': { limit: 1500 },
    'orders': { limit: 5000 },
    'movements': { limit: 25 },
    'f_offer_hist': { limit: 5000 },
    'f_loan_hist': { limit: 5000 },
    'f_credit_hist': { limit: 5000 },
    'user_info': null,
    'symbols': null
  }
) => {
  const srv = _createMockRESTv2Srv()

  Object.entries(opts).forEach(([key, val]) => {
    if (!Array.isArray(_getMockData(key)[0])) {
      srv.setResponse(key, _getMockData(key).slice())

      return
    }

    const _limit = limit || val.limit
    const step = (end - start) / _limit
    let date = start

    const data = Array(_limit).fill(null).map((item, i) => {
      if (_limit === (i + 1)) {
        date = end
      } else if (i > 0) {
        date += step
      }

      const dataItem = _getMockData(key)[0].slice()
      _setDateTo(key, dataItem, date)

      return dataItem
    })

    srv.setResponse(key, data.reverse())
  })

  return srv
}

module.exports = {
  createMockRESTv2SrvWithAllData,
  createMockRESTv2SrvWithDate
}