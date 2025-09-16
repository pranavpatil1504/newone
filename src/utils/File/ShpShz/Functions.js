import JSZip from "jszip";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { parseDbf, parseShp } from "shpjs";
import { GeoJSON } from "ol/format";
import { addToMeasurementsList } from "../../Functions";

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export async function processZipFile(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const shpFile = zip.file(/.shp$/i)[0];
  const dbfFile = zip.file(/.dbf$/i)[0];
  if (!shpFile || !dbfFile)
    throw new Error("Required files not found in the zip");
  const shpBuffer = await shpFile.async("arraybuffer");
  const dbfBuffer = await dbfFile.async("arraybuffer");
  const shpData = await parseShp(shpBuffer);
  const dbfData = await parseDbf(dbfBuffer);
  return combineShpDbf(shpData, dbfData);
}
function combineShpDbf(shpData, dbfData) {
  return {
    type: "FeatureCollection",
    features: shpData.map((shape, index) => ({
      type: "Feature",
      properties: dbfData[index],
      geometry: shape,
    })),
  };
}
export async function processShpFile(arrayBuffer) {
  const shpData = await parseShp(arrayBuffer);
  return {
    type: "FeatureCollection",
    features: shpData.map((shape) => ({
      type: "Feature",
      properties: {},
      geometry: shape,
    })),
  };
}

export function addShpLayerToMap(
  type,
  geojson,
  fileName,
  map,
  id,
  isUrl,
  editOption,
  source,
  addStaticAnnotation,
  setAnnotationFuntion
) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojson, {
      featureProjection: map.getView().getProjection(),
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  vectorLayer.set("id", "file");
  vectorLayer.set("drawing", true);
  vectorLayer.set("layerId", id);
  vectorLayer.setZIndex(1);
  map.addLayer(vectorLayer);

  if (!isUrl)
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

  map.getView().fit(vectorSource.getExtent(), {
    padding: [50, 50, 50, 50],
    duration: 1000,
  });
}
