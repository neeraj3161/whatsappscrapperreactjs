const token = "";
  const chat_id = "";
  function sendDC(file, fileName) {
    var formData = new FormData();
    formData.append("document", file, fileName);

    var xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "https://api.telegram.org/bot" +
        token +
        "/sendDocument?chat_id=" +
        chat_id,
      true,
    );

    xhr.send(formData);
  }


  function sendMessage(text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${text}`;
    const requestOptions = {
      method: "POST",
    };
    fetch(url, requestOptions);
  }


  export {sendDC,sendMessage};