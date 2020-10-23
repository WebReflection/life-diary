# Life Diary ❤️

<sup>your albums, your journey, your data</sup>

**[Youtube Showcase](https://www.youtube.com/watch?v=ClKj2yn2DNs)**



## About

Storing images in the cloud, or in our favorite social, is awesome, but it comes with a price:

  * there's likely some lost data when images get optimized for the Web
  * the backup from the cloud is rarely well organized / easy to surf, or it rarely contains our original content as is
  * images and places are not always related or shown in a map
  * there is a cross platform friction when changing phone, laptop, or Operating System
  * surfing media content online is great only if we have great connettivity

As I love to travel, and organize folders / albums with all relevant pictures, I wanted to create a very simple, Web based, intranet oriented service, able to upload, surf, describe, and show map related details within my local home network, and this is all this project is about: keep your albums, journeys, and original data, within your own home hard disk, 'cause sharing is great, but caring about proprietary videos and pictures is also important.

So here I am, with a tiny utility that works even on a *Raspberry Pi*, as long as its *SD Card* has a lot of space, or its external *HD* is capable and fast enough, but literally any *Linux*, *macOS*, or *Windows* based device, with *NodeJS* support, should work out of the box, as long as *requirements* are met.



## Requirements

This project requires an [exiftool](https://exiftool.org/install.html) executable in the system.

After a lot of investigation, I've decided this is the best way to go, also for the following reasons:

  * *EXIF* related modules are mostly all old, unmaintained, broken, or shipping old versions of the *exiftool*
  * every more updated module, uses *exiftool* behind the scene anyway, so I prefered not to have a "*man in the middle*" for something deadly easy to install in every *Linux* distribution, but also in any *macOS* or even *Windows*, if that's your cup of tea



## Try it ❤️

Once *exiftool* is reachable through the command line, and assuming *nodejs* and *npm* are installed, choose any readable/writable folder in any of your hard disks, and bootstrap *life-diary* through the following terminal command:

```js
npx life-diary ~/MyDiary
```

If everything was OK, the terminal should show something like this:

```
Life Diary ❤️
 version  x.x.x
 visit    http://192.168.1.123:8080/
 folder   /home/my-name/MyDiary
```

At this point, it should be possible to reach the `http://192.168.X.X:8080/` IP address, by typing it in any *modern* browser URL bar.

We can start creating *new albums*, and upload as many files at once we'd like, and once these files are uploaded, the *album* starts to populate itself with content, either images or videos, and per each content, it allows to add a *title* or a *description*.

It is possible to delete content too, or to visualize it *fullscreen*, by simply clicking the image or video.

If there was some *EXIF* data associated to such media, a *Map* symbol should appear on the top corner of the screen, and clicking it will show the location where such image was taken, and once in *fullscreen* mode, it is possible to navigate the album by clicking *right* or *left* arrows, and it's always possible to *exit* from *fullscreen* by typing the *Escape* key.



## Instructions

  * **create** a new album by giving it a name
  * **upload** one or more picture/video to the album using the input field
  * **edit** title and description of each media, when needed or appropriate
  * **show** *fullscreen* images or videos
    * use **right** or **left** *arrow keys* to navigate the album, **swipe** otherwise
    * click the **map** *button* to see Geo location data
    * use **rightclick** do add, or update, Geo location data
    * use *right* or *left* arrow keys to navigate in *map* mode or click the *map* button again to **close** the map
    * **exit** *fullscreen* by either pressing `Escape` or, on Safari mobile, by double clicking when *not* on *map*
  * go back **home** through the 🏡 *button*



## Features

To know features and options, try `npx life-diary --help`, and this is a summary:

  * optional basic realm protection for either viewing and editing albums, or only to edit, so that guests can see but they won't be able to edit/delete anything.
  * unlimited files upload at once, as long as there is enough disk space and your network is fast enough to handle that (also server side *RAM* and *swap* might be relevant for big uploaded files)
  * optimized images previews for a quick scan through the album
  * unmodified images and videos qualities for enjoying these in full screen
  * interface (ugly but ...) 100% keyboard navigable, everything should be a *Tab* away
  * automatic *adoption* of foreign folders already contining images or videos (currently in beta, please provide cleaned up folders)
  * automatic *EXIF* data extraction, and possibility to associate data to any entry (currently *title* and *description*)
  * automatic *Map* discovery when *EXIF* data exists, and its Geo coordinates can be converted, modified, or saved
  * it is possible to provide a custom tile server, [whenever you have one running locally](https://github.com/Overv/openstreetmap-tile-server), and/or a custom attribution

Most importantly, the content is always local, and beside the *Map* feature, everything should run out of the box within a local network, without ever requiring access to the Internet.


### What is still missing

To start with, I am not a designer, so that I'd love to have some help improving the layout in any possible way, but techincally speaking, these are the future achievements I'd like to unlock in the future:

#### Client Side

  * I've made it work, I've made it (*kinda*) fast, now I need your help to make it *beautiful*

#### Server Side

Mostly all functionalities are in, but there could be streatch goals, as example:

  * *maybe* order by creation time, instead of name ...
  * *maybe* add a search per title, description, and/or country, within the *home* page ...
  * or *maybe* store most basic info per file into SQLite, so that it's possible to query the whole database without crawling each folder ...
  * and *maybe* * provide a `GET` end point to download an album as `.zip` folder, so that a single album can be used for any other purpose (is this useful though? the folder is already in the drive)


If you have an other suggestion for either client or server side, I'm listening!



## Compatibility

This project is a *showcase* of modern Web technologies and JS features, and a modern browser is mandatory, as nothing in here will ever see the light on the Internet, and nobody uses *IE* with phones, PCs, or laptops at home.

In few words, *evergreen* browsers are the only goal of this project, so be sure your browser is up-to-date.

As a rule of thumbs, if your browser doesn't support *dynamic import(...)* change phone, or update your browser, or use somebody else device.

However, if your browser supports *dynamic import(...)*, and something doesn't work, please file a bug, mentioning the model, browser version, how to reproduce the issue, etc, thank you!



## Credits

This project wouldn't be possible without the amount of awesome Open Source projects I've used to make it, including:

  * [Leaflet](https://leafletjs.com/) map, and [OpenStreetMap](https://www.openstreetmap.org/copyright)
  * the [NoSleep](https://github.com/richtr/NoSleep.js/) helper, which I hoped I wouldn't need, but then again the wake lock API doesn't work via *HTTP*, even if it's your own private network. Please note this module is enabled/disabled *only* during the upload, to prevent your phone to fall asleep and stop uploading data ... an awesome *Web shenanigan* if you ask me but ... hey, we can't have it all
  * the [#sharp](https://github.com/lovell/sharp) module that I've been using in various of my projects too: it's just awesome
  * the other *NodeJS* related modules around [Epxress](https://expressjs.com/), which might not be the fastest thing out there, and yet it made the development of this project a pleasure: *thank you*!
  * Social media <span>photo by <a href="https://unsplash.com/@carlijeen?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Carli Jeen</a> on <a href="https://unsplash.com/s/photos/life-diary?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>
