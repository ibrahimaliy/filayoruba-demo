export interface ProductFilters {
  search: string;

  category: string;

  sort:
    | "featured"
    | "price-low"
    | "price-high"
    | "name";
}