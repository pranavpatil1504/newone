import { addAnnotationToOrtho } from "../../Functions";
import { fetchFileFromUrl } from "../KmlKmz/KmlKmzFunctions";
import {
  addShpLayerToMap,
  processShpFile,
  processZipFile,
  readFileAsArrayBuffer,
} from "./Functions";
import { toast } from "react-toastify";

export async function handleShpFile(
  event,
  map,
  url = null,
  setEditOptions,
  source,
  addStaticAnnotationfunc,
  setAnnotationFuntion,
  orthoId = ""
) {
  let files;

  if (url) {
    files = [await fetchFileFromUrl(url)];
  } else {
    files = event.target.files;
  }

  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;
      let type;
      if (file.name.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
        type = "zip";
      } else {
        geojson = await processShpFile(arrayBuffer);
        type = "shp";
      }
      const featureID = "feature-" + Date.now();
      const formData = new FormData();
      const obj = { id: featureID, name: file.name, label: file.name };
      formData.append("data", JSON.stringify(obj)); // Corrected this line
      formData.append("id", featureID);
      formData.append("label", file.name);
      formData.append("file", file);
      formData.append("type", type);
      formData.append("type", type);
      formData.append("featureId", featureID);
      
      // --- FIX: Get the active orthoId directly from localStorage ---
      const currentOrthoId = localStorage.getItem("orthoId");
      await addAnnotationToOrtho(currentOrthoId, formData);
      // --- END FIX ---
      
      addShpLayerToMap(
        type,
        geojson,
        file.name,
        map,
        featureID,
        false,
        setEditOptions,
        source,
        addStaticAnnotationfunc,
        setAnnotationFuntion
      );
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      toast.error(`Error processing ${file.name}`);
    }
  }
}

export async function FetchedhHandleShpFile(
  map,
  url,
  id,
  label,
  editOption,
  source,
  addStaticAnnotationfunc
) {
  const files = [await fetchFileFromUrl(url)];
  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;
      let type;
      if (url.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
        type = "zip";
      } else {
        geojson = await processShpFile(arrayBuffer);
        type = "shp";
      }
      addShpLayerToMap(
        type,
        geojson,
        label,
        map,
        id,
        true,
        editOption,
        source,
        addStaticAnnotationfunc
      );
    } catch (error) {
      console.error(`Error processing ${label}:`, error);
      toast.error(`Error processing ${label}`);
    }
  }
}

export const getGeojsonforShpandZip = async (url) => {
  const files = [await fetchFileFromUrl(url)];
  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;
      let type;
      if (url.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
        type = "zip";
      } else {
        geojson = await processShpFile(arrayBuffer);
        type = "shp";
      }
    } catch (error) {
      console.error(`Error processing`, error);
    }
  }
};