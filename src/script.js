document.addEventListener('DOMContentLoaded', () => {
  // uploadボタンをクリックでアップロード処理をし、ダウンロード用リンクを作成する
  uploadButton.addEventListener('change', function () {
    var uploadFile = document.getElementById('uploadButton');
    var file = uploadFile.files[0];
    //const text = file.text()
    if (!file) alert('ファイルを選択してください。');

    /********************************
     * upload処理
     ********************************/
    // var uploadData;
    // // var uploadText = document.getElementById('upload-text');
    var reader = new FileReader();
    
    reader.readAsText(file);
    reader.onload = function (e) {
      const originalLog = e.target.result;
      const formattedLog = formatLog(originalLog);

      var formatErea = document.getElementById('formatErea');
      var downloadErea = document.getElementById('downloadErea');

      const existingButton = formatErea.querySelector('button');
      if (existingButton) {
        formatErea.removeChild(existingButton);
      }

      var formatButton = document.createElement('button');
      formatButton.textContent = '整形！';
      formatErea.appendChild(formatButton);

      formatButton.addEventListener('click', function () {
        /********************************
         * download用リンクの作成
         ********************************/
        //reader.onloadが非同期処理なので、ちょっとだけ遅延させる
        setTimeout(function () {
          // 既存のリンクを削除
          const existingLink = downloadErea.querySelector('a');
          if (existingLink) {
            downloadErea.removeChild(existingLink);
          }

          //var downloadFile = JSON.stringify(text);
          var downloadButton = document.createElement('a');
          downloadButton.textContent = 'ダウンロード';
          downloadButton.download = 'formatted.html';
          downloadButton.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(formattedLog);
          //downloadButton.dataset.downloadurl = ['text/html', downloadButton.download, downloadButton.href].join(':');

          downloadErea.appendChild(downloadButton);
        }, 1000);
      })
    }
  })
})

function formatLog(originalLog){
  const formattedLog = originalLog;
  return formattedLog;
}

