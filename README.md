
# traffic-cameras

![](timelapse_sample.gif) [(better quality here)](https://streamable.com/6k16v)

![](https://i.imgur.com/VXoEXl1.jpg) ![](https://i.imgur.com/4wrGfgo.jpg) 

-----



Easily batch download images from Minnesota (and Iowa) traffic cameras

* easy to use

* powerful command line options

* option to save metadata

* adjustable concurrent requests


# How do I install this?

* download this repository 

  `git clone https://github.com/qwazwsx/traffic-cameras.git && cd traffic-cameras`
  
* install dependencies 

  `npm install`
  
  
# Examples

* download all MN traffic cameras to the current directory

  `node index.js`

* download all MN traffic cameras to a folder called 'images'
  
  `node index.js --directory images`

* download all MN traffic cameras into their own folder (if you want to do timelapses) \*This option changes how files are titled so you can run this command on a timer and generate a timelapse

`node index.js --folders`

* download all Iowa traffic camera images to the current directory

`node index.js --json https://tr.511ia.org/tgcameras/api/cameras`



# Command line options

| long_argument | short | input type | description                                                              | default                                    |
|---------------|----------------|------------|--------------------------------------------------------------------------|--------------------------------------------|
| --timeout     | -t             | integer    | specifies the timeout (in ms) for downloading individual images          | 4000                                       |
| --retries     | -r             | integer    | number of times to attempt retrying the download of a broken image       | 3                                          |
| --concurrency | -c             | integer    | number of concurrent downloads supported                                   | 10                                         |
| --verbose     | -v             | n/a (flag) | enables more detailed terminal logging                                   | disabled                                   |
| --quiet       | -q             | n/a (flag) | disables ALL console output                                              | disabled                                   |
| --log         | -l             | n/a (flag) | saves verbose output to log.log                                          | disabled                                   |
| --directory   | -d             | file path  | directory/path to save images to                                         | current directory                          |
| --json        | -j             | url        | URL of camera api JSON file to fetch cameras from                        | *see below |y
| --folders     | -f             | n/a (flag) | separates each camera to its own folder. useful for creating timelapses  | disabled                                   |
| --no-metadata | -m             | n/a (flag) | disables saving of metadata JSON files                                   | enabled (ie metadata is saved)             |



\* the default value for --json is `https://tr.511mn.org/tgcameras/api/cameras` 
