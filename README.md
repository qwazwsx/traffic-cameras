![](https://i.imgur.com/VXoEXl1.jpg) ![](https://i.imgur.com/4wrGfgo.jpg) *(not live)



# traffic-cameras
Easily batch download images from Minnesota (and Iowa) traffic cameras

* easy, but has powerful command line options

* saves metadata

* easy on requests (adjustable concurrent requests)


# How do I install this?

* download this repository 

  `git clone https://github.com/qwazwsx/traffic-cameras.git && cd traffic-cameras`
  
* install dependencies 

  `npm install`
  
  
# Examples

* download Minnesota traffic camera images to a folder called 'images'
  
  `node index.js --directory images`

* separate each camera into its own folder (if you want to do timelapses)

`node index.js --folders --directory images`

* download Iowa traffic camera images to a folder called 'images'

`node index.js --directory images --json https://tr.511ia.org/tgcameras/api/cameras`



# Command line options

| long argument | short argument | input type | description                                                              | default                                    |
|---------------|----------------|------------|--------------------------------------------------------------------------|--------------------------------------------|
| --timeout     | -t             | integer    | specifies the timeout (in ms) for downloading individual images          | 4000                                       |
| --retries     | -r             | integer    | number of times to attempt retrying the download of a broken image       | 3                                          |
| --concurrency | -c             | integer    | number of concurrent downloads supported                                   | 10                                         |
| --verbose     | -v             | n/a (flag) | enables more detailed terminal logging                                   | disabled                                   |
| --quiet       | -q             | n/a (flag) | disables ALL console output                                              | disabled                                   |
| --log         | -l             | n/a (flag) | saves verbose output to log.log                                          | disabled                                   |
| --directory   | -d             | file path  | directory/path to save images to                                         | current directory                          |
| --json        | -j             | url        | URL of camera api JSON file to fetch cameras from                        | https://tr.511mn.org/tgcameras/api/cameras |y
| --folders     | -f             | n/a (flag) | separates each camera to its own folder. useful for creating timelapses  | disabled                                   |
| --no-metadata | -m             | n/a (flag) | disables saving of metadata JSON files                                   | enabled (ie metadata is saved)             |





feel free to submit issues or PR's and ill take a look at them as soon as I can
