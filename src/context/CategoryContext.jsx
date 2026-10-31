import { createContext, useContext } from "react";
import { defaultCategoryConfig, categoryById } from "../utils/categoryConfig.js";

const CategoryContext = createContext(defaultCategoryConfig());
export function CategoryProvider({ config, children }) {
  return <CategoryContext.Provider value={config}>{children}</CategoryContext.Provider>;
}
export function useCategories() {
  const config = useContext(CategoryContext);
  return { ...config, getCategoryById: (id) => categoryById(config, id) };
}
