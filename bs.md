# Bootstrap

  * calculate the folder total size
  * allow size updates per each upload

# Uploads

  * store the file
  * create a *JSON* file with an empty `title`, an `description`, and a `preview` that links to the file, plus a `full` that also points to the file
  * create exif or an empty .json and put it as `metadata`
  * resize the file, if possible, save it as `.preview/fileName` and replace the `preview` entry
  * send back all info per each file

# Visualize Folder

  * show each album with (size?) amount of files

# Visualize Album

  * retrieve the exif (if any)
  * retrieve the text (if any)
  * retrieve preview (if any)
    * preview can be generated within the `.preview` folder
    * preview, if present, should be unlinked too on removal
  * send as JSON with everything (handle on the client)

# Visualize Click (optional)

  * retrieve the original image
  * show a map with exif Geo data transformed (if any)
    * map could be a button top right that replaces the image with a map
    * stretch goal: map is local, no internet required
  * place title and comment under the image
  * show it as modal/big original
  * allow fullscreen and ...
  * ... arrows/keys prev - next
  * ... show title, comment, and arrows only on hover
  * ... make it swpipeable

# Edit Picture

  * Add text (split new lines to get the title)
  * Store both as File text (no need for JSON nor SQLite)

# Edit (optional)

  * edit Geo Location (make it accurate)

# Components

  * images and videos might be grouped a part (images first, videos after)
  * images could show a setting icon on hover and, if clicked, it should provide an editing area
  * videos can't be edited much, yet the comment might be cool
