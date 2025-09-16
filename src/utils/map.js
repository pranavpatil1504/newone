import "ol/ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import WebGLTileLayer from "ol/layer/WebGLTile.js";
import XYZ from "ol/source/XYZ.js";
import GeoTIFF from "ol/source/GeoTIFF.js";

import { Feature, Overlay } from "ol";
import { LineString, Point, Polygon } from "ol/geom";
import { Fill, Icon, Stroke, Style } from "ol/style";
import {
  addAnnotationToOrtho,
  deleteAnnotationToOrtho,
  extentionScrapper,
  serializeFeature,
} from "./Functions";
import CircleStyle from "ol/style/Circle";
import { convertUnit, formatArea, formatLength } from "./measurements";
import { getLength, getArea } from "ol/sphere";
import { handleKmlKmzFiles } from "./File/KmlKmz/KmlKmzFile";

export function createPinFeature(coords) {
  if (!coords) return;
  const pinFeature = new Feature({
    geometry: new Point(coords),
    name: "New Pin",
  });

  const style = new Style({
    image: new Icon({
      src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      scale: 0.04,
      anchor: [0.5, 1],
      anchorXUnits: "fraction",
      anchorYUnits: "fraction",
    }),
  });

  pinFeature?.setStyle(style);
  pinFeature?.set("storedStyle", style);
  return pinFeature;
}

export function deserializeFeature(data, isPolygon) {
  let geometry;

  // Check geometry type and create accordingly
  if (data.type === "Polygon") {
    geometry = new Polygon(data.coordinates);
  } else if (data.type === "LineString") {
    geometry = new LineString(data.coordinates);
  } else {
    // throw new Error("Unsupported geometry type: " + data.type);
  }

  // Create the feature with the geometry
  const feature = new Feature(geometry);
  feature?.setId(data.id);
  feature?.set("featureId", data?.featureId);

  const strokeColor = data?.style?.strokeColor || "#448aff";
  const strokeWidth = data?.style?.strokeWidth || 2;
  const fillColor = data?.style?.fillColor || "rgba(68, 138, 255, 0.4)";
  const fillOpacity = data?.style?.fillOpacity ?? 0.4;

  const style = new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
    }),
    fill: new Fill({
      color: fillColor.includes("rgba")
        ? fillColor
        : `${fillColor}${Math.round(fillOpacity * 255)
          .toString(16)
          .padStart(2, "0")}`,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: strokeColor,
      }),
    }),
  });

  feature?.setStyle(style);
  feature?.set("storedStyle", style);

  if (data.properties) {
    feature?.setProperties(data.properties.geometry);
  }

  return feature;
}

export function handleCheckboxChange(featureID, isChecked, source, id) {
  const feature = source?.getFeatureById(featureID);
  if (!feature) return;
  const element = document.querySelector('[overlay-featureId="' + id + '"]');

  if (isChecked) {
    const storedStyle = feature?.get("storedStyle") || null;
    showMeasumentLabels(id);
    feature?.setStyle(storedStyle);
  } else {
    if (element) element.style.display = "none";
    feature?.set("storedStyle", feature?.getStyle());
    feature?.setStyle(new Style());
  }
}

async function handleDeleteBtnClick(listItem, featureID, source) {
  const editOptions = document.getElementById("edit-options");
  const measurementsList = document.getElementById("measurements");
  editOptions.innerHTML = "";
  measurementsList.removeChild(listItem);
  const feature = source?.getFeatureById(featureID);
  if (feature) {
    source?.removeFeature(feature);
  }
  await deleteAnnotationToOrtho(featureID);
  updateRemainingListItems();
}

function updateRemainingListItems() {
  const measurementsList = document.getElementById("measurements");
  const remainingItems = measurementsList.querySelectorAll("li");
  remainingItems.forEach((item, newIndex) => {
    item
      .querySelector("input[type='checkbox']")
      .setAttribute("data-index", newIndex);
    item.setAttribute("value", newIndex);
  });
}

export function centerMapOnFeature(geom, map) {
  const extent = geom.extent_;
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().setCenter(center);
  map.getView().fit(extent);
}

export function localCenterMapOnFeature(geom, map) {
  const extent = geom.getExtent();
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().setCenter(center);
  map.getView().fit(extent);
}

export async function addPin(
  coords,
  map,
  source,
  orthoId,
  editOption,
  setAnnotationFuntion,
  addStaticAnnotation,
  featureID
) {
  const pinFeature = createPinFeature(coords);
  pinFeature?.setId(featureID);
  pinFeature?.set("label", "Pin");
  pinFeature?.set("featureId", featureID);
  source?.addFeature(pinFeature);
  pinFeature?.setProperties({
    featureId: featureID,
    label: "Pin",
  });
  setAnnotationFuntion({
    data: { lable: "Pin", id: featureID, coords },
    label: "Pin",
    feature: pinFeature,
    featureID,
    featureId: featureID,
    type: "pin",
  });
  editOption({
    data: { lable: "Pin", id: featureID, coords },
    label: "Pin",
    feature: pinFeature,
    featureID,
    featureId: featureID,
    type: "pin",
  });

  // send to backend
  addAnnotationToOrtho(orthoId, {
    featureId: featureID,
    data: { coords, id: featureID, label: "Pin" },
    type: "pin",
  });
}

// Default style for features
const style = new Style({
  fill: new Fill({
    color: "rgba(68, 138, 255, 0.4)",
  }),
  stroke: new Stroke({
    color: "#448aff",
    width: 2,
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: "#448aff",
    }),
  }),
});

// Handle drawing end event
export async function handleDrawEnd(
  event,
  isPolygon,
  measureTooltip,
  tooltip,
  source,
  map,
  orthoId,
  editOption,
  setAnnotationFuntion,
  addStaticAnnotation,
  annotations,
  featureID
) {
  tooltip.innerHTML = "";
  const geom = event.feature?.getGeometry();
  const unit = document.getElementById("unitConversion")?.value || "metric";

  // --- FIX: Clone the geometry and transform it for accurate measurement ---
  const geomForMeasurement = geom.clone().transform(map.getView().getProjection(), 'EPSG:4326');

  const measurmentValue = isPolygon ? getArea(geomForMeasurement) : getLength(geomForMeasurement);
  const output = isPolygon ? formatArea(geomForMeasurement, unit) : formatLength(geomForMeasurement, unit);

  const convertedOutput = convertUnit(output, unit, isPolygon);
  console.log("Converted output:", convertedOutput);
  const label = isPolygon ? "Polygon" : "Line";

  // Apply default style to the drawn feature
  event.feature?.setStyle(style);
  event.feature?.set("storedStyle", style);

  event?.feature?.set("label", label);
  event?.feature?.set("measurement", convertedOutput);
  event?.feature?.set("orthoId", orthoId);
  event?.feature?.setId("featureId", featureID);
  const serializing = serializeFeature(event.feature, featureID);

  event.feature?.setProperties({
    featureId: featureID,
    label: label,
    measurement: convertedOutput,
    orthoId: orthoId,
    output: output,
  });
  const featureData = {
    ...serializing,
    featureID: featureID,
    label: event.feature?.get("label"),
    measurement: event.feature?.get("measurement"),
    orthoId: event.feature?.get("orthoId"),
    output: event.feature?.get("output"),
  };

  setAnnotationFuntion({
    type: isPolygon ? "polygon" : "line",
    featureId: featureID,
    data: {
      label,
      geom,
      measurement: measurmentValue,
      convertedOutput,
      id: featureID,
      ...featureData,
    },
  });
  editOption({
    label,
    geom,
    convertedOutput,
    isPolygon,
    featureID,
    measurement: measurmentValue,
    featureData,
    type: isPolygon ? "polygon" : "line",
  });

  // Reapply hidden styles
  const checkboxes = document.querySelectorAll(".measurement-checkbox");
  checkboxes.forEach((cb) => {
    const id = cb.closest("li").getAttribute("data-feature-id");
    handleCheckboxChange(id, cb.checked, source);
  });

  // send to backend
  await addAnnotationToOrtho(orthoId, {
    featureId: featureID,
    data: featureData,
    type: isPolygon ? "polygon" : "line",
  });
}

// Create satellite layer function
export function createSatelliteLayer() {
  // Option 1: Using Esri World Imagery (free, no API key required)
  return new TileLayer({
    source: new XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attributions:
        "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }),
  });
}

// Alternative satellite sources (choose one)
export function createAlternativeSatelliteLayers() {
  // Option 2: Google Satellite (may require proper attribution)
  const googleSatellite = new TileLayer({
    source: new XYZ({
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attributions: "© Google",
    }),
  });

  // Option 3: Bing Satellite (requires API key)
  // const bingSatellite = new TileLayer({
  //   source: new BingMaps({
  //     key: 'YOUR_BING_MAPS_API_KEY',
  //     imagerySet: 'Aerial'
  //   })
  // });

  return { googleSatellite };
}

export async function updateGeoTIFFLayer(
  newUrl,
  map,
  source,
  setAnnotationFuntion,
  // --- CHANGE 1: Add a new zIndex parameter with a default value ---
  zIndex = 1
) {
  const fileExtension = extentionScrapper(newUrl);

  if (fileExtension === "tif") {
    const newGeotiffSource = new GeoTIFF({
      sources: [
        {
          url: newUrl,
          bands: [0, 0, 0],
          nodata: 255,
        },
      ],
      interpolate: true,
      convertToRGB: true,
    });

    const geotiffLayer = new WebGLTileLayer({
      source: newGeotiffSource,
      opacity: 1,
      // --- CHANGE 2: Use the zIndex parameter passed to the function ---
      zIndex: zIndex,
    });

    map.addLayer(geotiffLayer);

    try {
      const viewOptions = await newGeotiffSource.getView();
      const view = new View(viewOptions);
      map.setView(view);

      if (viewOptions.extent) {
        map.getView().fit(viewOptions.extent, {
          padding: [20, 20, 20, 20],
          duration: 1000,
        });
      }
    } catch (error) {
      console.error("Failed to load GeoTIFF view:", error);
      map.setView(
        new View({
          center: [0, 0],
          zoom: 2,
        })
      );
    }

    return geotiffLayer;

  } else if (["kml", "kmz"].includes(fileExtension)) {
    handleKmlKmzFiles(
      null,
      newUrl,
      map,
      false,
      "1",
      "Ortho",
      () => { },
      source,
      () => { },
      setAnnotationFuntion
    );
  }

  return null;
}

// Initialize map with satellite layer
export function initializeMapWithSatellite(target) {
  const satelliteLayer = createSatelliteLayer();

  const map = new Map({
    target: target,
    layers: [satelliteLayer],
    view: new View({
      center: [0, 0], // Center of the world
      zoom: 2,
    }),
  });

  return map;
}

export const listItemStyleChange = (id) => {
  const layerItems = document.querySelectorAll("#layers li");
  const measurementItems = document.querySelectorAll("#measurements li");
  [...measurementItems, ...layerItems]?.forEach((item) => {
    item.className = "";
    if (item.getAttribute("data-feature-id") === id) {
      item.classList.add("select");
    }
  });
};

export const createMeasurementOverlay = (
  measurement = "",
  center,
  featureId
) => {
  const element = document.createElement("div");
  element.className = "measurement-label";
  element.setAttribute("overlay-featureId", featureId);
  element.style.display = "none";
  element.style.padding = "4px 8px";
  element.style.borderRadius = "6px";
  element.style.backgroundColor = "var(--bg-secondary)";
  element.style.border = "1px solid var(--border-primary)";
  element.style.color = "var(--text-primary)";
  element.innerHTML = `
    <div style="font-size: 16px; font-weight: 500; text-shadow: 
    1px 1px 0 var(--bg-primary),  
    -1px -1px 0 var(--bg-primary), 
    1px -1px 0 var(--bg-primary), 
    -1px 1px 0 var(--bg-primary);" id='overlay-text-${featureId}'>
      ${measurement ?? ""}
    </div>
  `;
  return new Overlay({
    element: element,
    position: center,
    positioning: "center-center",
    id: `overlay-${featureId}`,
  });
};

export const createPinOverlay = (measurement = "", center, featureId) => {
  const element = document.createElement("div");
  element.className = "measurement-label";
  element.setAttribute("overlay-featureId", featureId);
  element.style.display = "none";
  element.style.padding = "4px 8px";
  element.style.borderRadius = "6px";
  element.style.backgroundColor = "var(--bg-secondary)";
  element.style.border = "1px solid var(--border-primary)";
  element.style.color = "var(--text-primary)";
  element.innerHTML = `
    <div style="font-size: 16px; font-weight: 500; text-shadow: 
    1px 1px 0 var(--bg-primary),  
    -1px -1px 0 var(--bg-primary), 
    1px -1px 0 var(--bg-primary), 
    -1px 1px 0 var(--bg-primary);" id='overlay-text-${featureId}'>
      ${measurement ?? ""}
    </div>
  `;

  return new Overlay({
    element: element,
    position: center,
    positioning: "center-center",
    offset: [0, -30],
    id: `overlay-${featureId}`,
  });
};

export const showMeasumentLabels = (featureId) => {
  const measurementLabels = document.querySelectorAll(".measurement-label");
  measurementLabels?.forEach((e) => (e.style.display = "none"));
  const element = document.querySelector(
    '[overlay-featureId="' + featureId + '"]'
  );
  if (element) element.style.display = "block";
};

export const updateOverlayPosition = (
  map,
  featureId,
  newPosition,
  measurement
) => {
  const overlay = map?.getOverlayById(`overlay-${featureId}`);
  const measurementText = document.getElementById(`overlay-text-${featureId}`);
  if (measurementText) measurementText.innerText = measurement;
  if (overlay) {
    overlay.setPosition(newPosition);
  } else {
    console.error(`Overlay with featureId: ${featureId} not found.`);
  }
};