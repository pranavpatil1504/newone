import { addAnnotationToOrtho } from "../../Functions";
import {
  addDwgDxfLayerToMap,
  processDwgFile,
  processDxfContent,
  processDxfFile,
} from "./DxfFunctions";
import { toast } from "react-toastify";

export async function handleDwgDxfFiles(
  event,
  map,
  presignedUrl = null,
  id = null,
  lable = null,
  setEditOptions,
  source,
  addStaticAnnotation,
  setAnnotationFuntion,
  orthoId = ""
) {
  if (presignedUrl) {
    try {
      const response = await fetch(presignedUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch DXF file from URL: ${response.statusText}`
        );
      }
      const dxfContent = await response.text();
      const geojson = await processDxfContent(dxfContent);
      addDwgDxfLayerToMap(
        "dxf",
        geojson,
        lable || "DXF",
        map,
        id,
        true,
        setEditOptions,
        source,
        addStaticAnnotation,
        setAnnotationFuntion
      );
    } catch (error) {
      console.error("Error processing presigned KML:", error);
    }
  } else if (event && event.target.files) {
    const files = event.target.files;
    for (let file of files) {
      try {
        const fileExtension = file.name.split(".").pop().toLowerCase();
        let geojson;
        let type;
        if (fileExtension === "dxf") {
          geojson = await processDxfFile(file);
          type = "dxf";
        } else if (fileExtension === "dwg") {
          geojson = await processDwgFile(file);
          type = "dxf";
        } else {
          throw new Error("Unsupported file type");
        }
        const featureID = "feature-" + Date.now();
        const formData = new FormData();
        const obj = { id: featureID, name: file.name, label: lable };
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

        addDwgDxfLayerToMap(
          "dxf",
          geojson,
          file.name,
          map,
          featureID,
          false,
          setEditOptions,
          source,
          addStaticAnnotation,
          setAnnotationFuntion
        );
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(`Error processing ${file.name}`);
      }
    }
  }
}


