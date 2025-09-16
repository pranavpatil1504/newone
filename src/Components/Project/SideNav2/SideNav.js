// import React, { useContext, useEffect, useState } from "react";
// import {
//   extentionScrapper,
//   getIcons,
//   hexToRgba,
//   removeSelectedStyle,
//   renderFeatureData,
//   rgbToHexa,
// } from "../../../utils/Functions";
// import { formatArea, formatLength } from "../../../utils/measurements";
// import { useMap } from "../../../context/Map";
// import { useEditOptions } from "../../../context/editOptionsDetails";
// import { transform } from "ol/proj";
// import { AnnotationsContext } from "../../../context/Annotations";
// import Style from "ol/style/Style";
// import Stroke from "ol/style/Stroke";
// import Fill from "ol/style/Fill";
// import { api } from "../../../config";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { getCenter } from "ol/extent";

// const SideNav = ({ adjustHeight, width, selectedUnit }) => {
//   const { map, source } = useMap();
//   const { editOptions, setEditOptions } = useEditOptions();
//   const { annotations, updateAnnotation } = useContext(AnnotationsContext);
//   const [label, setLabels] = useState("");
//   const [stroke, setStroke] = useState("#ffffff"); // Default value
//   const [opacity, setOpacity] = useState(1); // Default value
//   const [fill, setFill] = useState("#ffffff"); // Default value
//   const [lat, setLat] = useState(0);
//   const [lon, setLon] = useState(0);
//   const [feature, setFeature] = useState(null);
//   const [showSave, setShowSave] = useState(false);
//   const [layer, setLayer] = useState();
//   const [fileFeature, setFileFeature] = useState();
//   const [geometryType, setGeometryType] = useState();
//   const [propertyNames, setPropertyNames] = useState();

//   function getLayerById(id) {
//     const layers = map?.getLayers()?.getArray();
//     return layers.find((layer) => layer.get("layerId") === id);
//   }

//   useEffect(() => {
//     // Clear state if nothing is selected or if essential data is missing
//     if (!editOptions || !editOptions.featureID || !source || !map) {
//       setFeature(null);
//       setLat(0);
//       setLon(0);
//       setLabels("");
//       return;
//     }

//     setLabels(editOptions?.label);

//     const currentFeature =
//       source.getFeatureById(editOptions.featureID) || editOptions.feature;

//     if (currentFeature) {
//       setFeature(currentFeature);
//       const geometry = currentFeature.getGeometry();
//       if (geometry) {
//         const extent = geometry.getExtent();
//         const center = getCenter(extent);

//         // This correctly transforms coordinates for display
//         const lonLat = transform(
//           center,
//           map.getView().getProjection(),
//           "EPSG:4326"
//         );
//         setLon(lonLat[0].toFixed(6));
//         setLat(lonLat[1].toFixed(6));
//       }
//     } else {
//       setFeature(null);
//     }

//     // This part correctly sets the initial style values from the feature data
//     if (editOptions.featureData?.style) {
//       setFill(rgbToHexa(editOptions.featureData.style.fillColor));
//       setOpacity(editOptions.featureData.style.fillOpacity);
//       setStroke(editOptions.featureData.style.strokeColor);
//     }
//   }, [editOptions, source, map]);

//   const closeHandler = () => {
//     const measurementItems = document.querySelectorAll("#measurements li");
//     const layerItems = document.querySelectorAll("#layers li");
//     [...measurementItems, ...layerItems]?.forEach((item) => {
//       item.className = "";
//     });
//     setEditOptions();
//     removeSelectedStyle(source);
//   };

//   const labelHanlder = (newLabel) => {
//     setLabels(newLabel);
//     const updatedAnnotations = annotations.map((annot) => {
//       if (annot.data.id === editOptions?.featureID) {
//         return {
//           ...annot,
//           data: { ...annot.data, label: newLabel, lable: newLabel },
//         };
//       }
//       return annot;
//     });
//     updateAnnotation(updatedAnnotations);
//     setShowSave(true);
//   };

//   const updateFeatureStyle = () => {
//     if (feature) {
//       const newStyle = new Style({
//         ...(editOptions?.type !== "pin" && {
//           stroke: new Stroke({ color: stroke, width: 2 }),
//         }),
//         ...(editOptions?.type === "polygon" && {
//           fill: new Fill({ color: hexToRgba(fill, opacity) }),
//         }),
//       });
//       feature.setStyle(newStyle);
//       feature.set("storedStyle", newStyle);
//       setFeature(feature);
//     }
//     setShowSave(true);
//   };

//   const saveHandler = async () => {
//     if (!editOptions?.featureID || !feature) {
//       toast.error("No feature selected to save.");
//       return;
//     }
//     try {
//       const geometry = feature.getGeometry();
//       feature.set("name", label);
//       if (editOptions?.type !== "pin") feature.set("strokeColor", stroke);
//       if (editOptions?.type === "polygon") {
//         feature.set("fillColor", hexToRgba(fill, Number(opacity)));
//         feature.set("fillOpacity", Number(opacity));
//       }
//       await axios.put(
//         `${api}/updateMeasurementByFeatureId/${editOptions?.featureID}`,
//         {
//           featureId: editOptions?.featureID,
//           type: geometry?.getType(),
//           label,
//           coordinates: geometry.getCoordinates(),
//           style: {
//             strokeColor: stroke,
//             fillColor: hexToRgba(fill, Number(opacity)),
//             fillOpacity: Number(opacity),
//           },
//           properties: feature?.getProperties(),
//         }
//       );
//       toast.success("Changes saved successfully!");
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to save changes.");
//     }
//     setShowSave(false);
//   };

//   return (
//     <div
//       id="sidebar"
//       className="sidebar sidenav2"
//       style={{
//         height: adjustHeight ? "calc(100vh - 148px)" : "calc(100vh - 48px)",
//         width: `${width}%`,
//       }}
//     >
//       <div id="edit-options">
//         {!editOptions ? (
//           <div className="before-select">
//             <div className="before-select-icon">
//               <i className="fa-solid fa-arrow-pointer"></i>
//             </div>
//             <p className="before-select-text">
//               Select an object to view its properties or modify it.
//             </p>
//           </div>
//         ) : (
//           <>
//             <div className="edit-header">
//               {getIcons(editOptions?.type)}
//               <h5>{label}</h5>
//             </div>

//             <input
//               type="text"
//               className="edit-name"
//               id="name"
//               value={label || ""}
//               onChange={(e) => labelHanlder(e.target.value)}
//               placeholder="Enter a new name"
//             />

//             {/* Show Stroke for BOTH Line and Polygon */}
//             {(editOptions?.type === "line" ||
//               editOptions?.type === "polygon") && (
//               <div className="edit-control-group">
//                 <label htmlFor="stroke" className="edit-label">
//                   Stroke
//                 </label>
//                 <div className="edit-color-input">
//                   <input
//                     id="stroke"
//                     type="color"
//                     defaultValue={stroke}
//                     className="edit-stroke"
//                     onInput={(e) => {
//                       setStroke(e.target.value);
//                       updateFeatureStyle();
//                     }}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Show Fill and Opacity ONLY for Polygon */}
//             {editOptions?.type === "polygon" && (
//               <>
//                 <div className="edit-control-group">
//                   <label htmlFor="fillColor" className="edit-label">
//                     Fill
//                   </label>
//                   <div className="edit-color-input">
//                     <input
//                       type="color"
//                       id="fillColor"
//                       defaultValue={fill}
//                       onInput={(e) => {
//                         setFill(e.target.value);
//                         updateFeatureStyle();
//                       }}
//                       className="edit-fill"
//                     />
//                   </div>
//                 </div>
//                 <div className="edit-control-group">
//                   <label htmlFor="fillOpacity" className="edit-label">
//                     Opacity
//                   </label>
//                   <input
//                     type="range"
//                     id="fillOpacity"
//                     min="0"
//                     max="1"
//                     step="0.01"
//                     defaultValue={opacity}
//                     onInput={(e) => {
//                       setOpacity(e.target.value);
//                       updateFeatureStyle();
//                     }}
//                     className="edit-opacity"
//                   />
//                 </div>
//               </>
//             )}

//             <hr className="light-hr" />
//             <div className="info-section">
//               <div className="info-row">
//                 <span>Latitude</span>
//                 <b>{lat}</b>
//               </div>
//               <div className="info-row">
//                 <span>Longitude</span>
//                 <b>{lon}</b>
//               </div>
//             </div>
//             <hr className="light-hr" />

//             {/* Single, correct Measurement section for Line and Polygon */}
//             {(editOptions?.type === "line" ||
//               editOptions?.type === "polygon") &&
//               feature?.getGeometry() && (
//                 <div className="info-section">
//                   <h6>Measurement</h6>
//                   <div className="info-row">
//                     <span>
//                        {editOptions.isPolygon
//                         ? formatArea(
//                             feature.getGeometry(),
//                             selectedUnit,
//                             map.getView().getProjection()
//                           )
//                         : formatLength(
//                             feature.getGeometry(),
//                             selectedUnit,
//                             map.getView().getProjection()
//                           )} 

//                     </span>
//                   </div>
//                 </div>
//               )}

//             {/* Logic for displaying file features (KML, etc.) */}
//             {!["pin", "polygon", "line"].includes(editOptions?.type) && (
//               <div id="featureDataContainer">
//                 <p style={{ fontSize: "12px", marginBlock: "1rem" }}>
//                   <strong>Geometry Type: </strong>
//                   {geometryType}
//                 </p>
//                 {renderFeatureData(
//                   propertyNames,
//                   fileFeature,
//                   extentionScrapper(label)
//                 )}
//               </div>
//             )}

//             {showSave && (
//               <button id="save-btn-line" onClick={() => saveHandler()}>
//                 Save
//               </button>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SideNav;

import React, { useContext, useEffect, useState } from "react";
import {
  extentionScrapper,
  getIcons,
  hexToRgba,
  removeSelectedStyle,
  renderFeatureData,
  rgbToHexa,
} from "../../../utils/Functions";
import { formatArea, formatLength } from "../../../utils/measurements";
import { useMap } from "../../../context/Map";
import { useEditOptions } from "../../../context/editOptionsDetails";
import { transform } from "ol/proj";
import { AnnotationsContext } from "../../../context/Annotations";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { api } from "../../../config";
import axios from "axios";
import { toast } from "react-toastify";
import { getCenter } from "ol/extent";

const SideNav = ({ adjustHeight, width, selectedUnit }) => {
  const { map, source } = useMap();
  const { editOptions, setEditOptions } = useEditOptions();
  const { annotations, updateAnnotation } = useContext(AnnotationsContext);
  const [label, setLabels] = useState("");
  const [stroke, setStroke] = useState("#ffffff"); // Default value
  const [opacity, setOpacity] = useState(1); // Default value
  const [fill, setFill] = useState("#ffffff"); // Default value
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [feature, setFeature] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [layer, setLayer] = useState();
  const [fileFeature, setFileFeature] = useState();
  const [geometryType, setGeometryType] = useState();
  const [propertyNames, setPropertyNames] = useState();

  function getLayerById(id) {
    const layers = map?.getLayers()?.getArray();
    return layers.find((layer) => layer.get("layerId") === id);
  }

  useEffect(() => {
    if (!editOptions || !editOptions.featureID || !source || !map) {
      setFeature(null);
      setLat(0);
      setLon(0);
      setLabels("");
      return;
    }

    setLabels(editOptions?.label);

    const currentFeature =
      source.getFeatureById(editOptions.featureID) || editOptions.feature;

    if (currentFeature) {
      setFeature(currentFeature);
      const geometry = currentFeature.getGeometry();
      if (geometry) {
        const extent = geometry.getExtent();
        const center = getCenter(extent);

        const lonLat = transform(
          center,
          map.getView().getProjection(),
          "EPSG:4326"
        );
        setLon(lonLat[0].toFixed(6));
        setLat(lonLat[1].toFixed(6));
      }
    } else {
      setFeature(null);
    }

    if (editOptions.featureData?.style) {
      setFill(rgbToHexa(editOptions.featureData.style.fillColor));
      setOpacity(editOptions.featureData.style.fillOpacity);
      setStroke(editOptions.featureData.style.strokeColor);
    }
  }, [editOptions, source, map]);

  const closeHandler = () => {
    const measurementItems = document.querySelectorAll("#measurements li");
    const layerItems = document.querySelectorAll("#layers li");
    [...measurementItems, ...layerItems]?.forEach((item) => {
      item.className = "";
    });
    setEditOptions();
    removeSelectedStyle(source);
  };

  const labelHanlder = (newLabel) => {
    setLabels(newLabel);
    const updatedAnnotations = annotations.map((annot) => {
      if (annot.data.id === editOptions?.featureID) {
        return {
          ...annot,
          data: { ...annot.data, label: newLabel, lable: newLabel },
        };
      }
      return annot;
    });
    updateAnnotation(updatedAnnotations);
    setShowSave(true);
  };

  const updateFeatureStyle = () => {
    if (feature) {
      const newStyle = new Style({
        ...(editOptions?.type !== "pin" && {
          stroke: new Stroke({ color: stroke, width: 2 }),
        }),
        ...(editOptions?.type === "polygon" && {
          fill: new Fill({ color: hexToRgba(fill, opacity) }),
        }),
      });
      feature.setStyle(newStyle);
      feature.set("storedStyle", newStyle);
      setFeature(feature);
    }
    setShowSave(true);
  };

  const saveHandler = async () => {
    if (!editOptions?.featureID || !feature) {
      toast.error("No feature selected to save.");
      return;
    }
    try {
      const geometry = feature.getGeometry();
      feature.set("name", label);
      if (editOptions?.type !== "pin") feature.set("strokeColor", stroke);
      if (editOptions?.type === "polygon") {
        feature.set("fillColor", hexToRgba(fill, Number(opacity)));
        feature.set("fillOpacity", Number(opacity));
      }

      // --- START: MODIFIED BLOCK ---
      const payload = {
        featureId: editOptions?.featureID,
        type: geometry?.getType(),
        label,
        coordinates: geometry.getCoordinates(),
        style: {
          strokeColor: stroke,
          fillColor: hexToRgba(fill, Number(opacity)),
          fillOpacity: Number(opacity),
        },
        properties: feature?.getProperties(),
      };

      await axios.put(
        `${api}/updateMeasurementByFeatureId/${editOptions?.featureID}`,
        payload
      );

      // THIS IS THE CRITICAL FIX: Update the central state after saving
      const updatedAnnotations = annotations.map(annot => {
        if (annot.data.id === editOptions?.featureID) {
          // Find the annotation being edited and return its new state
          return {
            ...annot,
            data: {
              ...annot.data,
              label: label,
              lable: label,
              style: payload.style, // Use the exact style object we just saved
            },
            label: label, // Also update the top-level label for consistency
          };
        }
        return annot; // Return all other annotations unchanged
      });

      updateAnnotation(updatedAnnotations); // Update the context

      toast.success("Changes saved successfully!");
      // --- END: MODIFIED BLOCK ---
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
        height: adjustHeight ? "calc(100vh - 148px)" : "calc(100vh - 48px)",
        width: `${width}%`,
      }}
    >
      <div id="edit-options">
        {!editOptions ? (
          <div className="before-select">
            <div className="before-select-icon">
              <i className="fa-solid fa-arrow-pointer"></i>
            </div>
            <p className="before-select-text">
              Select an object to view its properties or modify it.
            </p>
          </div>
        ) : (
          <>
            <div className="edit-header">
              {getIcons(editOptions?.type)}
              <h5>{label}</h5>
            </div>

            <input
              type="text"
              className="edit-name"
              id="name"
              value={label || ""}
              onChange={(e) => labelHanlder(e.target.value)}
              placeholder="Enter a new name"
            />

            {(editOptions?.type === "line" ||
              editOptions?.type === "polygon") && (
                <div className="edit-control-group">
                  <label htmlFor="stroke" className="edit-label">
                    Stroke
                  </label>
                  <div className="edit-color-input">
                    <input
                      id="stroke"
                      type="color"
                      value={stroke}
                      className="edit-stroke"
                      onInput={(e) => {
                        setStroke(e.target.value);
                        updateFeatureStyle();
                      }}
                    />
                  </div>
                </div>
              )}

            {editOptions?.type === "polygon" && (
              <>
                <div className="edit-control-group">
                  <label htmlFor="fillColor" className="edit-label">
                    Fill
                  </label>
                  <div className="edit-color-input">
                    <input
                      type="color"
                      id="fillColor"
                      value={fill}
                      onInput={(e) => {
                        setFill(e.target.value);
                        updateFeatureStyle();
                      }}
                      className="edit-fill"
                    />
                  </div>
                </div>
                <div className="edit-control-group">
                  <label htmlFor="fillOpacity" className="edit-label">
                    Opacity
                  </label>
                  <input
                    type="range"
                    id="fillOpacity"
                    min="0"
                    max="1"
                    step="0.01"
                    defaultValue={opacity}
                    onInput={(e) => {
                      setOpacity(e.target.value);
                      updateFeatureStyle();
                    }}
                    className="edit-opacity"
                  />
                </div>
              </>
            )}

            <hr className="light-hr" />
            <div className="info-section">
              <div className="info-row">
                <span>Latitude</span>
                <b>{lat}</b>
              </div>
              <div className="info-row">
                <span>Longitude</span>
                <b>{lon}</b>
              </div>
            </div>
            <hr className="light-hr" />

            {(editOptions?.type === "line" ||
              editOptions?.type === "polygon") &&
              feature?.getGeometry() && (
                <div className="info-section">
                  <h6>Measurement</h6>
                  <div className="info-row">
                    <span>
                      {(() => {
                        const geomClone = feature.getGeometry().clone();
                        const geomLonLat = geomClone.transform(
                          map.getView().getProjection(),
                          "EPSG:3857"
                        );

                        return editOptions.isPolygon
                          ? formatArea(geomLonLat, selectedUnit)
                          : formatLength(geomLonLat, selectedUnit);
                      })()}
                    </span>
                  </div>
                </div>
              )}

            {!["pin", "polygon", "line"].includes(editOptions?.type) && (
              <div id="featureDataContainer">
                <p style={{ fontSize: "12px", marginBlock: "1rem" }}>
                  <strong>Geometry Type: </strong>
                  {geometryType}
                </p>
                {renderFeatureData(
                  propertyNames,
                  fileFeature,
                  extentionScrapper(label)
                )}
              </div>
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

export default SideNav;
