import DxfParser from "dxf-parser";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import { addToMeasurementsList } from "../../Functions";
export async function processDxfContent(dxfContent) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DxfParser();
      const dxf = parser.parseSync(dxfContent);
      const geojson = dxfToGeoJSON(dxf);
      resolve(geojson);
    } catch (error) {
      reject(error);
    }
  });
}
export async function processDxfFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parser = new DxfParser();
        const dxf = parser.parseSync(e.target.result);
        const geojson = dxfToGeoJSON(dxf);
        resolve(geojson);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file); // Changed to readAsText
  });
}
export async function processDwgFile(file) {
  throw new Error(
    "DWG processing is not implemented. Consider converting to DXF first."
  );
}
function dxfToGeoJSON(dxf) {
  const features = [];

  Object.values(dxf.entities).forEach((entity) => {
    let geometry;
    switch (entity.type) {
      case "LINE":
        if (
          isValidCoordinate(entity.vertices[0]) &&
          isValidCoordinate(entity.vertices[1])
        ) {
          geometry = {
            type: "LineString",
            coordinates: [
              [entity.vertices[0].x, entity.vertices[0].y],
              [entity.vertices[1].x, entity.vertices[1].y],
            ],
          };
        }
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        const validVertices = entity.vertices.filter(isValidCoordinate);
        if (validVertices.length >= 2) {
          geometry = {
            type: "LineString",
            coordinates: validVertices.map((v) => [v.x, v.y]),
          };
        }
        break;
      // Add more cases for other entity types as needed
    }

    if (geometry) {
      features.push({
        type: "Feature",
        geometry: geometry,
        properties: {},
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
}
function isValidCoordinate(vertex) {
  return (
    vertex &&
    typeof vertex.x === "number" &&
    typeof vertex.y === "number" &&
    isFinite(vertex.x) &&
    isFinite(vertex.y)
  );
}

export function addDwgDxfLayerToMap(
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
      featureProjection: map?.getView()?.getProjection(),
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      stroke: new Stroke({
        color: "blue",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(0, 0, 255, 0.1)",
      }),
    }),
  });
  vectorLayer.set("id", "file");
  vectorLayer.set("drawing", true);
  vectorLayer.set("layerId", id);
  vectorLayer.setZIndex(1);
  map?.addLayer(vectorLayer);

  //TODO add dxf to annotation and create a select function
  if (!isUrl) {
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

    // Zoom to the extent of the new layer
    map?.getView().fit(vectorSource.getExtent(), { padding: [50, 50, 50, 50] });
  }
}



