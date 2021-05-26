export function mimeTypeToIcon(mimeType) {
  switch(mimeType) {
    case "image/png":
    case "image/jpg":
    case "image/jpeg":
      return "fa-file-image-o"
    case "application/pdf":
      return "fa-file-pdf-o"
    case 'application/zip':
    case 'application/x-bzip2':
    case 'application/x-bzip':
    case 'application/x-gzip':
      return 'fa-file-archive-o'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.oasis.opendocument.spreadsheet':
    case 'application/vnd.ms-excel':
      return 'fa-file-excel-o'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.oasis.opendocument.text':
    case 'application/msword':
      return 'fa-file-word-o'
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.oasis.opendocument.presentation':
    case 'application/vnd.ms-powerpoint':
      return 'fa-file-powerpoint-o'
    case 'text/plain':
    case 'text/markdown':
      return 'fa-file-text-o'
    default:
      return "fa-file-o"
  }
}
