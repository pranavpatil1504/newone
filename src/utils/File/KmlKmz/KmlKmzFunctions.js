import JSZip from "jszip";
import { KML } from "ol/format";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { addToMeasurementsList } from "../../Functions";

export async function fetchFileFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.blob();
}

export async function extractKmlFromKmz(file) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  const kmlFile = Object.values(zipContent.files).find((f) =>
    f.name.toLowerCase().endsWith(".kml")
  );
  if (!kmlFile) throw new Error("No KML file found in KMZ");
  return await kmlFile.async("text");
}

export async function fetchKmlFromPresignedUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching KML from presigned URL:", error);
    throw error;
  }
}
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
export function addKmlToMap(
  type,
  kmlContent,
  fileName,
  map,
  ortho,
  id,
  isUrl,
  editOption,
  source,
  addStaticAnnotation,
  setAnnotationFuntion
) {
  const kmlFormat = new KML({
    extractStyles: true,
    extractAttributes: true,
  });

  const features = kmlFormat.readFeatures(kmlContent, {
    dataProjection: "EPSG:4326", // Explicitly set the source projection
    featureProjection: map?.getView()?.getProjection(),
  });

  const vectorSource = new VectorSource({
    features: features,
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  vectorLayer.set("id", "file");
  vectorLayer.set("drawing", true);
  vectorLayer.set("layerId", id);
  vectorLayer.setZIndex(1);

  map.addLayer(vectorLayer);

  map.once("rendercomplete", () => {
    // Get the extent of the vector layer
    const extent = vectorSource.getExtent();

    // Validate extent before calculating center
    if (!extent.some((coord) => !Number.isFinite(coord))) {
      const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

      // Validate center coordinates
      if (center.every((coord) => Number.isFinite(coord))) {
        if (!ortho && isUrl) {
          addToMeasurementsList(
            type,
            vectorLayer,
            fileName,
            map,
            id,
            false,
            editOption,
            source,
            addStaticAnnotation,
            setAnnotationFuntion
          );
          map.getView().setCenter(center);
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 18,
          });
        }

        if (!isUrl) {
          map.getView().setCenter(center);
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 18,
          });
        }
      } else {
        console.error("Invalid center coordinates:", center);
      }
    } else {
      console.error("Invalid extent:", extent);
    }

    if (ortho && !isUrl) {
      addToMeasurementsList(
        type,
        vectorLayer,
        fileName,
        map,
        id,
        isUrl,
        editOption,
        source,
        addStaticAnnotation,
        setAnnotationFuntion
      );
    }
  });
}