import React, { useEffect, useState } from "react";
import { useOrthoContext } from "../../../context/OrthoContext";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import AnnotationItemCompare from "./AnnotationItemCompare";

const AnnotationSection = ({ number, data, source, map }) => {
  const [list, setList] = useState([]);
  const { ortho } = useOrthoContext();
  const [date, setDate] = useState();
  const [id, setId] = useState();
  const [selectedId, setSelectedId] = useState(); // State to control the selected option
  const navigate = useNavigate();
  const [annotationsList, setAnnotationList] = useState([]);
  const [layerList, setLayerList] = useState([]);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true); // Accordion for Annotations
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const params = useParams();

  const handleChange = (e) => {
    const newSelectedId = e.target.value;
    setSelectedId(newSelectedId); // Update the selected ID state
    if (number === 1) {
      navigate(`/compare/${params.id}/${newSelectedId}/${params.id2}`);
    } else {
      navigate(`/compare/${params.id}/${params.id1}/${newSelectedId}`);
    }
  };
  useEffect(() => {
    const selectedItem = ortho?.find(
      (e) => e._id === (number === 1 ? params.id1 : params.id2)
    );
    if (selectedItem) {
      setDate(selectedItem?.date);
      setId(selectedItem?._id);
      setSelectedId(selectedItem?._id);
    }
    if (ortho)
      setList([selectedItem, ...ortho.filter((e) => e !== selectedItem)]);

    const annot = data.filter(
      (e) => !["kml", "kmz", "shp", "shz", "dxf"].includes(e?.type)
    );
    setAnnotationList(annot);
    const layers = data.filter((e) =>
      ["kml", "kmz", "shp", "shz", "dxf"].includes(e?.type)
    );
    setLayerList(layers);
  }, [ortho, params, number, data]);
  return (
    <div className="compare-annotaiton-section">
      <div className="number-n-list align-center">
        <div className="compare-number">{number}</div>
        <select
          onChange={handleChange}
          value={selectedId}
          className="compare-select"
        >
          {/* Set value to control selection */}
          {list?.map((e, i) => (
            <option value={e?._id} key={i}>
              {moment(e?.date).format("DD-MM-YYYY")}
            </option>
          ))}
        </select>
      </div>
      <div className="compare-blank-div"></div>
      <div className="comprae-annotation-list">
        <div>
          <p
            onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)}
            style={{ cursor: "pointer", color: "white" }}
          >
            <i
              className={
                isAnnotationsOpen
                  ? "fa-solid fa-chevron-down"
                  : "fa-solid fa-chevron-right"
              }
              style={{ fontSize: "16px", marginRight: ".5rem", width: "16px" }}
            ></i>
            Annotations
          </p>
          {isAnnotationsOpen && (
            <ul id="measurements" className={"measurements" + number}>
              {annotationsList?.map((e) => (
                <AnnotationItemCompare
                  data={e}
                  key={e.id || e._id}
                  source={source}
                  map={map}
                />
              ))}
            </ul>
          )}
        </div>
        <div>
          <p
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            style={{ cursor: "pointer", marginTop: ".5rem", color: "white" }}
          >
            <i
              className={
                isLayersOpen
                  ? "fa-solid fa-chevron-down"
                  : "fa-solid fa-chevron-right"
              }
              style={{ fontSize: "16px", marginRight: ".5rem", width: "16px" }}
            ></i>
            Layers
          </p>
          {isLayersOpen && (
            <ul id="layers" style={{ marginTop: ".5rem" }}>
              {layerList?.map((e, i) => (
                <AnnotationItemCompare
                  data={e}
                  index={i}
                  key={i}
                  source={source}
                  map={map}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotationSection;
