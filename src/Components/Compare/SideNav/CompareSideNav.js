import React, { useContext, useEffect, useState } from "react";
import {
  extentionScrapper,
  getIcons,
  hexToRgba,
  removeSelectedCompareStyle,
  renderFeatureData,
  rgbToHexa,
} from "../../../utils/Functions";
import { formatArea, formatLength } from "../../../utils/measurements";
import { useEditOptions } from "../../../context/editOptionsDetails";
import { AnnotationsContext } from "../../../context/Annotations";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { api } from "../../../config";
import axios from "axios";
import { toast } from "react-toastify";
import { useUnit } from "../../../context/UnitContext"; // Import the useUnit hook

const CompareSideNav = ({ adjustHeight, map, source, width }) => {
  const { editOptions, setEditOptions } = useEditOptions();
  const { annotations, setAnnotations } = useContext(AnnotationsContext);
  const { selectedUnit } = useUnit(); // Get the selected unit from context
  const [label, setLabels] = useState("");
  const [stroke, setStroke] = useState("");
  const [opacity, setOpacity] = useState(0);
  const [fill, setFill] = useState();
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [feature, setFeature] = useState();
  const [showSave, setShowSave] = useState(false);
  const [layer, setLayer] = useState();
  const [fileFeature, setFileFeature] = useState();
  const [geometryType, setGeometryType] = useState();
  const [propertyNames, setPropertyNames] = useState();
  const [Extent, setExtent] = useState();
  const [showFeature, setShowFeature] = useState(false);

  function getLayerById(id) {
    const layers = map?.getLayers()?.getArray();
    return layers?.find((layer) => layer.get("layerId") === id);
  }

  useEffect(() => {
    if (!editOptions) return;
    setLabels(editOptions.label || editOptions.lable);
    const features = source?.getFeatureById(editOptions?.featureID);
    if (features) setFeature(features);
    let extent;
    if (editOptions.type == "pin") {
      const geom = editOptions?.feature?.getGeometry();
      extent = geom.getExtent();
    } else if (
      !["kml", "kmz", "shp", "shz", "dxf"].includes(editOptions.type)
    ) {
      if (editOptions?.geom?.extent_) {
        extent = editOptions?.geom.extent_;
      } else if (editOptions?.geom?.getExtent()) {
        extent = editOptions?.geom?.getExtent();
      }
      setFill(rgbToHexa(editOptions?.featureData?.style?.fillColor));
      setOpacity(editOptions?.featureData?.style?.fillOpacity);
      setStroke(editOptions?.featureData?.style?.strokeColor);
    }
    if (["kml", "kmz", "shp", "shz", "dxf"].includes(editOptions.type)) {
      const l = getLayerById(editOptions.featureID);
      setLayer(l);
      const s = l?.getSource();
      const features = s?.getFeatures();
      if (!features) return;
      const f = features[0];
      setFileFeature(features?.slice(0, 50));
      setGeometryType(f?.getGeometry()?.getType());
      const pNames = Object.keys(f?.getProperties()).filter(
        (key) => key !== "geometry"
      );
      setPropertyNames(pNames);
      setExtent(s?.getExtent());
      return;
    }
    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
    const x = center[0];
    const y = center[1];
    const Longitude = (x * 180) / 20037508.34;
    const Latitute =
      (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360) / Math.PI - 90;
    setLon(Longitude.toFixed(6));
    setLat(Latitute.toFixed(6));
  }, [editOptions]);

  const closeHandler = () => {
    const measurementItems = document.querySelectorAll("#measurements li");
    const layerItems = document.querySelectorAll("#layers li");
    [...measurementItems, ...layerItems]?.forEach((item) => {
      item.className = "";
    });
    setEditOptions();
    removeSelectedCompareStyle(source);
  };

  const labelHanlder = (string) => {
    const listItem = document.querySelector(
      `li[data-feature-id="${editOptions.featureID}"]`
    );
    listItem.querySelector("span").textContent = `${string}`;
    setShowSave(true);
  };

  const updateFeatureStyle = () => {
    if (feature) {
      const newStyle = new Style({
        ...(editOptions.type !== "pin" && {
          stroke: new Stroke({
            color: stroke,
            width: 2,
          }),
        }),
        ...(editOptions.type === "polygon" && {
          fill: new Fill({
            color: `${fill}${Math.round(opacity * 255)
              .toString(16)
              .padStart(2, "0")}`,
          }),
        }),
      });
      feature?.setStyle(newStyle);
      feature?.set("storedStyle", newStyle);
      setFeature(feature);
    }
    setShowSave(true);
  };

  const saveHandler = async () => {
    try {
      const geometry = feature.getGeometry();
      feature.set("name", label);
      
      if (editOptions?.type !== "pin") {
        feature.set("strokeColor", stroke);
        feature.set("strokeWidth", 2);
      }
      if (editOptions?.type === "polygon") {
        feature.set("fillColor", hexToRgba(fill, Number(opacity)));
        feature.set("fillOpacity", Number(opacity));
      }

      await axios.put(
        `${api}updateMeasurementByFeatureId/${editOptions.featureID}`,
        {
          featureId: editOptions?.featureId,
          type: geometry?.getType(),
          label,
          coordinates: geometry.getCoordinates(),
          style: {
            strokeColor: stroke,
            fillColor: hexToRgba(fill, Number(opacity)),
            fillOpacity: Number(opacity),
          },
          properties: feature.getProperties(),
        }
      );
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to save changes.");
    }
    setShowSave(false);
  };

  return (
    <div
      id="sidebar"
      className="sidebar sidenav2"
      style={{
        height: "calc(100vh - 44px)",
        width: `${width}%`,
      }}
    >
      <div id="edit-options">
        {!editOptions ? (
          <div className="before-select">
            <div>
              <p className="before-select-icon">
                <i className="fa-solid fa-arrow-pointer"></i>
              </p>
              <p className="before-select-text">
                Select an object to view its properties or modify it.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {getIcons(editOptions?.type)}
              <h5>{editOptions?.label}</h5>
            </div>
            <div className="flex align edit-inputs">
              <div className="flex align edit-inputs">
                <input
                  type="text"
                  className="edit-name"
                  id="name"
                  onChange={(e) => {
                    setLabels(e.target.value);
                    labelHanlder(e.target.value);
                  }}
                  placeholder={`${editOptions?.label || editOptions?.lable}`}
                />
              </div>
              {!["kml", "kmz", "shp", "shz", "dxf", "pin"].includes(
                editOptions.type
              ) && (
                  <div className="stroke-div">
                    <label htmlFor="stroke">Stroke </label>
                    <input
                      id="stroke"
                      type="color"
                      defaultValue={`${editOptions?.featureData?.style?.strokeColor}`}
                      className="edit-stroke"
                      onInput={(e) => {
                        setStroke(e.target.value);
                        updateFeatureStyle();
                      }}
                    />
                  </div>
                )}
              {editOptions?.type == "polygon" && (
                <div className="fill-div">
                  <label htmlFor="fillColor">Filler &nbsp; &nbsp;</label>
                  <input
                    type="color"
                    id="fillColor"
                    defaultValue={`${rgbToHexa(
                      editOptions?.featureData?.style?.fillColor
                    )}`}
                    onInput={(e) => {
                      setFill(e.target.value);
                      updateFeatureStyle();
                    }}
                    className="edit-fill"
                  />
                </div>
              )}
            </div>
            {editOptions?.type == "polygon" && (
              <div className="opacity-div">
                <label htmlFor="fillOpacity">Opacity</label>
                <input
                  type="range"
                  id="fillOpacity"
                  min="0"
                  max="1"
                  onInput={(e) => {
                    setOpacity(e.target.value);
                    updateFeatureStyle();
                  }}
                  step="0.01"
                  defaultValue={`${editOptions?.featureData?.style?.fillOpacity}`}
                  className="edit-opacity"
                />
              </div>
            )}
            {!["kml", "kmz", "shp", "shz", "dxf"].includes(
              editOptions.type
            ) && (
                <>
                  <br />
                  <hr className="light-hr" />
                  <h4 className="ll-text">
                    Latitute <b>{lat}</b>
                  </h4>
                  <h4 className="ll-text">
                    Longitude <b>{lon}</b>
                  </h4>
                  <hr className="light-hr" />
                </>
              )}
            {!["pin", "polygon", "line"].includes(editOptions.type) && (
              <>
                <div id="featureDataContainer">
                  <p style={{ fontSize: "12px", marginBlock: "1rem" }}>
                    <strong className="ll-text" style={{ fontSize: "12px" }}>
                      Geometry Type &nbsp;
                    </strong>
                    {geometryType}
                  </p>
                  {renderFeatureData(
                    propertyNames,
                    fileFeature,
                    extentionScrapper(label)
                  )}
                </div>
              </>
            )}
            {!["kml", "kmz", "shp", "shz", "dxf", "pin"].includes(
              editOptions.type
            ) &&
              feature?.getGeometry() && (
                <>
                  <h6 className="measurement-text">Measurement</h6>
                  <div className="conversions">
                    <p>
                      <span style={{ color: "white" }}>
                        {editOptions.isPolygon
                          ? formatArea(feature.getGeometry(), selectedUnit)
                          : formatLength(feature.getGeometry(), selectedUnit)}
                      </span>
                    </p>
                  </div>
                </>
              )}
            {showSave && (
              <button id="save-btn-line" onClick={() => saveHandler()}>
                Save
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompareSideNav;