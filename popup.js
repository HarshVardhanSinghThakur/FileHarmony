document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('settingsForm');
  const statusMessage = document.getElementById('statusMessage');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const imagesDestination = form.imagesDestination.value;
    const documentsDestination = form.documentsDestination.value;
    const musicDestination = form.musicDestination.value;
    const videosDestination = form.videosDestination.value;
    const archivesDestination = form.archivesDestination.value

    const settings = {
      imagesDestination,
      documentsDestination,
      musicDestination,
      videosDestination,
      archivesDestination,
      executablesDestination,
      presentationsDestination,
      scriptsDestination,
      othersDestination,
      // Add file typee
    };

    chrome.storage.sync.set(settings, function () {
      statusMessage.textContent = 'Settings saved!';
      setTimeout(function () {
        statusMessage.textContent = '';
      }, 2000);
    });
  });
});

////////////////////////////////


