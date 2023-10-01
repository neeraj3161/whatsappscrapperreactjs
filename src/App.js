import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';

import React, { useEffect } from "react";
import Tesseract from "tesseract.js";
import { createWorker } from 'tesseract.js';


const App = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [image, setImage] = React.useState([]);
  const [text, setText] = React.useState();
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState(" Number of images added: 0");
  const [statusColor,setStatusColor] = React.useState(); 
  const [processedImage, setProcessedImage] = React.useState("0/0");
  const [errorImageCount, setErrorImageCount] = React.useState(0);
  const [contactScrappedCount, setContactScrappedCount] = React.useState(0);  
  const [isDownloadable, setIsDownloadable] = React.useState(false); 
  const [introText, setIntroText] = React.useState(
    "Choose multiple images file which has phone number",
  );

  const [contactsScrapped, setContacts] =  React.useState([]);

  const [errorsList,setErrors] = React.useState([]);

  var csvContactData = [];
  var csvErrorData = [];

  useEffect(()=>{
    //run this use effect only once
   //setIsLoading(true);
  
  },[])

  var fileNamesWithErrors = new Set([]);
  var stringList = new Set([]);
  

  function convertImageToURLArray(image) {
    return (image);
  }

  const maintainAlert = () => {
    alert("Under maintainance try again later");
  };

  var imageTotal = 0;
  var count = 0;
  var intitalLoad = true;


  const startProcess = async () =>
  {
    setProgress(0);
    processImage();
  }

  function noImage(){
    alert("Please select a image first!!");
  }


  const processImage = async ()=>{
    if(intitalLoad)
    {
      setProcessedImage("0/"+image.length);
      imageTotal = image.length;
    }
    setIsLoading(true);
    console.log(image[0])
    var imageF = URL.createObjectURL(image[0])
    console.log(imageF);
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } =await worker.recognize(imageF);
    console.log(text);
    performExtractionLogic(text,image[0]).then((res)=>{
        //setStatusText("No contacts found in previous load start again");
        
    });
    await worker.terminate().then(()=>{
      console.log("First workers job complete");
      console.log("complete");
      intitalLoad = false;
      console.log(image.length);
      image.shift();
      console.log(image.length);
      setProcessedImage(parseInt(imageTotal)-parseInt(image.length) +  "/"+imageTotal);
      if(image.length>0)
      {
        setProgress(parseInt((parseInt(count)/parseInt(imageTotal))*100))
        processImage();
      }
      else
      {
        console.log(stringList);
        console.log(Array.from(stringList).toString().length)
        setText(Array.from(stringList).toString());
        console.log(Array.from(fileNamesWithErrors).toString());
        setContacts(Array.from(stringList).toString());
        setErrors(Array.from(fileNamesWithErrors).toString());
        setIsDownloadable(true);

      }

      URL.revokeObjectURL(imageF);
    });
  }

  const performExtractionLogic = async(text,imageName)=>
  {
    count = parseInt(count) + 1;
    console.log(count);
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
                var regExp = /[a-zA-Z]/g;
                if(regExp.test(text.toString()))
                {
                  fileNamesWithErrors.add(imageName.toString());
                  console.log("ErrorImage"+imageName.name);
                  setErrorImageCount(parseInt(fileNamesWithErrors.size))
                }else
                {
                  console.log("Number found!!");
                  console.log(text.toString());
                  stringList.add(text.toString())
                  setContactScrappedCount(stringList.size);
                }

              }
              return 1;
            }else
            {
              return -1;
            }
          });
  }


  const handleSubmit = () => {
    console.log(image);
    setIsLoading(true);
    var count = 0;
    const total = image.length;
    console.log(total);
    setStatusText("Converting please wait");
  }

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
                console.log(text.toString());
                stringList.push(text.toString());
              }
            }
          });

          console.log(stringList.toString());
          setText(stringList.toString());
          setProgress(0);
        })
        .then(() => {
          if (index === 0) {
            console.log("complete");
            console.log(stringList.toString());
            setIsLoading(false);
            setIntroText("");
            setText(stringList.toString());
          }
        });
    });
  }

  function csvFormatForContact(data) {
return ['Client',data]
  }

  
  const downloadContact =()=>{
    console.log("Download string list: "+contactsScrapped);
    let scList = contactsScrapped.split(',');
    console.log(scList);
    let reqList = scList.map(csvFormatForContact);
    reqList.unshift(['Name','Phone']);
    let content =  reqList;
    console.log(content);
    content = content.join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let date = Date.now();
    a.download = `contacts_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  const downloadErrorImageName =()=>{
    let content = errorsList;
    content = content;
    const blob = new Blob([content], { type: "plain/txt" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    let date = Date.now();
    a.download = `errorLogs_${date}.txt`;
  
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
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
              <h4 className="text-center py-3 mc-3">Whats app phone number</h4>
              {!isLoading && !isDownloadable && (
              <p className='text-center text-secondary'>{introText}</p>
              )}
            </>
         
          
            <>
             {isLoading && !isDownloadable && (
             
             <>
             <p className='mt-2'>Status:</p>
              <div className="progress">
                <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">{progress}%</div>
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
               <button type="button" className="disabled btn btn-primary mt-3">Stop Execution</button>
             )}

             {isDownloadable &&
             (
              <>
                <button type="button" onClick={downloadContact} className="btn btn-primary mb-3">Download Contacts</button>
              <button type="button" onClick={downloadErrorImageName} className="btn btn-secondary">Download Error List</button>
              <button type="button"  className="btn btn-secondary mt-3 disabled">Run Again</button>
              </>

             )}
             </>
             )}



            </>
          
          {!isLoading && !text && (
            <>
              <input
                type="file"
                onChange={(e) =>{
                  
                  setImage(
                    Array.from(e.target.files).map(convertImageToURLArray),
                  );
                  setStatusText(" Number of images added: "+Array.from(e.target.files).length)

                }
                }
                className="form-control mt-5 mb-2"
                multiple
              />
              <input
                type="button"
                onClick={image.length>0?startProcess:noImage}
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
