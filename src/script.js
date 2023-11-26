document.addEventListener('DOMContentLoaded', () => {
  // define constants
  const formatErea = document.getElementById('formatErea');
  const downloadErea = document.getElementById('downloadErea');

  // main process
  uploadButton.addEventListener('change', function () {
    const uploadFile = document.getElementById('uploadButton');
    const file = uploadFile.files[0];    
    
    // clear the format and download erea whenever upload button's input is changed
    removeAllChildren(formatErea);
    removeAllChildren(downloadErea);

    // when no file is uploaded
    if (!file){
      alert('ファイルを選択してください。');
      return;
    }
    // when uploaded file is not .html
    if (file.type !== 'text/html') {
      alert('HTMLファイルを選択してください。');
      return;
    }

    // when uploaded file is html, read it
    const reader = new FileReader();    
    reader.readAsText(file);
    reader.onload = function (e) {
      const originalLog = e.target.result;
      const formattedLog = formatLog(originalLog);  // format uploaded log

      // create a format button 
      const formatButton = document.createElement('button');
      formatButton.textContent = '整形！';
      formatErea.appendChild(formatButton);

      // when format button is clicked
      formatButton.addEventListener('click', function () {
        //reader.onloadが非同期処理なので、ちょっとだけ遅延させる
        setTimeout(function () {
          // clear the download erea and create a download button whenever format button is clicked
          removeAllChildren(downloadErea);
          const downloadButton = document.createElement('a');
          downloadButton.textContent = 'ダウンロード';
          downloadButton.download = 'formatted.html';
          downloadButton.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(formattedLog);
          downloadErea.appendChild(downloadButton);
        }, 1000);
      })
    }
  })
})

// format log func
function formatLog(originalLog){
  const formattedLog = originalLog;
  return formattedLog;
}

// remove all childern from a parent element
function removeAllChildren(parent){
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  return;
}

