import { convertUnit, formatArea, formatLength } from "./measurements";
import axios from "axios";
import moment from "moment";
import { api } from "../config";
import { Point } from "ol/geom";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import CircleStyle from "ol/style/Circle";
import { handleCheckboxChange, listItemStyleChange } from "./map";
import { toast } from "react-toastify";

export function getDefaultStyle(feature) {
  const geometry = feature?.getGeometry();
  if (geometry instanceof Point) {
    return new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.04,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
      }),
    });
  } else {
    return new Style({
      stroke: new Stroke({
        color: "#448aff",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(68, 138, 255, 0.4)",
      }),
    });
  }
}
export function handleSideNavItemClick(pinFeature, source, featureId) {
  const allListItems = document.querySelectorAll("#measurements li");
  allListItems.forEach((item) => {
    item.style.backgroundColor = "";
    const feature = source?.getFeatureById(
      item.getAttribute("data-feature-id")
    );
    if (feature) {
      feature?.setStyle(getDefaultStyle(feature));
    }
  });

  pinFeature.setStyle(
    new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.06,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
      }),
    })
  );
}
export function getConversions(geom, isPolygon, map) {
  if (isPolygon) {
    return ["meters", "hectares", "acres", "kilometers"]
      .map(
        (unit) =>
          `<p>${unit}: ${convertUnit(formatArea(geom, unit), unit, true)}</p>`
      )
      .join("");
  } else {
    return ["meters", "kilometers", "feet", "miles"]
      .map(
        (unit) =>
          `<p>${unit}: ${convertUnit(
            formatLength(geom, unit),
            unit,
            false
          )}</p>`
      )
      .join("");
  }
}

export const extentionScrapper = (url) => {
  return url?.split(".").pop().toLowerCase();
};

export const addAnnotationToOrtho = async (id, body) => {
  // --- FIX: Add a guard clause to ensure an ID is present ---
  if (!id) {
    console.error("addAnnotationToOrtho was called without a valid ID.");
    toast.error("Cannot save annotation: No active project ID found.");
    return; // Stop the function from proceeding
  }
  // --- END FIX ---

  try {
    const res = await axios.put(`${api}update-annotations/${id}`, body);
    return res; // Return success response
  } catch (error) {
    toast.error("Failed to save annotation.");
    console.error("Error adding annotation:", error);
  }
};

export const addFileAnnotationToOrtho = async (id, body) => {
  const orthoId = localStorage.getItem("orthoId");
  try {
    // Using the 'id' parameter passed to the function for consistency.
    const res = await axios.put(`${api}update-annotations/${id}`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // Return response data
  } catch (error) {
    console.error("Upload failed:", error);
    if (error.response) {
      // +++ 3. USE TOAST FOR ERROR NOTIFICATION +++
      toast.error(`Server Error: ${error.response.status}`);
    } else if (error.request) {
      toast.error("No response from server. Check network connection.");
    } else {
      toast.error(`Request Error: ${error.message}`);
    }
    throw error; // Re-throw to allow caller to handle
  }
};
export const updateAnnotationFeature = async (id, body) => {
  try {
    const { data } = await axios.put(
      `${api}measurement/feature/edit/${id}`,
      body
    );
    return data;
  } catch (error) {
    // +++ 3. USE TOAST FOR ERROR NOTIFICATION +++
    toast.error("Failed to update feature.");
    console.error("Error updating feature:", error);
  }
};
export const deleteAnnotationToOrtho = async (id) => {
  try {
    // ===================================================================
    // == FIX FOR DOUBLE SLASH ===========================================
    // ===================================================================
    // The original call had an extra slash at the beginning.
    // By removing it, this will work whether your `api` variable
    // has a trailing slash or not.
    const { data } = await axios.delete(
      `${api}deleteMeasurementByfeatureId/${id}` // ORIGINAL: Had a leading slash that caused `//`
    );
    return { success: true, data };
  } catch (error) {
    console.error("Failed to delete annotation on the server:", error);
    toast.error("Could not delete the annotation.");
    return { success: false, error };
  }
};

export const getAnnotationToOrtho = async (id) => {
  // --- FIX: More robust guard clause ---
  if (!id || id === "undefined") {
    console.warn("getAnnotationToOrtho was called with an invalid ID:", id);
    return; // Stop the function completely
  }
  // --- END FIX ---
  try {
    const { data } = await axios.get(`${api}arthouses/${id}`);
    return data;
  } catch (error) {
    // This will now catch the 400 error from the server
    console.error("Error fetching Arthouse/Ortho data:", error);
  }
};

export function sortDatesAscending(dates) {
  const dateObjects = dates?.map((date) => new Date(date));
  return dateObjects?.sort((a, b) => a - b);
}
export function ymdFormat(dates) {
  const dateObjects = dates?.map((date) => new Date(date));
  const formatedDates = dateObjects?.map((date) => {
    return moment(date).format("YYYY-MM-DD");
  });
  return formatedDates;
}
export function dateDiffInDays(date1, date2) {
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();
  var difference_ms = Math.abs(date1_ms - date2_ms);
  return Math.floor(difference_ms / (1000 * 60 * 60 * 24));
}
export const stringShortner = (string) => {
  if (string?.length > 20) {
    return string.substring(0, 20) + "..";
  } else {
    return string;
  }
};
export const rgbToHexa = (value) => {
  // Extract the RGBA components
  const parts = value?.match(/rgba?\((\d+), (\d+), (\d+), ([\d.]+)\)/);
  if (!parts) {
    throw new Error("Invalid RGBA format");
  }

  // Convert the RGB components to hexadecimal
  const r = parseInt(parts[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(parts[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(parts[3], 10).toString(16).padStart(2, "0");

  // Convert the alpha component to hexadecimal (0-255 range)
  const a = Math.round(parseFloat(parts[4]) * 255)
    .toString(16)
    .padStart(2, "0");

  // Combine the components into a single hexadecimal string
  return `#${r}${g}${b}`;
};

export function createListItem(
  label,
  index,
  featureID,
  isPolygon,
  type,
  addStaticAnnotation
) {
  const listItem = document.createElement("li");
  listItem.setAttribute(
    "id",
    "li-item" + index + localStorage.getItem("orthoId")
  );
  listItem.setAttribute("data-feature-id", featureID);
  listItem.setAttribute("staticId", featureID);
  addStaticAnnotation(featureID);
  let icon = "";
  switch (type.toLowerCase()) {
    case "pin":
      icon = `
        <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="annotation-icon">
          <path d="M8 2a4.1 4.1 0 0 0-4 4.2C4 9.35 8 14 8 14s4-4.65 4-7.8A4.1 4.1 0 0 0 8 2Zm0 6a2 2 0 0 1-1.9-2A2 2 0 0 1 8 4a2 2 0 0 1 1.9 2A2 2 0 0 1 8 8Z" fill="#FFFFFF"></path>
        </svg>`;
      break;
    case "line":
      icon = `
        <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="annotation-icon">
          <path d="M12.5 2a1.491 1.491 0 0 0-1.35 2.143L4.143 11.15a1.515 1.515 0 1 0 .707.707l7.007-7.007A1.498 1.498 0 1 0 12.5 2Z" fill="#FFFFFF"></path>
        </svg>`;
      break;
    case "polygon":
      icon = `
        <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="annotation-icon">
          <path d="M13 11.092V4.908A1.496 1.496 0 1 0 11.092 3H4.908A1.496 1.496 0 1 0 3 4.908v6.184A1.496 1.496 0 1 0 4.908 13h6.184a1.495 1.495 0 0 0 2.47.562 1.497 1.497 0 0 0-.562-2.47ZM11.092 12H4.908A1.494 1.494 0 0 0 4 11.092V4.908A1.495 1.495 0 0 0 4.908 4h6.184a1.495 1.495 0 0 0 .908.908v6.184a1.495 1.495 0 0 0-.908.908Z" fill="#FFFFFF"></path>
        </svg>`;
      break;
    case "kml":
    case "kmz":
    case "shp":
    case "shz":
    case "dxf":
      icon = `
        <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="annotation-icon">
          <path d="M11 2H5l3 3 3-3Z" fill="#FFFFFF"></path>
          <path d="M14 11V3a1 1 0 0 0-1-1L9 6l5 5Z" fill="#FFFFFF"></path>
          <path d="M7 6 3 2a1 1 0 0 0-1 1v8l3-3 2-2Z" fill="#FFFFFF"></path>
          <path d="M2 13a1 1 0 0 0 1 1h6l-4-4-3 3Z" fill="#FFFFFF"></path>
          <path d="m6 9 5 5h2a1 1 0 0 0 1-1L8 7 6 9Z" fill="#FFFFFF"></path>
        </svg>`;
      break;
    default:
      icon = ""; // Set to empty if no valid type
      break;
  }

  listItem.innerHTML = `
    <div class='flex' style="display: flex; gap: .3rem;">
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div class="flex align-center" style="display: flex; gap: .3rem;">
        ${icon}
        <div id="sidenav-list-item-r1${index}">
          <span>${stringShortner(label)}</span>
        </div>
      </div>
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  return listItem;
}

export function serializingPin(feature) {
  const geometry = feature?.getGeometry();
  const featureID = "feature-" + Date.now();
  feature?.setId(featureID);
  return {
    id: featureID,
    label: feature?.get("label"),
    coords: geometry.getCoordinates(),
  };
}
export function serializeFeature(feature, featureID) {
  const geometry = feature?.getGeometry();
  const style = new Style({
    fill: new Fill({
      color: "rgba(68, 138, 255, 0.4)",
    }),
    stroke: new Stroke({
      color: "#448aff",
      width: 1,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#448aff",
      }),
    }),
  });
  // const featureID = "feature-" + Date.now();
  feature?.setId(featureID);
  return {
    id: featureID,
    type: geometry?.getType(),
    coordinates: geometry.getCoordinates(),
    label:
      feature?.get("lable") || geometry?.getType() == "Polygon"
        ? "Polygon"
        : geometry?.getType() == "Point"
          ? "Pin"
          : "Line",
    style: {
      strokeColor: feature?.get("strokeColor") || style.getStroke()?.getColor(),
      strokeWidth: feature?.get("strokeWidth") || style.getStroke()?.getWidth(),
      fillColor: feature?.get("fillColor") || style.getFill()?.getColor(),
      fillOpacity: feature?.get("fillOpacity") ?? 0.3,
    },
    properties: feature?.getProperties(),
  };
}

export function hexToRgba(hex, opacity) {
  // Remove the hash at the start if it's there
  hex = hex?.replace(/^#/, "");

  // Parse the r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  // Return the rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function removeSelectedStyle(source) {
  const measurementsList = document.getElementById("measurements");
  const allListItems = measurementsList.querySelectorAll("li");
  allListItems.forEach((item) => {
    item.style.backgroundColor = "";
    const featureId = item.getAttribute("data-feature-id");
    const feature = source?.getFeatureById(featureId);
    // console.log(feature);
    if (!feature) return;

    if (feature.getGeometry().getType() == "Point") {
      const style = new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.04,
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
        }),
      });
      feature?.setStyle(style);
    } else {
      const storedStyle = feature?.get("storedStyle") || null;
      // console.log({ storedStyle });
      feature?.setStyle(storedStyle);
    }
  });
}
export function removeSelectedCompareStyle(source) {
  const m1 = document.getElementsByClassName("measurements1")[0]; // Get first element
  const m2 = document.getElementsByClassName("measurements2")[0]; // Get first element

  if (!m1 || !m2) return; // Guard clause if elements don't exist

  const I1 = m1.querySelectorAll("li");
  const I2 = m2.querySelectorAll("li");

  [...I1, ...I2].forEach((item) => {
    item.style.backgroundColor = "";
    const featureId = item.getAttribute("data-feature-id");
    const feature = source?.getFeatureById(featureId);
    if (!feature) return;
    if (feature.getGeometry().getType() == "Point") {
      const style = new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.04,
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
        }),
      });
      feature?.setStyle(style);
    } else {
      const storedStyle = feature?.get("storedStyle") || null;
      feature?.setStyle(storedStyle);
    }
  });
}
export function updateListItemStyles(featureID, source) {
  const measurementsList = document.getElementById("measurements");
  const allListItems = measurementsList.querySelectorAll("li");
  allListItems.forEach((item) => {
    // item.style.backgroundColor = "";
    const featureId = item.getAttribute("data-feature-id");
    // console.log(featureId);
    const feature = source?.getFeatureById(featureId);
    // console.log({ feature });
    if (!feature) return;

    if (feature.getGeometry().getType() == "Point") {
      const style = new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.04,
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
        }),
      });
      feature?.setStyle(style);
    } else {
      const storedStyle = feature?.get("storedStyle") || null;
      feature?.setStyle(storedStyle);
    }
  });

  const feature = source?.getFeatureById(featureID);
  if (feature) {
    const highlightStyle = new Style({
      stroke: new Stroke({ color: "black", width: 3 }),
      fill: new Fill({ color: "rgba(0, 255, 0, 0.2)" }),
      image: new CircleStyle({ radius: 7, fill: new Fill({ color: "black" }) }),
    });
    feature?.setStyle(highlightStyle);
  }
}

export function addToMeasurementsList(
  type,
  layer,
  fileName,
  map,
  id,
  isUrl,
  editOption,
  source,
  addStaticAnnotation,
  setAnnotationFuntion
) {
  if (isUrl) return;
  const layerId = "layer-" + Date.now();
  layer.set("id", layerId);
  layer.set("drawing", true);
  setAnnotationFuntion({
    data: {
      label: fileName,
      id: id,
      isPolygon: false,
      featureID: id,
      type: type,
    },
    label: fileName,
    isPolygon: false,
    featureID: id,
    type: type,
    featureId: id,
  });
  editOption({
    label: fileName,
    isPolygon: false,
    featureID: id,
    type: type,
    featureId: id,
  });
}

function setupEventListeners(listItem, layer, fileName, layerId, map, id) {
  const checkbox = listItem.querySelector('input[type="checkbox"]');
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${listItem.getAttribute("id").slice(7)}`
  );

  checkbox.addEventListener("change", () => layer.setVisible(checkbox.checked));

  deleteBtn.addEventListener("click", async () => {
    const deletes = await deleteAnnotationToOrtho(id);
    map.removeLayer(layer);
    listItem.remove();
    document.getElementById("edit-options").innerHTML = "";
  });

  sideNavDetails.addEventListener("click", () => {
    document
      .querySelectorAll("#measurements li")
      .forEach((item) => (item.style.backgroundColor = ""));
    listItem.style.backgroundColor = "#636363";
    map.getView().setCenter(layer.getSource().getExtent());

    // renderShpEditOptions(layer, fileName, layerId, id);
  });
}

// Create the table rows dynamically based on the feature data
export const createTableRow = (data, isHeader, extension) => {
  return (
    <>
      {data?.map((item, index) => {
        let text = item;
        if (!item) return;
        if (
          (extension === "kml" || extension === "kmz") &&
          typeof item === "string" && // This is the fix
          item.includes("http://localhost")
        ) {
          text = item?.split("#")[1];
        }
        return isHeader ? (
          <th key={index} style={tableCellStyle}>
            {text}
          </th>
        ) : (
          <td key={index} style={tableCellStyle}>
            {text?.toString().toLowerCase()}
          </td>
        );
      })}
    </>
  );
};

// Render the feature data table
export const renderFeatureData = (propertyNames, features, fileName) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>{createTableRow(propertyNames, true, fileName)}</tr>
      </thead>
      <tbody>
        {features?.map((feature, index) => (
          <tr key={index}>
            {createTableRow(
              propertyNames?.map((prop) => feature?.get(prop)),
              false,
              fileName
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
const tableStyle = {
  borderCollapse: "collapse",
  width: "100%",
};

const tableCellStyle = {
  border: "1px solid #4d4848",
  padding: "5px",
  fontSize: "12px",
};

export const getIcons = (type) => {
  let icon;
  switch (type) {
    case "pin":
      icon = (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          className="annotation-icon"
          focusable="false"
        >
          <path
            d="M8 2a4.1 4.1 0 0 0-4 4.2C4 9.35 8 14 8 14s4-4.65 4-7.8A4.1 4.1 0 0 0 8 2Zm0 6a2 2 0 0 1-1.9-2A2 2 0 0 1 8 4a2 2 0 0 1 1.9 2A2 2 0 0 1 8 8Z"
            fill="#FFFFFF"
          ></path>
        </svg>
      );
      break;
    case "line":
      icon = (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          className="annotation-icon"
          focusable="false"
        >
          <path
            d="M12.5 2a1.491 1.491 0 0 0-1.35 2.143L4.143 11.15a1.515 1.515 0 1 0 .707.707l7.007-7.007A1.498 1.498 0 1 0 12.5 2Z"
            fill="#FFFFFF"
          ></path>
        </svg>
      );
      break;
    case "polygon":
      icon = (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          className="annotation-icon"
          focusable="false"
        >
          <path
            d="M13 11.092V4.908A1.496 1.496 0 1 0 11.092 3H4.908A1.496 1.496 0 1 0 3 4.908v6.184A1.496 1.496 0 1 0 4.908 13h6.184a1.495 1.495 0 0 0 2.47.562 1.497 1.497 0 0 0-.562-2.47ZM11.092 12H4.908A1.494 1.494 0 0 0 4 11.092V4.908A1.495 1.495 0 0 0 4.908 4h6.184a1.495 1.495 0 0 0 .908.908v6.184a1.495 1.495 0 0 0-.908.908Z"
            fill="#FFFFFF"
          ></path>
        </svg>
      );
      break;
    case "kml":
    case "kmz":
    case "shp":
    case "shz":
    case "dxf":
      icon = (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          className="annotation-icon"
        >
          <path d="M11 2H5l3 3 3-3Z" fill="#FFFFFF"></path>
          <path d="M14 11V3a1 1 0 0 0-1-1L9 6l5 5Z" fill="#FFFFFF"></path>
          <path d="M7 6 3 2a1 1 0 0 0-1 1v8l3-3 2-2Z" fill="#FFFFFF"></path>
          <path d="M2 13a1 1 0 0 0 1 1h6l-4-4-3 3Z" fill="#FFFFFF"></path>
          <path d="m6 9 5 5h2a1 1 0 0 0 1-1L8 7 6 9Z" fill="#FFFFFF"></path>
        </svg>
      );
      break;
    default:
      break;
  }
  return icon;
};
function getLayersById(map, id) {
  const layers = map?.getLayers()?.getArray();
  const filter = layers?.filter((layer) => layer?.get("layerId") === id);
  return filter;
}

export const deleteHandler = async (
  id,
  type,
  annotations,
  updateAnnotation,
  source,
  map
) => {
  try {
    const element = document.querySelector('[overlay-featureId="' + id + '"]');
    if (element) element.style.display = "none";
    const filtered = annotations?.filter((e) => e.data.id !== id);

    updateAnnotation(filtered);
    const feature = source?.getFeatureById(id);
    if (!feature) return;
    // const element = document.querySelector(`[data-feature-id=${id}]`);
    // if (element) element.remove();

    // await deleteAnnotationToOrtho(id);

    if (["kml", "kmz", "shp", "shz", "dxf"].includes(type)) {
      const layer = getLayersById(map, id);
      if (layer?.length <= 0) {
        toast.error("Layer not found on map.");
        return;
      }
      layer?.forEach((e) => map.removeLayer(e));

      // map?.removeLayer(layer);
    }
    source?.removeFeature(feature);
  } catch (error) {
    toast.error("An error occurred while deleting.");
  }
};
