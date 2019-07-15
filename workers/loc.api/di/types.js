'use strict'

module.exports = {
  CONF: Symbol.for('CONF'),
  RootPath: Symbol.for('RootPath'),
  Container: Symbol.for('Container'),
  LoggerFactory: Symbol.for('LoggerFactory'),
  Logger: Symbol.for('Logger'),
  RService: Symbol.for('RService'),
  DeflateFac: Symbol.for('DeflateFac'),
  Responder: Symbol.for('Responder'),
  GetREST: Symbol.for('GetREST'),
  InjectDepsToRService: Symbol.for('InjectDepsToRService'),
  RServiceDepsSchema: Symbol.for('RServiceDepsSchema'),
  GrcBfxReq: Symbol.for('GrcBfxReq'),
  PrepareResponse: Symbol.for('PrepareResponse'),
  PrepareApiResponse: Symbol.for('PrepareApiResponse'),
  Link: Symbol.for('Link'),
  HasGrcService: Symbol.for('HasGrcService'),
  ProcessorQueue: Symbol.for('ProcessorQueue'),
  AggregatorQueue: Symbol.for('AggregatorQueue'),
  GenerateCsv: Symbol.for('GenerateCsv'),
  Processor: Symbol.for('Processor'),
  Aggregator: Symbol.for('Aggregator'),
  WriteDataToStream: Symbol.for('WriteDataToStream'),
  UploadToS3: Symbol.for('UploadToS3'),
  SendMail: Symbol.for('SendMail')
}
