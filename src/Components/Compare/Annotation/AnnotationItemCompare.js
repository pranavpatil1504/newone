import React, { useContext, useEffect, useState } from "react";
import {
  handleSideNavItemClick,
  stringShortner,
} from "../../../utils/Functions";
import { useEditOptions } from "../../../context/editOptionsDetails";
import { useMap } from "../../../context/Map";
import {
  centerMapOnFeature,
  createPinFeature,
  handleCheckboxChange,
  listItemStyleChange,
  showMeasumentLabels,
} from "../../../utils/map";
import { AnnotationsContext } from "../../../context/Annotations";
import { handleKmlKmzFiles } from "../../../utils/File/KmlKmz/KmlKmzFile";
import { handleDwgDxfFiles } from "../../../utils/File/DXF/DXfFile";
import { FetchedhHandleShpFile } from "../../../utils/File/ShpShz/FileHandler";
import { LineString, Polygon } from "ol/geom";
import { getLength, getArea } from "ol/sphere";

const AnnotationItemCompare = ({ data, index, source, map }) => {
  const [isChecked, setIsChecked] = useState(true);
  const [maps, setMap] = useState(map);
  const [sources, setSource] = useState(source);
  const { setEditOptions } = useEditOptions();
  const [Icon, setIcon] = useState();
  const { addStaticAnnotation } = useContext(AnnotationsContext);
  
  useEffect(() => {
    setMap(map);
    setSource(source);
  }, [map, source]);

  // --- THIS ENTIRE USEEFFECT HOOK HAS BEEN REMOVED ---
  // The logic for drawing annotations is now handled in the main Compare.js component
  // to prevent them from disappearing when the sidebar is hidden.
  // We only keep the logic for file-based layers (KML, SHP) here as they are user-initiated.
  
  useEffect(() => {
    const setEditOptionsFunc = (data) => setEditOptions(data);
    const addStaticAnnotationFunc = (data) => addStaticAnnotation(data);
    
    // File-based layers still need to be handled on mount
    switch (data.type) {
      case "kml":
      case "kmz":
        handleKmlKmzFiles( null, data?.data?.url, maps, true, data?.data?.id, data?.data?.lable, setEditOptionsFunc, sources, addStaticAnnotationFunc );
        break;
      case "shp":
      case "shz":
        FetchedhHandleShpFile( maps, data?.data?.url, data?.data?.id, data?.data?.lable, setEditOptionsFunc, sources, addStaticAnnotationFunc );
        break;
      case "dxf":
        handleDwgDxfFiles( null, maps, data?.data?.url, data?.data?.id, data?.data?.lable, setEditOptionsFunc, sources, addStaticAnnotationFunc );
        break;
      default:
        // Pin, Polygon, and Line are handled by the parent Compare.js
        break;
    }
  }, [data, maps, sources]); // Depend on specific props

  function getLayersById(id) {
    const layers = map?.getLayers()?.getArray();
    const filter = layers?.filter(
      (layer) => layer?.get("layerId") === id
    );
    return filter;
  }

  const checkboxHandler = () => {
    setIsChecked(!isChecked);
    if (["kml", "kmz", "shp", "shz", "dxf"].includes(data.type)) {
      const layers = getLayersById(data?.data?.id);
      if (layers.length > 0) {
        layers.forEach((e) => e?.setVisible(!isChecked));
      }
      return;
    }
    // This handles pins, lines, polygons
    handleCheckboxChange(data.featureId, !isChecked, sources, data?.featureId);
  };

  const clickHandler = (id) => {
    showMeasumentLabels(data?.featureId);
    listItemStyleChange(id);
    localStorage.setItem("compare-annotation-id", data.data?.id);
    const righteToggle = document.getElementById("collapse-right");
    const sidenav2 = document.getElementById("show-compare-sidenav-two");
    if (righteToggle) righteToggle.style.right = "26%";
    if (sidenav2) sidenav2.style.display = "block";

    if (data.type === "pin") {
      const pin = createPinFeature(data?.data?.coords);
      setEditOptions({
        label: data?.data?.label || data?.data?.lable,
        feature: pin, featureID: data?.featureId, type: data?.type,
      });
      const pinCoords = pin?.getGeometry()?.getCoordinates();
      handleSideNavItemClick(pin, sources, data?.featureId);
      maps.getView().setCenter(pinCoords);
    } else if (["line", "polygon"].includes(data.type)) {
      let geometry;
      const isPolygon = data?.type === "polygon";
      if (isPolygon) geometry = new Polygon(data?.data?.coordinates);
      else geometry = new LineString(data?.data?.coordinates);
      let measurmentValue = 0;
      if (geometry) measurmentValue = isPolygon ? getArea(geometry) : getLength(geometry);

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
        isPolygon: false, featureID: data.data?.id, type: data?.type,
      });
      const layer = maps?.getLayers().getArray().find((layer) => layer.get("layerId") === data?.data?.id);
      if (layer?.getSource()?.getExtent()) {
        map.getView().fit(layer.getSource().getExtent(), {
          padding: [50, 50, 50, 50],
        });
      }
    }
  };
  
  // This effect sets the icon in the list. It is purely for UI and is safe.
  useEffect(() => {
    let icon;
    switch (data.type) {
      case "pin":
        icon = ( <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" className="annotation-icon" focusable="false" > <path d="M8 2a4.1 4.1 0 0 0-4 4.2C4 9.35 8 14 8 14s4-4.65 4-7.8A4.1 4.1 0 0 0 8 2Zm0 6a2 2 0 0 1-1.9-2A2 2 0 0 1 8 4a2 2 0 0 1 1.9 2A2 2 0 0 1 8 8Z" fill="#FFFFFF" ></path> </svg> );
        break;
      case "line":
        icon = ( <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" className="annotation-icon" focusable="false" > <path d="M12.5 2a1.491 1.491 0 0 0-1.35 2.143L4.143 11.15a1.515 1.515 0 1 0 .707.707l7.007-7.007A1.498 1.498 0 1 0 12.5 2Z" fill="#FFFFFF" ></path> </svg> );
        break;
      case "polygon":
        icon = ( <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" className="annotation-icon" focusable="false" > <path d="M13 11.092V4.908A1.496 1.496 0 1 0 11.092 3H4.908A1.496 1.496 0 1 0 3 4.908v6.184A1.496 1.496 0 1 0 4.908 13h6.184a1.495 1.495 0 0 0 2.47.562 1.497 1.497 0 0 0-.562-2.47ZM11.092 12H4.908A1.494 1.494 0 0 0 4 11.092V4.908A1.495 1.495 0 0 0 4.908 4h6.184a1.495 1.495 0 0 0 .908.908v6.184a1.495 1.495 0 0 0-.908.908Z" fill="#FFFFFF" ></path> </svg> );
        break;
      case "kml": case "kmz": case "shp": case "shz": case "dxf":
        icon = ( <svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" focusable="false" className="annotation-icon" > <path d="M11 2H5l3 3 3-3Z" fill="#FFFFFF"></path> <path d="M14 11V3a1 1 0 0 0-1-1L9 6l5 5Z" fill="#FFFFFF"></path> <path d="M7 6 3 2a1 1 0 0 0-1 1v8l3-3 2-2Z" fill="#FFFFFF"></path> <path d="M2 13a1 1 0 0 0 1 1h6l-4-4-3 3Z" fill="#FFFFFF"></path> <path d="m6 9 5 5h2a1 1 0 0 0 1-1L8 7 6 9Z" fill="#FFFFFF"></path> </svg> );
        break;
      default:
        break;
    }
    setIcon(icon);
  }, [data.type]); // Fixed dependency array

  return (
    <li
      id={`li-item${index + localStorage.getItem("orthoId")}`}
      data-feature-id={data?.data?.id}
      key={index}
    >
      <div className="flex" style={{ gap: ".3rem", width: "100%" }}>
        <input
          type="checkbox"
          className="measurement-checkbox"
          data-index={`${index}`}
          checked={isChecked}
          onChange={() => checkboxHandler()}
        />
        <div
          className="flex align-center"
          onClick={() => clickHandler(data?.data?.id)}
          style={{ gap: ".3rem", width: "100%" }}
        >
          {Icon}
          <div
            id={`sidenav-list-item-r1${index}`}
            style={{ width: "100%" }}
          >
            <span>
              {stringShortner(data?.data?.label || data?.data?.lable)}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
};

export default AnnotationItemCompare;