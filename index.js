
var fs = require('fs')
var neataptic = require('neataptic')
var network = new neataptic.architect.LSTM(48, 24, 24, 24, 1)

var bowie = require('./bowie.js')

var x = bowie('./test.wav')

var dataset = []

x.on('data', function (d) {
  dataset.push({ input: d, output: [0] })
})

x.on('end', function () {
  console.log('finished 1')
  var x2 = bowie('./test2.wav')
  x2.on('data', function (d) {
    dataset.push({ input: d, output: [1] })
  })

  x2.on('end', function () {
    console.log('finished 2')
    network.train(dataset, {
      log: 1,
      iterations: 10000,
      error: 0.01,
      clear: true,
      rate: 0.009,
    });
    var model = network.toJSON()
    // save model
    fs.writeFileSync('./model.json', JSON.stringify(model))
    console.log('saved model [ ./model.json ]')
    // for(var i in dataset) {
    //   var input = dataset[i].input;
    //   console.log(input, 'input')
    //   var output = network.activate(input);
    //   console.log('<p>Input: ' + input[0] + ', output: ' + output + '</p>');
    // }
  })
})
