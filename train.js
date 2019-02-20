
var fs = require('fs')
var bowie = require('./bowie.js')
var neataptic = require('neataptic')
var ora = require('ora')

var network = new neataptic.architect.LSTM(48, 48, 1)

function extractFeatures (path, label) {
  return new Promise (function (resolve, reject) {
    var dataset = []
    var x = bowie(path, 48)
    console.log('extracing features from ', path, ' label:: ', label)
    var spinner = ora({ text: 'extracting from '+path, spinner: 'bouncingBar' }).start()
    x.on('data', function (d) {
      dataset.push({ input: d, output: [label] })
    })
    x.on('end', function () {
      spinner.succeed()
      resolve(dataset)
    })
  })
}

var positves = fs.readdirSync('./dataset/train/positives')
var negatives = fs.readdirSync('./dataset/train/negatives')

negatives = negatives.map(function (file) {
  return extractFeatures(process.cwd()+'/dataset/train/negatives/'+file, 0)
})

positves = positves.map(function (file) {
  return extractFeatures(process.cwd()+'/dataset/train/positives/'+file, 1)
})

var pos = null
var neg = null

Promise.all(positves).then(function (_pos) {
  pos = []
  _pos.forEach(function (x) {
    x.forEach(function (i) {
      pos.push(i)
    })
  })
  Promise.all(negatives).then(function (_neg) {
    var _dataset = []
    _neg.forEach(function (x) {
      x.forEach(function (i) {
        _dataset.push(i);
      })
    })
    pos.forEach(function (i) { _dataset.push(i); })

    network.train(_dataset, {
      log: 1,
      iterations: 10000,
      error: 0.001,
      clear: true,
      rate: 0.01,
    });
    var model = network.toJSON()
    // save model
    fs.writeFileSync('./model.json', JSON.stringify(model))
    console.log('saved model [ ./model.json ]')
  })
})
