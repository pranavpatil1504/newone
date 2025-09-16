import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  deleteAnnotationToOrtho,
  handleSideNavItemClick,
  stringShortner,
  updateListItemStyles,
} from "../../../utils/Functions";
import { useEditOptions } from "../../../context/editOptionsDetails";
import { useMap } from "../../../context/Map";
import { getLength, getArea } from "ol/sphere";
import {
  centerMapOnFeature,
  createMeasurementOverlay,
  createPinFeature,
  createPinOverlay,
  deserializeFeature,
  handleCheckboxChange,
  listItemStyleChange,
  showMeasumentLabels,
} from "../../../utils/map";
import { AnnotationsContext } from "../../../context/Annotations";
import { handleKmlKmzFiles } from "../../../utils/File/KmlKmz/KmlKmzFile";
import { handleDwgDxfFiles } from "../../../utils/File/DXF/DXfFile";
import { FetchedhHandleShpFile } from "../../../utils/File/ShpShz/FileHandler";
import { LineString, Polygon } from "ol/geom";
import { isVisible } from "@testing-library/user-event/dist/utils";
import { Style } from "ol/style";
import { Icon as OlIcon } from "ol/style";
import { formatLength } from "../../../utils/measurements";
import { getCenter } from "ol/extent";
import { toast } from "react-toastify";

const AnnotationItem = ({ data, index, source, map }) => {
  const [isChecked, setIsChecked] = useState(true);
  const { setEditOptions, editOptions } = useEditOptions();
  const [Icon, setIcon] = useState();
  const { annotations, updateAnnotation } = useContext(AnnotationsContext);
  let pinFeature;
  const { addStaticAnnotation } = useContext(AnnotationsContext);

  const setEditOptionsFunc = (data) => {
    setEditOptions(data);
  };

  function getLayerById() {
    const layers = map?.getLayers()?.getArray();
    return layers.find((layer) => layer?.get("layerId") === data?.data?.id);
  }
  function getLayersById(id) {
    const layers = map?.getLayers()?.getArray();
    const filter = layers?.filter((layer) => layer?.get("layerId") === id);
    return filter;
  }

  const checkboxHandler = () => {
    setIsChecked(!isChecked);
    if (["kml", "kmz", "shp", "shz", "dxf"].includes(data.type)) {
      const layer = getLayersById(data?.data?.id);
      if (layer.length <= 0) return;
      layer.forEach((e) => e?.setVisible(!isChecked));
      return;
    }

    handleCheckboxChange(data.data.id, !isChecked, source, data?.featureId);
  };

  const clickHandler = (id) => {
    localStorage.setItem('selectedFeatureId', id);
    showMeasumentLabels(data?.featureId);
    listItemStyleChange(id); // This correctly styles the list item itself

    // Let the main state restoration logic handle the feature's map style
    
    if (data.type === "pin") {
      const pin = createPinFeature(data?.data?.coords);
      setEditOptions({
        label: data?.data?.label || data?.data?.lable,
        feature: pin,
        featureID: data?.featureId,
        type: data?.type,
        featureData: data.data,
      });
      const pinCoords = pin?.getGeometry()?.getCoordinates();
      map.getView().setCenter(pinCoords);
    } else if (["line", "polygon"].includes(data.type)) {
      let geometry;
      const isPolygon = data?.type === "polygon";
      if (isPolygon) geometry = new Polygon(data?.data?.coordinates);
      else geometry = new LineString(data?.data?.coordinates);
      let measurmentValue = 0;
      if (geometry) {
        measurmentValue = isPolygon ? getArea(geometry) : getLength(geometry);
      }

      setEditOptions({
        label: data?.data?.label || data?.data?.lable,
        geom: data?.data?.properties?.geometry,
        convertedOutput: data?.data?.measurement,
        isPolygon: data?.type === "polygon",
        featureID: data?.featureId,
        measurement: measurmentValue,
        featureData: data?.data,
        type: data?.type,
      });
      centerMapOnFeature(data?.data?.properties?.geometry, map);
    } else if (["kml", "kmz", "shp", "shz", "dxf"].includes(data.type)) {
      setEditOptions({
        label: data?.data?.label || data?.data?.lable,
        isPolygon: false,
        featureID: data?.data?.id,
        type: data?.type,
        featureData: data.data,
      });
      const layer = getLayerById(data?.data?.id);
      if (!layer || !layer?.getSource()?.getExtent()) return;
      map.getView().fit(layer.getSource().getExtent(), {
        padding: [50, 50, 50, 50],
      });
    }
  };

  const deleteHandler = async (id) => {
    // Await the backend deletion and check for success.
    const result = await deleteAnnotationToOrtho(id);

    if (!result.success) {
      // Error toast is already handled in the utility function. Stop here.
      return;
    }

    // If backend deletion is successful, now we update the UI.
    try {
      // Step 1: Remove the visual representation from the OpenLayers map.
      if (["kml", "kmz", "shp", "shz", "dxf"].includes(data.type)) {
        // It's a layer. Find all layers matching the ID and remove them.
        const layersToRemove = getLayersById(id);
        if (layersToRemove.length > 0) {
          layersToRemove.forEach((layer) => map.removeLayer(layer));
        }
      } else {
        // It's a feature (pin, line, polygon).
        // Remove the feature from the vector source.
        const feature = source?.getFeatureById(id);
        if (feature) {
          source.removeFeature(feature);
        }

        // Remove the associated measurement overlay from the map.
        const overlay = map.getOverlayById(`overlay-${id}`);
        if (overlay) {
          map.removeOverlay(overlay);
        }
      }

      // Step 2: Update the application's state to remove the item from the list.
      const filteredAnnotations = annotations.filter((e) => e.data.id !== id);
      updateAnnotation(filteredAnnotations);

      // Step 3: If the deleted item was being edited, clear the edit panel.
      if (editOptions?.featureID === id) {
        setEditOptions(null);
        localStorage.removeItem('selectedFeatureId');
      }

      toast.success("Item deleted successfully.");
    } catch (error) {
      toast.error("An error occurred while removing the item from the map.");
      console.error("UI update error after deletion:", error);
    }
  };

  const addStaticAnnotationfunc = (data) => {
    addStaticAnnotation(data);
  };
  useEffect(() => {
    switch (data.type) {
      case "polygon":
      case "line": {
        const feature = deserializeFeature(
          { ...data?.data, featureId: data?.featureId },
          data.type === "Polygon" || data.type === "polygon"
        );
        source.addFeature(feature);
        const geom = feature?.getGeometry();
        const unit = document.getElementById("unitConversion").value;
        const output = formatLength(geom, unit);
        const center = getCenter(geom.getExtent());
        const measurementOverlay = createMeasurementOverlay(
          output,
          center,
          data?.featureId
        );
        map.addOverlay(measurementOverlay);
        break;
      }
      case "pin": {
        pinFeature = createPinFeature(data?.data?.coords);
        if (!pinFeature) return;
        const center = pinFeature?.getGeometry()?.getCoordinates();
        const measurementOverlay = createPinOverlay(
          data?.data?.label || data?.data?.lable,
          center,
          data?.featureId
        );
        map.addOverlay(measurementOverlay);
        pinFeature?.setId(data?.featureId);
        pinFeature?.set("featureId", data?.featureId);
        pinFeature?.set("label", data?.data?.label || data?.data?.lable);
        source?.addFeature(pinFeature);
        break;
      }
      case "kml":
      case "kmz": {
        handleKmlKmzFiles(
          null,
          data?.data?.url,
          map,
          true,
          data?.data?.id,
          data?.data?.lable,
          setEditOptionsFunc,
          source,
          addStaticAnnotationfunc
        );
        break;
      }
      case "shp":
      case "shz": {
        FetchedhHandleShpFile(
          map,
          data?.data?.url,
          data?.data?.id,
          data?.data?.lable,
          setEditOptionsFunc,
          source,
          addStaticAnnotationfunc
        );
        break;
      }
      case "dxf": {
        handleDwgDxfFiles(
          null,
          map,
          data?.data?.url,
          data?.data?.id,
          data?.data?.lable,
          setEditOptionsFunc,
          source,
          addStaticAnnotationfunc
        );
        break;
      }
      default:
        console.log("Unsupported file type:", data?.type);
    }
    let icon;
    switch (data.type) {
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
    setIcon(icon);
  }, [annotations]);

  return (
    <li
      id={`li-item${index + localStorage.getItem("orthoId")}`}
      data-feature-id={data?.data?.id}
      // className={editOptions?.featureID === data?.data?.id ? "select" : ""}
      key={index}
    >
      <div
        className="annotation-item-left"
        style={{ gap: ".3rem", width: "100%" }}
      >
        <input
          type="checkbox"
          className="measurement-checkbox"
          data-index={`${index}`}
          checked={isChecked}
          onChange={checkboxHandler}
        />
        <div
          className="flex align-center"
          onClick={() => clickHandler(data?.data?.id)}
          style={{ gap: ".3rem", width: "100%" }}
        >
          {/* <i className={`fa-solid ${Icon}`}></i> */}
          {Icon}
          <div
            id={`sidenav-list-item-r1${index}`}
            style={{ width: "100%" }}
            // style={{ minWidth: "200px" }}
          >
            <span>
              {stringShortner(data?.data?.label || data?.data?.lable)}
            </span>
          </div>
        </div>
      </div>
      <button
        className="annotation-item-delete-btn"
        onClick={() => deleteHandler(data?.data?.id)}
      >
        <i className="fas fa-trash" style={{ fontSize: "15px" }}></i>
      </button>
    </li>
  );
};

export default AnnotationItem;