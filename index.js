#!/usr/bin/env node
'use strict'

// requirements
const request = require('request') // grabs JSON file of all cameras
// const sanitize = require('sanitize-filename') // makes sure saved filenames are OK
// const inspector = require('inspector') // debugging
const queue = require('async/queue') // queues up downloads
const download = require('image-downloader') // downloads images
var ProgressBar = require('progress') // shows progress bar
require('colors') // colorful logging
const argv = require('minimist')(process.argv.slice(2)) // parses terminal args
const path = require('path') // parses pathnames
const mkdirp = require('mkdirp') // creates directories
const fs = require('fs') // write to log file
// define global vars
var fails = 0
var bar
var startTime

/// ////////////////////////////////////////////////////////////////////////////////////////////
// show help menu
if (argv.h || argv.help) {
  console.log('HELP:')
  console.log('--timeout,     -t  int    timeout (in ms) for downloading images (default: 4000)')
  console.log('--retries,     -r  int    number of retries an image gets after before giving up (default: 3)')
  console.log('--concurrency, -c  int    number of requests allowed to be open at a time (default: 10)')
  console.log('--verbose,     -v  n/a    enable detailed logging (default: false)')
  console.log('--quiet,       -q  n/a    disables all console output (default false)')
  console.log('--log          -l  n/a    save output to a log file (default: false)')
  console.log('--directory    -d  str    directory/path to save images to (default: current directory)')
  console.log('--json,        -j  str    URL of camera api JSON file (default: https://tr.511mn.org/tgcameras/api/cameras)')
  console.log('--folders      -f  n/a    seperates each camera view to its own folder. This is useful for creating timelapses (default: false)')
  console.log('--no-metadata  -m  n/a    doesnt save metadata JSON files (default: false)')

  console.log('\n written by qwazwsx\n  https://github.com/qwazwsx')

  process.exit()
}

// parse terminal args
var options = {

  timeout: argv.timeout || argv.t || 4000,
  json: argv.json || argv.j || 'https://tr.511mn.org/tgcameras/api/cameras',
  retries: argv.retries || argv.r || 3,
  verbose: argv.verbose || argv.v || false,
  quiet: argv.quiet || argv.q || false,
  concurrency: argv.concurrency || argv.c || 10,
  directory: argv.directory || argv.d || '.',
  folders: argv.folders || argv.f || false,
  log: argv.log || argv.l || false,
  // have to invert these because minimist is awesome and reads --no-metadata as metadata: false
  no_metadata: !argv['no-metadata'] || !argv.m || false

}

// make the directory to put the files in
if (options.directory !== '.') {
  mkdirp(options.directory, function (err) {
    if (err) console.error(err)
    else log('[INFO] created directory \'' + options.directory + '\'')
  })
}

if (options.log) {
  // create log file
  var stream = fs.createWriteStream(options.directory + '/log.log', {flags: 'a'})
}

/// ////////////////////////////////////////////////////////////////////////////////////////////

log(Date())
log('[INFO] grabbing camera list')

// grab list of all trafic cams
request(options.json, function (err, res, body) {
  if (err || res.statusCode !== 200) {
    log(('[ERROR] cannot GET \'' + options.json + '\'').red)
    return
  }

  body = JSON.parse(body)

  // mark start time
  startTime = process.hrtime()

  // create progress bar
  bar = new ProgressBar('downloading [:bar] :current/:total (:fails dead camera:s) eta: :etas', {
    complete: '=',
    incomplete: ' ',
    clear: true,
    width: 30,
    total: 0
    // total:50
  })

  // save metadata file
  if (!options.no_metadata) {
    fs.writeFile(path.join(options.directory, 'metadata.json'), JSON.stringify(body), function (err) { if (err) throw err })
  }

  // loop through each cam
  for (var i = 0; i < body.length; i++) {
  // for ( var i = 0; i <= 50; i++ ){

    // loop through each view for each cam
    for (var ii = 0; ii < body[i].views.length; ii++) {
      // if an image exists for that cam
      if (body[i].views[ii].url !== '') {
        // make bar longer
        bar.total = bar.total + 1

        // queue the download
        q.push({url: body[i].views[ii].url, id: body[i].id, view: ii, totalViews: body[i].views.length, metadata: JSON.stringify(body[i])})
      } else {
        // if no image URL exists for that view
        warn('[WARNING] image #' + body[i].id + ' view #' + (ii + 1) + ' contains no image data, skipping')
      }
    }
  }

  log('[INFO] found ' + q.length() + ' cameras')
})

// worker that handles our queued tasks
var q = queue(function (task, callback) {
  var url = task.url
  var id = task.id
  var totalViews = task.totalViews
  var view = task.view
  var metadata = task.metadata
  var errors = task.errors || 0

  // construct file path
  var saveFile
  var saveDir
  if (options.folders) {
    // if there are multiple views
    if (totalViews > 1) {
      // save in <base_dir>/<camera #>-<view #> as <timestamp>.jpg
      // ie pics/561-1/1532501114567.jpg
      saveDir = path.join(options.directory, id.toString() + '-' + view.toString())
      saveFile = path.join(options.directory, id.toString() + '-' + view.toString(), Date.now() + '.jpg')
    } else {
      // save in <base_dir>/<camera #> as <timestamp>.jpg
      // ie pics/561/1532501114567.jpg
      saveFile = path.join(options.directory, id.toString(), Date.now() + '.jpg')
      saveDir = path.join(options.directory, id.toString())
    }
  } else {
    // save in <base_dir> as <camera #>-<view #>-<timestamp>.jpg
    // ie pics/561-1-1532501114567.jpg
    saveFile = path.join(options.directory, id + '-' + view + '-' + Date.now() + '.jpg')
    saveDir = path.join(options.directory)
  }

  // make directory incase it doesnt exist
  mkdirp(saveDir, function (err) {
    if (err) throw err

    // write camera metadata to folder
    if (options.folders && !options.no_metadata) fs.writeFile(path.join(saveDir, 'metadata.json'), metadata, function (err) { if (err) throw err })

    // attempt to download
    download.image({url: url, dest: saveFile, timeout: options.timeout})
      .then(({ filename, image }) => {
        // tick the progress bar
        // (grammar nazi compatible)
        var s = (fails !== 1) ? 's' : ''
        bar.tick({fails: fails, s: s})

        // if we arent the last task
        if (q.running() >= 1) {
          callback()
        }
      })
      .catch((err) => {
        // if the download fails, retry
        errors++
        // if we are under the retry limit
        if (errors <= options.retries) {
          warn('[WARNING] ' + id + '-' + view + ' retrying ' + errors + '/' + options.retries + ' - ' + err)

          // queue the retry
          q.unshift({url: url, id: id, errors: errors})
          if (q.running() >= 1) {
            callback()
          }
        } else {
          // if we have retried too many times

          // if get get a parsable HTTP error
          if (err.toString().indexOf('_isParsable') > -1) {
            error('[ERROR] ' + id + '-' + view + ' - ' + JSON.parse(err.toString().split('Error: ')[1]).statusCode, true)
          } else {
            error('[ERROR] ' + id + '-' + view + ' - ' + err, true)
          }

          fails++

          // if we arent the last task
          if (q.running() >= 1) {
            callback()
          }
        }
      })
  })
}, options.concurrency)

// once all tasks are finished
q.drain = function () {
  // wait because the progress bar updates every 16ms and we dont want to interfere
  setTimeout(function () {
    var s = (fails !== 1) ? 's' : ''
    var message = '\n[INFO] downloaded ' + bar.curr + ' images (with ' + fails + ' error' + s + ') in ' + process.hrtime(startTime)[0] + ' seconds'
    appendLog(message)
    log(message.green.underline)
  }, 100)
}

/// ////////////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////////////////////

// helper functions

// handle errors
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// quiet terminal option
if (options.quiet) {
  // override progress bar
  // console.log = function () {}
  ProgressBar = function () {}
  ProgressBar.prototype.tick = function () {}
  ProgressBar.prototype.interrupt = function () {}
  ProgressBar.total = 0
}

// log helper
function appendLog (text) {
  if (!options.log) return

  mkdirp(options.directory)
  stream.write(text + '\n')
}

// warn log helper
function warn (text) {
  if (options.quiet) return
  if (options.log) appendLog(text)
  if (!options.verbose) return

  bar.interrupt(text.yellow)
}

// error log helper
function error (text, isBar) {
  if (options.quiet) return
  if (options.log) appendLog(text)
  if (!options.verbose) return

  if (isBar) {
    bar.interrupt(text.red)
  } else {
    console.log(text.red)
  }
}

// log helper
function log (text) {
  if (options.quiet) return

  console.log(text)

  // save log
  appendLog(text)
}

process.on('SIGINT', function () {
  log('\n[' + Date() + '] CTRL + C ')
  process.exit()
})
