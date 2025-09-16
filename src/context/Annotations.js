import React, { createContext, useState } from "react";

// Create the context for annotations
const AnnotationsContext = createContext();

// Create a provider component to manage annotations state
const AnnotationsProvider = ({ children }) => {
  // Initialize the annotations array in the state
  const [annotations, setAnnotations] = useState([]);
  const [staticAnnotations, setStaticAnnotations] = useState([]);

  // Function to add an annotation to the array
  const addAnnotation = (annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  };
  const addStaticAnnotation = (annotation) => {
    setStaticAnnotations((prev) => [...prev, annotation]);
  };

  // Function to update an annotation by index
  const updateAnnotation = (updatedAnnotation) => {
    // const updatedAnnotations = annotations.map((item, i) =>
    //   i === index ? updatedAnnotation : item
    // );
    setAnnotations(updatedAnnotation);
  };

  // Function to remove an annotation by index
  const removeAnnotation = (index) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
  };

  // Provide the annotations and functions to the rest of the app
  return (
    <AnnotationsContext.Provider
      value={{
        annotations,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        staticAnnotations,
        addStaticAnnotation,
      }}
    >
      {children}
    </AnnotationsContext.Provider>
  );
};

export { AnnotationsContext, AnnotationsProvider };
