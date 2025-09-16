import React, { useState, useEffect, useRef, useContext } from "react";
import { extentionScrapper } from "../../utils/Functions";
import { useMap } from "../../context/Map";
import { handleShpFile } from "../../utils/File/ShpShz/FileHandler";
import { handleDwgDxfFiles } from "../../utils/File/DXF/DXfFile";
import { handleKmlKmzFiles } from "../../utils/File/KmlKmz/KmlKmzFile";
import { useEditOptions } from "../../context/editOptionsDetails";
import { AnnotationsContext } from "../../context/Annotations";

const DropIt = () => {
  const { map, source } = useMap();
  const { editOptions, setEditOptions } = useEditOptions();
  const overlayRef = useRef(null);
  const { addStaticAnnotation, addAnnotation } = useContext(AnnotationsContext);
  const { orthoId } = useState();
  useEffect(() => {
    const overlay = overlayRef.current;
    const body = document.body;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (overlay) {
        overlay.style.display = "flex";
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null && overlay) {
        overlay.style.display = "none";
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (overlay) {
        overlay.style.display = "none";
      }

      const files = e.dataTransfer.files;
      handleFiles(files, map);
    };

    // Add event listeners
    body.addEventListener("dragenter", handleDragEnter);
    body.addEventListener("dragover", handleDragOver);
    body.addEventListener("dragleave", handleDragLeave);
    body.addEventListener("drop", handleDrop);

    // Cleanup event listeners when component unmounts
    return () => {
      body.removeEventListener("dragenter", handleDragEnter);
      body.removeEventListener("dragover", handleDragOver);
      body.removeEventListener("dragleave", handleDragLeave);
      body.removeEventListener("drop", handleDrop);
    };
  }, [map]); // Dependencies for useEffect

  const setAnnotationFuntion = (annot) => {
    addAnnotation(annot);
  };
  const setEditOPtionHandler = (data) => {
    setEditOptions(data);
  };
  const addStaticAnnotationfunc = (data) => {
    addStaticAnnotation(data);
  };
  const handleFiles = (files, map) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      const fileExtension = extentionScrapper(fileName);

      // Switch case for handling different file types
      switch (fileExtension) {
        case "kml":
        case "kmz":
          handleKmlKmzFiles(
            { target: { files: [file] } },
            null,
            map,
            true,
            null,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        case "zip":
        case "shp":
          handleShpFile(
            { target: { files: [file] } },
            map,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        case "dwg":
        case "dxf":
          handleDwgDxfFiles(
            { target: { files: [file] } },
            map,
            null,
            null,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        default:
          console.log("Unsupported file type:", fileExtension);
      }
    }
  };

  return (
    <div id="overlay" ref={overlayRef}>
      <h2>Drop It</h2>
    </div>
  );
};

export default DropIt;
