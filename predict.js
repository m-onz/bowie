
var fs = require('fs')
var neataptic = require('neataptic')
var network = new neataptic.Network.fromJSON(JSON.parse(fs.readFileSync('./model.json').toString()))
var bowie = require('./bowie.js')

var x = bowie('./dataset/test/postives/5.wav', 42)
//var x = bowie('./dataset/train/negatives/1.wav', 42)

var dataset = []

x.on('data', function (d) {
  console.log('prediction 0', Math.round(network.activate(d)))
})

x.on('end', function () {
  console.log('finished 1')
  var x2 = bowie('./dataset/test/postives/2.wav', 42)
  x2.on('data', function (d) {
    console.log('prediction 1 ', Math.round(network.activate(d)))
  })
  x2.on('end', function () {
    console.log('finished 2')
  })
})
