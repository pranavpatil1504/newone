export function updateListItemIndexes() {
  const remainingItems = document.querySelectorAll("#measurements li");
  remainingItems.forEach((item, newIndex) => {
    item
      .querySelector("input[type='checkbox']")
      .setAttribute("data-index", newIndex);
    item.setAttribute("value", newIndex);
  });
}
export function updateLayerListItemIndexes() {
  const remainingItems = document.querySelectorAll("#layers li");
  remainingItems.forEach((item, newIndex) => {
    item
      .querySelector("input[type='checkbox']")
      .setAttribute("data-index", newIndex);
    item.setAttribute("value", newIndex);
  });
}
