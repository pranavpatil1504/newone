import React from "react";
import AnnotaitonSeciton from "./AnnotaitonSeciton";

const AnnotationsDivCompare = ({ a1, a2, s1, s2, m1, m2, width }) => {
  return (
    <div className="annotation-div-compare" style={{ width: `${width}%` }}>
      <AnnotaitonSeciton number={1} data={a1} source={s1} map={m1} />
      <AnnotaitonSeciton number={2} data={a2} source={s2} map={m2} />
    </div>
  );
};

export default AnnotationsDivCompare;
