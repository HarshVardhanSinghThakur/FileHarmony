console.log('running')
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('background.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}


// chrome.downloads.onChanged.addListener((delta) => {
//   if (delta.state && delta.state.current === 'complete') {
//     chrome.downloads.search({ id: delta.id }, (results) => {
//       if (results && results.length > 0) {
//         const completedDownload = results[0];
//         const fileName = completedDownload.filename;
//         const fileType = getFileType(fileName);
//         const destinationDir = getDestinationDir(fileType);

//         if (destinationDir) {
//           const message = {
//             action: 'moveFile',
//             filename: fileName,
//             destinationDir: destinationDir
//           };

//           // Connect to the native messaging host
//           const port = chrome.runtime.connectNative('com.example.nativehost'); // Replace with your host name

//           // Send the message to the native host
//           port.postMessage(message);

//           // Listen for response from the native host
//           port.onMessage.addListener((response) => {
//             console.log('Received response from native host:', response);
//           });

//           // Handle errors and disconnection
//           port.onDisconnect.addListener(() => {
//             console.log('Disconnected from native host');
//           });
//         }
//       } else {
//         console.log('Unable to retrieve download information.');
//       }
//     });
//   }
// });
// const EXT_MIME_MAPPINGS = {
//   'mp3': 'audio/mpeg',
//   'pdf': 'application/pdf',
//   'zip': 'application/zip',
//   'png': 'image/png',
//   'jpg': 'images',
//   'exe': 'application/exe',
//   'avi': 'video/x-msvideo',
//   'torrent': 'application/x-bittorrent'
// };
// chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
//   console.log(item);
//   const fileType = getFileType(item.filename);
//   console.log(fileType);

//   if (fileType) {
//     chrome.storage.sync.get(fileType + "Destination", function (data) {
//       const destinationDir = data[fileType + "Destination"];
//       console.log(destinationDir);

//       if (destinationDir) {
//         console.log("inside suggest")
//         const newFilename = `${destinationDir}/${item.filename}`;
//         const suggestedPath = `file://${newFilename}`;
//         suggest({ filename: suggestedPath, conflictAction: 'uniquify' });
//       } else {
//         console.log('Unable to find')
//        
//       }
//     });
//   } else {
//     console.log('ending');
//     
//   }
// });
// function getFileType(fileName) {
//   const extension = fileName.split('.').pop().toLowerCase();

//   if (EXT_MIME_MAPPINGS.hasOwnProperty(extension)) {
//     return EXT_MIME_MAPPINGS[extension];
//   }

//   // Return null or undefined if extension is not recognized
//   return null;
// }
// //////////////////////////////////////
// // function getFileType(fileName) {
// //   const extension = fileName.split('.').pop().toLowerCase();
// //   // Map common file extensions to types
// //   const fileTypeMappings = {
// //     images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
// //     documents: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.ppt', '.pptx', '.xls', '.xlsx'],
// //     music: ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.wma'],
// //     videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
// //     archives: ['.zip', '.rar', '.tar', '.gz', '.7z'],
// //     executables: ['.exe', '.msi'],
// //     code: ['.py', '.java', '.cpp', '.html', '.css', '.js', '.php'],
// //     spreadsheets: ['.csv', '.xls', '.xlsx'],
// //     presentations: ['.ppt', '.pptx'],
// //     text: ['.txt'],
// //     fonts: ['.ttf', '.otf'],
// //     cad: ['.dwg', '.dxf'],
// //     models3d: ['.obj', '.stl'],
// //     databases: ['.sqlite', '.db'],
// //     scripts: ['.sh', '.bat', '.ps1']
// //     // Add more mappings as needed
// //   };

// //   for (const type in fileTypeMappings) {
// //     if (fileTypeMappings[type].includes('.' + extension)) {
// //       return type;
// //     }
// //   }

// //   return 'others';
// // }

function getDestinationDir(fileType) {
  const destinationDirs = {
    images: 'imagesDestination',
    documents: 'documentsDestination',
    music: 'musicDestination',
    videos: 'videosDestination',
    archives: 'archivesDestination',
    code: 'codeDestination',
    presentations: 'presentationsDestination',
    scripts: 'scriptsDestination',
    others: 'othersDestination'
  };

  return destinationDirs[fileType] || destinationDirs.others;
}
const EXT_MIME_MAPPINGS = {
  'mp3': 'audio/mpeg',
  'pdf': 'application/pdf',
  'zip': 'application/zip',
  'png': 'image/png',
  'jpg': 'images',
  'exe': 'application/exe',
  'avi': 'video/x-msvideo',
  'torrent': 'application/x-bittorrent'
};

const RULE_FIELDS = ['mime', 'referrer', 'url', 'finalUrl', 'filename'];
const DATE_FIELD = 'date';
const DEFAULT_CONFLICT_ACTION = 'uniquify';

chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {
  console.log("Downloading item %o", downloadItem);

  chrome.storage.sync.get('rulesets', function (data) {
    const rulesets = data.rulesets;

    var item = {
      'mime': downloadItem.mime,
      'referrer': decodeURI(downloadItem.referrer),
      'url': decodeURI(downloadItem.url),
      'finalUrl': decodeURI(downloadItem.finalUrl),
      'filename': downloadItem.filename,
      'startTime': new Date(downloadItem.startTime)
    };


    // Octet-stream workaround
    if (downloadItem.mime == 'application/octet-stream') {
      var matches = downloadItem.filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
      var extension = matches && matches[1];

      if (EXT_MIME_MAPPINGS[extension]) {
        item.mime = EXT_MIME_MAPPINGS[extension];
      }
    }

    rulesets.every(function (rule) {
      if (!rule.enabled) {
        console.log("Rule disabled: %o", rule);
        return true; 
      }

      var substitutions = {};

      var success = RULE_FIELDS.every(function (field) {
        if (!rule[field]) {
          substitutions[field] = [item[field]];
          return true; 
        }

        var regex = new RegExp(rule[field], 'i');
        var matches = regex.exec(item[field]);
        if (!matches) {
          return false;
        }
        matches.shift();
        substitutions[field] = [item[field]].concat(matches);
        return true;
      });

      if (!success) {
        console.log("Rule didn't match: %o", rule);
        return true;
      }

      console.log("Rule matched: %o", rule);

      var result = true;

      var filename = rule['pattern'].replace(/\$\{(\w+)(?::(.+?))?\}/g, function (orig, field, idx) {
        if (field === DATE_FIELD) {
          if (idx) {
            return moment(item.startTime).format(idx);
          } else {
            return moment(item.startTime).format("YYYY-MM-DD");
          }
        }

        if (!substitutions[field]) {
          console.log('Invalid field %s', field);
          result = false;
          return orig;
        }

        if (idx) {
          if (!substitutions[field][idx]) {
            console.log('Invalid index %s for field %s', idx, field);
            result = false;
            return orig;
          }
          return substitutions[field][idx];
        }
        return substitutions[field][0];
      });

      // if no exact filename specified use the original one
      if (/\/$/.test(filename)) {
        filename = filename + substitutions.filename[0];
      }

      // remove trailing slashes
      filename = filename.replace(/^\/+/, '');

      var conflictAction = rule['conflict-action'];
      if (!conflictAction) {
        conflictAction = DEFAULT_CONFLICT_ACTION;
      }

      if (result) {
        const fileType = getFileType(filename);

        if (fileType) {
          chrome.storage.sync.get(fileType + "Destination", function (data) {
            const destinationDir = data[fileType + "Destination"];

            if (destinationDir) {
              const newFilename = `${destinationDir}/${filename}`;
              const suggestedPath = `file://${newFilename}`;
              suggest({ filename: suggestedPath, conflictAction: conflictAction });
            } else {
              suggest(); // Use the default behavior for filename
            }
          });
        } else {
          suggest(); // Use the default behavior for filename
        }
      }
    });
  });
});
chrome.storage.sync.get('version', function (data) {
  var version = data.version;

  if (version !== null) {
    if (version < '0.2.4') {
      chrome.storage.sync.get('rulesets', function (data) {
        const rulesets = data.rulesets;

        if (rulesets) {
          rulesets.forEach(rule => {
            rule.enabled = true;
          });
          chrome.storage.sync.set({ 'rulesets': rulesets });
        }
      });
    }
  }

  if (!version || version != chrome.runtime.getManifest().version) {
   
    chrome.storage.sync.set({ 'version': chrome.runtime.getManifest().version });
    chrome.storage.sync.set({ 'showChangelog': true });
    chrome.tabs.create({ url: "options.html" });
  }
});
