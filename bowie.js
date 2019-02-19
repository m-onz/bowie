
var fs = require('fs');
var path = require('path');
var wav = require('wav');
var fft = require('fft-js');
var Framer = require('signal-windows').framer;
var ham = undefined;
var EV = require('events').EventEmitter

function bowie (p) {
  if (! (this instanceof bowie)) return new bowie (p)
  var program = this
  var self = this
  self.mfcc = require('mfcc');
  program.wav = p
  program.minFrequency = 300
  program.maxFrequency = 3500
  program.numMelSpecFilters = 26
  program.samplesPerFrame = 128
  program.samplesPerStep = 128
  self.e = new EV
  if (program.samplesPerFrame & (program.samplesPerFrame-1) !== 0)
    throw Error('Needs samplesPerFrame at power of 2 (e.g. 32, 64) Was: ' + program.samplesPerFrame);
  var mfcc,
      framer,
      sampleRate;
  var wr = new wav.Reader()
  var batch = []
  function clamp (value) {
    if (value >= 1) value = 1
    if (value <= 0) value = 0
    return value
  }
  function convertRange( value, r1, r2 ) {
      return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
  }
  wr.on('data', function (buffer, offset, length) {
    framer.frame(buffer, function (frame, fIx) {
      if (frame.length != program.samplesPerFrame) return;
      var phasors = fft.fft(frame),
          phasorMagnitudes = fft.util.fftMag(phasors),
          result = self.mfcc(phasorMagnitudes, program.debug && true);
        if (batch.length < 48) {
          result.forEach(function (i) {
            batch.push(clamp(convertRange(i, [ 0, 30 ], [ 0, 1 ] )))
          })
        } else {
          self.e.emit('data', batch)
          batch = []
        }
    });
  });
  wr.on('format', function (format) {
    var sampleRate = format.sampleRate;
    ham = require('signal-windows').windows.construct('ham', program.samplesPerFrame);
    var ulawMap = format.ulaw ? JSON.parse(fs.readFileSync('data/ulaw2pcm.json').toString()) : undefined;
    if (ulawMap) for (var k in ulawMap) ulawMap[k] = ulawMap[k]/32767;
    if (format.channels != 1)
      throw Error('Right now this MFCC code only works on single channel 8-bit wave files.');
    if (format.bitDepth != 8)
      throw Error('Right now this MFCC code only works on single channel 8-bit wave files.');
    framer = new Framer({
      map: ulawMap,
      frameSize: program.samplesPerFrame,
      frameStep: program.samplesPerStep,
      scale: ham,
      sampleType: 'UInt8'
    });
    self.mfcc = self.mfcc.construct(program.samplesPerFrame / 2,
                          program.numMelSpecFilters,
                          program.minFrequency,
                          program.maxFrequency,
                          format.sampleRate);
  });
  // wr.on('end', function () {
  //   process.exit(1);
  // });
  fs.createReadStream(program.wav).on('end', function () {
    self.e.emit('end', true)
  }).pipe(wr)
  return self.e
}

module.exports = bowie;
